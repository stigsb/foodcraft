// Builds a printable recipe book (Norwegian) from the packs: dist/oppskrifter.html and dist/oppskrifter.pdf.
// Reads crafting and furnace recipes from the BP, and the cutting board, cooking pot and oven tables
// from the scripts, so the book follows the code.
// Usage: node tools/make_recipe_book.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BP = path.join(repo, "packs", "foodcraft_bp");
const RP = path.join(repo, "packs", "foodcraft_rp");
const dist = path.join(repo, "dist");
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

// --- names -------------------------------------------------------------------------------------
const names = {};
for (const line of fs.readFileSync(path.join(RP, "texts", "nb_NO.lang"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^(?:item|tile)\.foodcraft[.:]([a-z_]+)\.name=(.+)$/);
  if (m) names[`foodcraft:${m[1]}`] = m[2].trim();
}
const VANILLA = {
  "minecraft:beef": "Rått storfekjøtt", "minecraft:bowl": "Bolle", "minecraft:brick_block": "Teglsteinsblokk",
  "minecraft:bucket": "Bøtte", "minecraft:carrot": "Gulrot", "minecraft:cocoa_beans": "Kakaobønner",
  "minecraft:cooked_porkchop": "Stekt svinekotelett", "minecraft:dried_kelp": "Tørket tare", "minecraft:egg": "Egg",
  "minecraft:furnace": "Smelteovn", "minecraft:glass_bottle": "Glassflaske", "minecraft:iron_ingot": "Jernbarre",
  "minecraft:milk_bucket": "Melkebøtte", "minecraft:paper": "Papir", "minecraft:pink_dye": "Rosa fargestoff", "minecraft:porkchop": "Rå svinekotelett",
  "minecraft:potato": "Potet", "minecraft:stick": "Pinne", "minecraft:stone": "Stein", "minecraft:sugar": "Sukker",
  "minecraft:sweet_berries": "Søtbær", "minecraft:glow_berries": "Glødebær", "minecraft:water_bucket": "Vannbøtte", "minecraft:wheat": "Hvete",
  "minecraft:wooden_slabs": "Trehelle (alle slags)",
};
const nameOf = (id) => names[id] ?? VANILLA[id] ?? id.replace(/^.*:/, "").replace(/_/g, " ");

// --- icons (foodcraft items only; vanilla textures are not in the repo) -------------------------
const atlas = readJson(path.join(RP, "textures", "item_texture.json")).texture_data;
const icons = {};
for (const f of fs.readdirSync(path.join(BP, "items"))) {
  const item = readJson(path.join(BP, "items", f))["minecraft:item"];
  const key = item?.components?.["minecraft:icon"]?.textures?.default;
  const tex = key && atlas[key]?.textures;
  const png = tex && path.join(RP, (Array.isArray(tex) ? tex[0] : tex) + ".png");
  if (png && fs.existsSync(png)) icons[item.description.identifier] = "data:image/png;base64," + fs.readFileSync(png).toString("base64");
}

// --- recipes from the BP ------------------------------------------------------------------------
const idOf = (x) => (typeof x === "string" ? x : x.item ?? (x.tag ? x.tag : undefined));
const recipes = fs.readdirSync(path.join(BP, "recipes")).map((f) => readJson(path.join(BP, "recipes", f)));
const shaped = [], shapeless = [], furnace = [];
for (const r of recipes) {
  if (r["minecraft:recipe_shaped"]) shaped.push(r["minecraft:recipe_shaped"]);
  if (r["minecraft:recipe_shapeless"]) shapeless.push(r["minecraft:recipe_shapeless"]);
  if (r["minecraft:recipe_furnace"]) furnace.push(r["minecraft:recipe_furnace"]);
}
const results = (r) => (Array.isArray(r.result) ? r.result : [r.result]).map((x) => ({ id: idOf(x), count: x.count ?? 1 }));

// --- tables from the scripts --------------------------------------------------------------------
const scripts = path.join(BP, "scripts");
const { FISH, filletsOf } = await import(pathToFileURL(path.join(scripts, "fish_data.js")).href);
// The block scripts import @minecraft/server, so their tables are read as source text.
const src = (f) => fs.readFileSync(path.join(scripts, f), "utf8");
const objectLiteral = (text, name) => {
  const start = text.indexOf(`const ${name} = {`);
  let depth = 0, i = text.indexOf("{", start);
  const from = i;
  for (; i < text.length; i++) { if (text[i] === "{") depth++; if (text[i] === "}" && --depth === 0) break; }
  return Function(`"use strict"; return (${text.slice(from, i + 1)});`)();
};
const board = objectLiteral(src("board.js"), "CHOPPABLE");
for (const id of Object.keys(FISH)) { const { item, count } = filletsOf(id); board[`foodcraft:${id}`] = { out: [[item, count]] }; }
const pot = objectLiteral(src("pot.js"), "RECIPES");
const oven = objectLiteral(src("oven.js"), "DISHES");

// --- html helpers -------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const icon = (id) => (icons[id] ? `<img class="ico" src="${icons[id]}" alt="">` : `<span class="ico none"></span>`);
const chip = (id, count = 1) => `<span class="chip">${icon(id)}${count > 1 ? `<b>${count} ×</b> ` : ""}${esc(nameOf(id))}</span>`;
const list = (ids) => {
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => chip(id, n)).join(`<span class="plus">+</span>`);
};
const out = (items) => items.map((x) => chip(x.id, x.count)).join(" ");
const card = (title, body, note = "") =>
  `<div class="card"><h3>${title}</h3>${body}${note ? `<p class="note">${note}</p>` : ""}</div>`;

function grid(r) {
  const rows = r.pattern.map((row) => row.padEnd(3, " "));
  while (rows.length < 3) rows.push("   ");
  const cells = rows.flatMap((row) => [...row.slice(0, 3)]).map((k) => {
    if (k === " ") return `<span class="cell"></span>`;
    const id = idOf(r.key[k]);
    return `<span class="cell">${icons[id] ? `<img src="${icons[id]}" alt="">` : `<i>${k}</i>`}</span>`;
  });
  const legend = Object.entries(r.key).map(([k, v]) => `<li>${icons[idOf(v)] ? icon(idOf(v)) : `<i class="k">${k}</i>`} ${esc(nameOf(idOf(v)))}</li>`).join("");
  return `<div class="shaped"><div class="grid">${cells.join("")}</div><ul class="legend">${legend}</ul></div>`;
}

const craftCard = (r) => {
  const res = results(r);
  const title = esc(nameOf(res[0].id)) + (res[0].count > 1 ? ` <small>× ${res[0].count}</small>` : "");
  const body = r.pattern
    ? grid(r)
    : `<p class="row">${list(r.ingredients.flatMap((x) => Array(x.count ?? 1).fill(idOf(x))))}</p>`;
  const extra = res.slice(1).map((x) => esc(nameOf(x.id))).join(", ");
  return card(title, body, extra ? `Du får også tilbake: ${extra}.` : "");
};

// --- sort crafting recipes into sections ---------------------------------------------------------
const STATIONS = new Set(["foodcraft:cutting_board", "foodcraft:knife", "foodcraft:pizza_oven"]);
const ovenRaw = new Set(Object.values(oven).map((d) => d.raw));
const all = [...shaped, ...shapeless];
const byName = (a, b) => nameOf(results(a)[0].id).localeCompare(nameOf(results(b)[0].id), "nb");
const stationRecipes = all.filter((r) => STATIONS.has(results(r)[0].id)).sort(byName);
const ovenRecipes = all.filter((r) => ovenRaw.has(results(r)[0].id));
const rest = all.filter((r) => !STATIONS.has(results(r)[0].id) && !ovenRaw.has(results(r)[0].id));
const isDish = (r) => { const id = results(r)[0].id; return !!names[id] && (id.includes("pancakes_with_") || !/flour|dough|sauce|mozzarella|tortilla|ham|pepperoni|jam|raw_|batter/.test(id)); };
const basics = rest.filter((r) => !isDish(r)).sort(byName);
const dishes = rest.filter(isDish).sort(byName);

const WHERE = { furnace: "smelteovn", smoker: "røykeovn", campfire: "leirbål", soul_campfire: "sjelebål" };
const furnaceRows = furnace
  .map((r) => ({ input: idOf(r.input), output: r.output, where: (r.tags ?? []).map((t) => WHERE[t]).filter(Boolean) }))
  .sort((a, b) => nameOf(a.input).localeCompare(nameOf(b.input), "nb"));

// --- page ---------------------------------------------------------------------------------------
const version = readJson(path.join(BP, "manifest.json")).header.version.join(".");
const html = `<!doctype html><html lang="nb"><head><meta charset="utf-8"><title>Foodcraft oppskrifter</title>
<style>
@page { size: A4; margin: 14mm 13mm 16mm; }
:root { --ink:#2a2118; --soft:#6b5d4f; --line:#d9cbb6; --paper:#fffdf8; --tint:#f6efe2; --accent:#b8402a; }
* { box-sizing: border-box; }
body { margin:0; font: 10.5pt/1.4 "Segoe UI", system-ui, sans-serif; color:var(--ink); background:var(--paper); }
h1 { font: 700 28pt/1.1 Georgia, "Times New Roman", serif; margin:0 0 2mm; color:var(--accent); }
.sub { color:var(--soft); margin:0 0 6mm; }
h2 { font: 700 16pt/1.2 Georgia, serif; margin:7mm 0 1mm; padding-bottom:1.5mm; border-bottom:1.5pt solid var(--accent); break-after:avoid; }
h2 + .intro { margin:0 0 3mm; color:var(--soft); max-width:62em; }
.cards { display:grid; grid-template-columns:repeat(3, 1fr); gap:3mm; }
.card { border:0.75pt solid var(--line); border-radius:2mm; padding:2.5mm 3mm; break-inside:avoid; background:#fff; }
.card h3 { margin:0 0 2mm; font-size:11pt; }
.card h3 small { font-weight:400; color:var(--soft); }
.row { margin:0; line-height:2; }
.chip { display:inline-flex; align-items:center; gap:1mm; white-space:nowrap; }
.chip b { font-weight:600; }
.plus { color:var(--soft); margin:0 1.2mm; }
.ico { width:5mm; height:5mm; image-rendering:pixelated; vertical-align:middle; }
.ico.none { display:inline-block; border:0.75pt dashed var(--line); border-radius:1mm; }
.note { margin:1.5mm 0 0; font-size:9pt; color:var(--soft); }
.shaped { display:flex; gap:3mm; align-items:center; }
.grid { display:grid; grid-template-columns:repeat(3, 7mm); grid-auto-rows:7mm; gap:0.6mm; padding:0.8mm; background:var(--line); border-radius:1mm; flex:none; }
.cell { background:var(--tint); display:flex; align-items:center; justify-content:center; }
.cell img { width:5.5mm; height:5.5mm; image-rendering:pixelated; }
.cell i, .k { font-style:normal; font-weight:700; color:var(--accent); }
.k { display:inline-block; width:5mm; text-align:center; }
.legend { list-style:none; margin:0; padding:0; font-size:9.5pt; display:grid; gap:0.8mm; }
.arrow { color:var(--accent); font-weight:700; margin:0 1.5mm; }
table { width:100%; border-collapse:collapse; font-size:10pt; }
th, td { text-align:left; padding:1.2mm 2mm; border-bottom:0.5pt solid var(--line); vertical-align:middle; }
th { font-size:8.5pt; text-transform:uppercase; letter-spacing:0.06em; color:var(--soft); font-weight:600; }
tr { break-inside:avoid; }
.how { margin:0 0 3mm; padding-left:5mm; max-width:62em; }
.how li { margin-bottom:0.8mm; }
.two { display:grid; grid-template-columns:1fr 1fr; gap:0 8mm; }
</style></head><body>
<h1>Foodcraft oppskrifter</h1>
<p class="sub">Alle oppskriftene i Foodcraft v${version}. Ting uten bilde er vanlige Minecraft-ting.</p>

<h2>Kjøkkenutstyr</h2>
<p class="intro">Lages på arbeidsbenken.</p>
<div class="cards">${stationRecipes.map(craftCard).join("")}</div>

<h2>Grunnvarer</h2>
<p class="intro">Lages på arbeidsbenken og brukes videre i andre oppskrifter.</p>
<div class="cards">${basics.map(craftCard).join("")}</div>

<h2>Skjærebrett</h2>
<ol class="how">
<li>Legg ingrediensen på skjærebrettet.</li>
<li>Hogg tre ganger med kniven.</li>
<li>Med tom hånd tar du ingrediensen av brettet igjen.</li>
</ol>
<table><tr><th>Legg på brettet</th><th>Du får</th></tr>
${Object.entries(board).sort(([a], [b]) => nameOf(a).localeCompare(nameOf(b), "nb"))
  .map(([id, r]) => `<tr><td>${chip(id)}</td><td>${r.out.map(([o, n]) => chip(o, n)).join(" ")}</td></tr>`).join("")}
</table>

<h2>Kokegryte</h2>
<ol class="how">
<li>Kokegryta er en vanlig gryte (cauldron) rett oppå et tent leirbål.</li>
<li>Fyll gryta helt med en vannbøtte.</li>
<li>Legg i ingrediensene én og én. Med tom hånd tar du ut den siste igjen.</li>
<li>Gryta koker i 10 sekunder.</li>
<li>Maten får farge når den er ferdig. Du får 3 porsjoner: ta ut hver med en tom bolle.</li>
</ol>
<div class="cards">${Object.values(pot).map((r) => card(esc(nameOf(r.item)) + " <small>× 3</small>", `<p class="row">${list(r.needs)}</p>`)).join("")}</div>

<h2>Pizzaovn</h2>
<ol class="how">
<li>Lag den rå retten på arbeidsbenken.</li>
<li>Legg den i pizzaovnen.</li>
<li>Vent 10 sekunder til det sier pling.</li>
<li>Bruk ovnen igjen for å ta ut maten.</li>
</ol>
<div class="cards">${Object.values(oven).map((d) => {
  const r = ovenRecipes.find((x) => results(x)[0].id === d.raw) ?? all.find((x) => results(x)[0].id === d.raw);
  const how = r ? (r.pattern ? grid(r) : `<p class="row">${list(r.ingredients.flatMap((x) => Array(x.count ?? 1).fill(idOf(x))))}</p>`) : "";
  return card(esc(nameOf(d.baked)) + (d.count > 1 ? ` <small>× ${d.count}</small>` : ""),
    `${how}<p class="row">${chip(d.raw)}<span class="arrow">→ ovn →</span>${chip(d.baked, d.count)}</p>`);
}).join("")}</div>

<h2>Retter fra arbeidsbenken</h2>
<div class="cards">${dishes.map(craftCard).join("")}</div>

<h2>Steking</h2>
<p class="intro">Stek i smelteovn, røykeovn eller på leirbål.</p>
<table><tr><th>Rå</th><th></th><th>Ferdig</th></tr>
${furnaceRows.map((r) => `<tr><td>${chip(r.input)}</td><td class="arrow">→</td><td>${chip(r.output)}</td></tr>`).join("")}
</table>
</body></html>`;

fs.mkdirSync(dist, { recursive: true });
const htmlFile = path.join(dist, "oppskrifter.html");
const pdfFile = path.join(dist, "oppskrifter.pdf");
fs.writeFileSync(htmlFile, html);

const browsers = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];
const browser = browsers.find((b) => fs.existsSync(b));
if (!browser) { console.log(`Wrote ${htmlFile} (no Edge/Chrome found for the PDF)`); process.exit(0); }
execFileSync(browser, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfFile}`, pathToFileURL(htmlFile).href], { stdio: "ignore" });
console.log(`Wrote ${pdfFile}`);
