// Serves dist/foodcraft.mcaddon on the LAN so the tablet can download it.
// The file is read from disk on every request, so a rebuild is picked up without a restart.
// Usage: node tools/serve_mcaddon.mjs [port]   (default 8000)
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(repo, "dist", "foodcraft.mcaddon");
const bp = path.join(repo, "packs", "foodcraft_bp", "manifest.json");
const port = Number(process.argv[2] ?? 8000);

const version = () => {
  try { return JSON.parse(fs.readFileSync(bp, "utf8")).header.version.join("."); } catch { return "?"; }
};

http.createServer((req, res) => {
  console.log(new Date().toISOString(), req.socket.remoteAddress, req.url);
  const pdf = path.join(repo, "dist", "oppskrifter.pdf");
  if (req.url.startsWith("/oppskrifter.pdf") && fs.existsSync(pdf)) {
    res.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": fs.statSync(pdf).size, "Cache-Control": "no-store" });
    fs.createReadStream(pdf).pipe(res);
    return;
  }
  if (req.url.startsWith("/foodcraft.mcaddon")) {
    if (!fs.existsSync(file)) { res.writeHead(404); res.end("Not built yet"); return; }
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "attachment; filename=foodcraft.mcaddon",
      "Content-Length": fs.statSync(file).size,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
    return;
  }
  const built = fs.existsSync(file) ? fs.statSync(file).mtime.toLocaleString("nb-NO") : "ikke bygget";
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`<meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:16px">
<h1><a href="/foodcraft.mcaddon?t=${Date.now()}">Last ned foodcraft.mcaddon</a></h1>
<p>Versjon v${version()} &middot; bygget ${built}</p>
<p><a href="/oppskrifter.pdf?t=${Date.now()}">Oppskriftsbok (PDF)</a></p></body>`);
}).listen(port, "0.0.0.0", () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i.family === "IPv4" && !i.internal).map((i) => i.address);
  console.log(`Serving ${file}`);
  for (const ip of ips) console.log(`  http://${ip}:${port}`);
});
