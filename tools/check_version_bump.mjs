// Used by .githooks/pre-commit when pack content is staged: the staged pack version must be
// higher than HEAD's, both packs must carry the same version, and the staged CHANGELOG.md must
// have a section for that version with at least one filled-in bullet.
import { execFileSync } from "node:child_process";

const show = (ref) => {
  try { return execFileSync("git", ["show", ref], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { return undefined; }
};
const json = (ref) => { const s = show(ref); return s ? JSON.parse(s) : undefined; };
const ver = (m) => m?.header?.version ?? [0, 0, 0];
const newer = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };

const bp = ver(json(":packs/foodcraft_bp/manifest.json"));
const rp = ver(json(":packs/foodcraft_rp/manifest.json"));
const head = json("HEAD:packs/foodcraft_bp/manifest.json");
const tag = `v${bp.join(".")}`;

function changelogHasEntry() {
  const log = (show(":CHANGELOG.md") ?? "").replace(/\r\n/g, "\n");
  const start = log.search(new RegExp(`^## ${tag.replace(/\./g, "\\.")}\\b`, "m"));
  if (start < 0) return false;
  const rest = log.slice(start).split("\n").slice(1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).some((l) => /^- \S/.test(l));
}

let error = "";
if (bp.join(".") !== rp.join(".")) error = `The packs have different versions (BP ${bp.join(".")}, RP ${rp.join(".")}).`;
else if (head && !newer(bp, ver(head))) error = `Pack content changed but the version is still ${bp.join(".")}.\nRun: node tools/bump_version.mjs patch   (minor when a spec is finished), then stage both manifests.`;
else if (!changelogHasEntry()) error = `CHANGELOG.md has no filled-in entry for ${tag}. Describe the changes there and stage it.`;
if (error) {
  console.error(error);
  process.exit(1);
}
