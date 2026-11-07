// Serves the versioned dist/foodcraft-vX.Y.Z.mcaddon files and the recipe book on the LAN,
// so the tablet can download them. The newest version is shown first; older builds are listed below.
// Files are read from disk on every request, so a rebuild is picked up without a restart.
// Usage: node tools/serve_mcaddon.mjs [port]   (default 8000)
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(repo, "dist");
const pdf = path.join(dist, "oppskrifter.pdf");
const port = Number(process.argv[2] ?? 8000);
const ADDON = /^foodcraft-v(\d+)\.(\d+)\.(\d+)\.mcaddon$/;

// Newest first.
function builds() {
  const files = fs.existsSync(dist) ? fs.readdirSync(dist) : [];
  return files
    .map((name) => ({ name, v: name.match(ADDON)?.slice(1).map(Number) }))
    .filter((b) => b.v)
    .sort((a, b) => b.v[0] - a.v[0] || b.v[1] - a.v[1] || b.v[2] - a.v[2])
    .map((b) => ({ ...b, version: b.v.join("."), built: fs.statSync(path.join(dist, b.name)).mtime.toLocaleString("nb-NO") }));
}

function send(res, file, type, download) {
  const headers = { "Content-Type": type, "Content-Length": fs.statSync(file).size, "Cache-Control": "no-store" };
  if (download) headers["Content-Disposition"] = `attachment; filename=${path.basename(file)}`;
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  console.log(new Date().toISOString(), req.socket.remoteAddress, req.url);
  const name = decodeURIComponent(req.url.split("?")[0].slice(1));
  if (name === "oppskrifter.pdf" && fs.existsSync(pdf)) return send(res, pdf, "application/pdf", false);
  if (ADDON.test(name) && fs.existsSync(path.join(dist, name))) return send(res, path.join(dist, name), "application/octet-stream", true);

  const [latest, ...older] = builds();
  const t = Date.now();
  const link = (b) => `<a href="/${b.name}?t=${t}">${b.name}</a> <small>bygget ${b.built}</small>`;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`<meta name="viewport" content="width=device-width"><title>Foodcraft</title>
<body style="font-family:sans-serif;padding:16px;line-height:1.5">
${latest ? `<h1>Siste versjon: v${latest.version}</h1><p style="font-size:1.3em">${link(latest)}</p>` : "<h1>Ingen pakker bygget ennå</h1>"}
${fs.existsSync(pdf) ? `<p><a href="/oppskrifter.pdf?t=${t}">Oppskriftsbok (PDF)</a></p>` : ""}
${older.length ? `<h2>Eldre versjoner</h2><ul>${older.map((b) => `<li>${link(b)}</li>`).join("")}</ul>` : ""}
</body>`);
}).listen(port, "0.0.0.0", () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i.family === "IPv4" && !i.internal).map((i) => i.address);
  console.log(`Serving ${dist}`);
  for (const ip of ips) console.log(`  http://${ip}:${port}`);
});
