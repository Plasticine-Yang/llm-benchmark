import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addressToCoords } from "../public/js/engine.js";

const ROWS = 20;
const COLS = 10;
const MAX_BODY_BYTES = 1_000_000;
const MAX_CELL_LENGTH = 8_000;
const ROW_LABELS = "ABCDEFGHIJ";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const isProduction = args.has("--prod");
const isDevelopment = args.has("--dev");
const publicDir = path.join(projectRoot, "public");
const distDir = path.join(projectRoot, "dist");
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(projectRoot, "data");
const workbookFile = process.env.WORKBOOK_FILE
  ? path.resolve(process.env.WORKBOOK_FILE)
  : path.join(dataDir, "workbook.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function pickStaticRoot() {
  if (isDevelopment) return publicDir;
  if (isProduction) {
    if (!fs.existsSync(path.join(distDir, "index.html"))) {
      console.error("Production build not found. Run `npm run build` first.");
      process.exit(1);
    }
    return distDir;
  }
  return fs.existsSync(path.join(distDir, "index.html")) ? distDir : publicDir;
}

const staticRoot = pickStaticRoot();

fs.mkdirSync(dataDir, { recursive: true });

function emptyWorkbook() {
  return { version: 1, cells: {}, updatedAt: null, writeVersion: 0 };
}

function normalizeStoredWorkbook(raw) {
  if (!raw || typeof raw !== "object" || !raw.cells || typeof raw.cells !== "object" || Array.isArray(raw.cells)) {
    return emptyWorkbook();
  }
  const cells = {};
  for (const [key, value] of Object.entries(raw.cells)) {
    const coords = addressToCoords(key);
    if (!coords || coords.row < 0 || coords.row >= ROWS || coords.col < 0 || coords.col >= COLS) continue;
    if (typeof value !== "string" || value.length === 0 || value.length > MAX_CELL_LENGTH) continue;
    cells[`${ROW_LABELS[coords.col]}${coords.row + 1}`] = value;
  }
  const writeVersion = Number.isSafeInteger(raw.writeVersion) && raw.writeVersion > 0 ? raw.writeVersion : 0;
  return {
    version: 1,
    cells,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
    writeVersion,
  };
}

function readWorkbookFile() {
  try {
    if (!fs.existsSync(workbookFile)) return emptyWorkbook();
    const text = fs.readFileSync(workbookFile, "utf8");
    return normalizeStoredWorkbook(JSON.parse(text));
  } catch (error) {
    console.error(`Could not read ${workbookFile}: ${error.message}`);
    return emptyWorkbook();
  }
}

let workbook = readWorkbookFile();

function persistWorkbook(incomingCells, incomingWriteVersion) {
  const cells = {};
  for (const [key, value] of Object.entries(incomingCells)) {
    const coords = addressToCoords(key);
    if (!coords || coords.row < 0 || coords.row >= ROWS || coords.col < 0 || coords.col >= COLS) {
      throw new ValidationError(`Cell address "${key}" is outside the 20 × 10 sheet.`);
    }
    if (typeof value !== "string") {
      throw new ValidationError(`Cell ${key} must be stored as a string.`);
    }
    if (value.length > MAX_CELL_LENGTH) {
      throw new ValidationError(`Cell ${key} is too long.`);
    }
    if (value === "") continue;
    const address = `${ROW_LABELS[coords.col]}${coords.row + 1}`;
    cells[address] = value;
  }

  if (Number.isFinite(incomingWriteVersion) && incomingWriteVersion > 0 && incomingWriteVersion < workbook.writeVersion) {
    return { ignored: true, workbook };
  }

  const next = {
    version: 1,
    cells,
    updatedAt: new Date().toISOString(),
    writeVersion: Number.isFinite(incomingWriteVersion) && incomingWriteVersion > 0 ? incomingWriteVersion : workbook.writeVersion,
  };

  const tempFile = `${workbookFile}.${process.pid}.${Date.now()}.tmp`;
  fs.mkdirSync(path.dirname(workbookFile), { recursive: true });
  fs.writeFileSync(tempFile, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  fs.renameSync(tempFile, workbookFile);
  workbook = next;
  return { ignored: false, workbook };
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = `${JSON.stringify(body)}\n`;
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  res.end(payload);
}

function readJsonBody(req) {
  const declaredLength = Number(req.headers["content-length"] || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return Promise.reject(new RequestError(413, "Request body is too large."));
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    let settled = false;
    const chunks = [];
    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        reject(new RequestError(413, "Request body is too large."));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      const text = Buffer.concat(chunks).toString("utf8");
      if (!text.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new RequestError(400, "Request body must be valid JSON."));
      }
    });
    req.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

function validateSavePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload.cells)) {
    throw new ValidationError("Expected a JSON object with a `cells` object.");
  }
  if (!payload.cells || typeof payload.cells !== "object") {
    throw new ValidationError("Missing `cells` object.");
  }
  return {
    cells: payload.cells,
    writeVersion: Number.isFinite(payload.version) ? payload.version : null,
  };
}

function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  let relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  if (relative.includes("\0")) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  const filePath = path.resolve(staticRoot, relative);
  if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${path.sep}`)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      relative = path.join(relative, "index.html");
      stat = fs.statSync(path.resolve(staticRoot, relative));
    }
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const finalPath = path.resolve(staticRoot, relative);
  const extension = path.extname(finalPath).toLowerCase();
  const body = fs.readFileSync(finalPath);
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Content-Length": body.length,
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
  if (req.method === "HEAD") res.end();
  else res.end(body);
}

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/api/health") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Method not allowed" }, { Allow: "GET, HEAD" });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Length": Buffer.byteLength(JSON.stringify({ ok: true, mode: isProduction ? "production" : "development" })),
    });
    if (req.method === "HEAD") res.end();
    else res.end(JSON.stringify({ ok: true, mode: isProduction ? "production" : "development" }));
    return;
  }

  if (pathname === "/api/workbook") {
    if (req.method === "GET" || req.method === "HEAD") {
      const body = JSON.stringify({
        cells: workbook.cells,
        updatedAt: workbook.updatedAt,
        revision: workbook.writeVersion,
      });
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      if (req.method === "HEAD") res.end();
      else res.end(body);
      return;
    }

    if (req.method === "PUT" || req.method === "POST") {
      const payload = await readJsonBody(req);
      const { cells, writeVersion } = validateSavePayload(payload);
      const result = persistWorkbook(cells, writeVersion);
      sendJson(res, 200, {
        ok: true,
        ignored: result.ignored,
        updatedAt: result.workbook.updatedAt,
        revision: result.workbook.writeVersion,
        cellCount: Object.keys(result.workbook.cells).length,
      });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" }, { Allow: "GET, HEAD, PUT, POST" });
    return;
  }

  if (pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "API endpoint not found" });
    return;
  }

  serveStatic(req, res, pathname);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    if (!res.headersSent) {
      sendJson(res, status, { error: error.message || "Internal server error" });
    } else {
      res.end();
    }
  });
});

const port = Number(process.env.PORT || 4317);
const host = process.env.HOST || "0.0.0.0";

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT to another value.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  const mode = isProduction ? "production build" : isDevelopment ? "development" : "static";
  console.log(`Lattice reactive spreadsheet`);
  console.log(`  Mode:  ${mode}`);
  console.log(`  URL:   http://localhost:${port}`);
  console.log(`  Data:  ${workbookFile}`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
