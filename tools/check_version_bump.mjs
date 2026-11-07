// Used by .githooks/pre-commit when pack content is staged: the staged pack version must be
// higher than HEAD's, and both packs must carry the same version.
import { execFileSync } from "node:child_process";

const show = (ref) => {
  try { return JSON.parse(execFileSync("git", ["show", ref], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); }
  catch { return undefined; }
};
const ver = (m) => m?.header?.version ?? [0, 0, 0];
const newer = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };

const bp = ver(show(":packs/foodcraft_bp/manifest.json"));
const rp = ver(show(":packs/foodcraft_rp/manifest.json"));
const head = show("HEAD:packs/foodcraft_bp/manifest.json");

let error = "";
if (bp.join(".") !== rp.join(".")) error = `The packs have different versions (BP ${bp.join(".")}, RP ${rp.join(".")}).`;
else if (head && !newer(bp, ver(head))) error = `Pack content changed but the version is still ${bp.join(".")}.`;
if (error) {
  console.error(`${error}\nRun: node tools/bump_version.mjs patch   (minor when a spec is finished), then stage both manifests.`);
  process.exit(1);
}
