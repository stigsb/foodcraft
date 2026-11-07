// Bumps the version of both packs, keeping names, module versions and the BP->RP dependency in step.
// Usage: node tools/bump_version.mjs patch|minor|major
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const part = process.argv[2];
if (!["patch", "minor", "major"].includes(part)) {
  console.error("Usage: node tools/bump_version.mjs patch|minor|major");
  process.exit(1);
}

const files = ["foodcraft_bp", "foodcraft_rp"].map((p) => path.join(repo, "packs", p, "manifest.json"));
const manifests = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
const ownUuids = new Set(manifests.map((m) => m.header.uuid));

let [major, minor, patch] = manifests[0].header.version;
if (part === "major") [major, minor, patch] = [major + 1, 0, 0];
if (part === "minor") [minor, patch] = [minor + 1, 0];
if (part === "patch") patch += 1;
const v = [major, minor, patch];
const tag = `v${v.join(".")}`;

manifests.forEach((m, i) => {
  m.header.version = v;
  m.header.name = m.header.name.replace(/\s+v\d+\.\d+\.\d+$/, "") + " " + tag;
  for (const mod of m.modules ?? []) mod.version = v;
  for (const dep of m.dependencies ?? []) if (dep.uuid && ownUuids.has(dep.uuid)) dep.version = v;
  // Keep number arrays like [0, 2, 0] on one line, as in the hand-written manifests.
  const json = JSON.stringify(m, null, 2).replace(/\[\s*(-?\d+(?:,\s*-?\d+)*)\s*\]/g, (_, xs) => `[${xs.split(/,\s*/).join(", ")}]`);
  fs.writeFileSync(files[i], json + "\n");
});
console.log(tag);
