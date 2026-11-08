#!/usr/bin/env node
// Tags HEAD with the pack version (vX.Y.Z, annotated), run by .githooks/post-commit.
// The tag follows the newest commit of a version until that commit has been pushed (is on a remote branch);
// after that it stays put, so a tag that may be on GitHub is never moved.
// Push tags with the commits: git push --follow-tags (or once per clone: git config push.followTags true).
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return ""; } };

const version = JSON.parse(fs.readFileSync("packs/foodcraft_bp/manifest.json", "utf8")).header.version.join(".");
const tag = `v${version}`;
const head = git("rev-parse", "HEAD");
const tagged = tryGit("rev-parse", `${tag}^{commit}`);

if (tagged === head) process.exit(0);
if (tagged) {
  if (tryGit("branch", "-r", "--contains", tagged)) process.exit(0); // already pushed: leave it
  git("tag", "-d", tag);
}
git("tag", "-a", tag, "-m", `Foodcraft ${tag}`, head);
console.log(`${tagged ? "moved" : "tagged"} ${tag} -> ${head.slice(0, 7)}`);
