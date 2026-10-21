import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Priority, StreamEnvelope } from "../shared/types.js";
import { SimulationEngine } from "./engine.js";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "../..");
const statePath = process.env.WAREHOUSE_STATE_PATH ?? join(projectRoot, "data/state.json");
const port = Number(process.env.PORT ?? 3001);
const engine = new SimulationEngine(statePath);
const app = express();

app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, sequence: engine.getState().sequence }));
app.get("/api/state", (_req, res) => res.json(engine.getState()));

app.get("/api/events", (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let lastSent = Number(req.get("Last-Event-ID") ?? req.query.after ?? -1);
  const unsubscribe = engine.subscribe((state, kind) => {
    // Every connection begins with a complete authoritative snapshot. Updates are monotonic.
    if (kind === "update" && state.sequence <= lastSent) return;
    const envelope: StreamEnvelope = { sequence: state.sequence, kind, state };
    res.write(`id: ${state.sequence}\n`);
    res.write(`event: ${kind}\n`);
    res.write(`data: ${JSON.stringify(envelope)}\n\n`);
    lastSent = state.sequence;
  });
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 15_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

app.post("/api/jobs", (req, res) => {
  const { shelfId, workstationId, priority } = req.body as Record<string, unknown>;
  const job = engine.createJob(String(shelfId), String(workstationId), Number(priority) as Priority);
  res.status(201).json(job);
});

app.post("/api/control/:action", (req, res) => {
  const action = req.params.action;
  if (action === "pause") engine.setRunning(false);
  else if (action === "resume") engine.setRunning(true);
  else if (action === "step") engine.singleStep();
  else if (action === "reset") engine.reset();
  else return res.status(404).json({ error: "Unknown control action" });
  return res.json(engine.getState());
});

app.post("/api/cells/:x/:y", (req, res) => {
  const x = Number(req.params.x);
  const y = Number(req.params.y);
  if (!Number.isInteger(x) || !Number.isInteger(y) || typeof req.body.blocked !== "boolean") {
    return res.status(400).json({ error: "Integer coordinates and boolean blocked are required" });
  }
  engine.setBlocked({ x, y }, req.body.blocked);
  return res.json(engine.getState());
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(400).json({ error: error.message || "Request failed" });
});

const clientPath = join(projectRoot, "dist/client");
if (process.env.NODE_ENV === "production" && existsSync(clientPath)) {
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => res.sendFile(join(clientPath, "index.html")));
}

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Warehouse control server listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  engine.shutdown();
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
