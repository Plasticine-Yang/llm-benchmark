import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "public");
const destination = path.join(root, "dist");

if (!fs.existsSync(path.join(source, "index.html"))) {
  console.error("Cannot build: public/index.html was not found.");
  process.exit(1);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(path.relative(destination, full));
  }
}
walk(destination);

fs.writeFileSync(
  path.join(destination, "build.json"),
  `${JSON.stringify({ builtAt: new Date().toISOString(), files: files.sort() }, null, 2)}\n`,
  "utf8",
);

console.log(`Built ${files.length} static files into dist/`);
for (const file of files.sort()) console.log(`  dist/${file}`);
console.log("\nStart it with: npm start");
