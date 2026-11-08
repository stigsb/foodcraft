#!/usr/bin/env node
// Pixel art for berries, jams and pancakes (16x16). Overwrites these textures on purpose; edit here and rerun.
//   items:  pancakes, pancakes_with_<jam>, <berry>, <jam> (a jar with a cloth lid)
//   blocks: <berry>_bush_{sprout,leaves,flowers,ripe} (cross geometry)
// --preview writes an enlarged sheet of everything to the path given after it.
// Usage: node tools/art_berries.mjs [--preview out.png]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex, shade, mix } from "./png.mjs";
import { BERRIES, JAMS } from "../packs/foodcraft_bp/scripts/berry_data.js";

const RP = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packs/foodcraft_rp/textures");
const CLEAR = [0, 0, 0, 0];
const blank = () => Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => CLEAR));
const set = (px, x, y, c) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) px[y][x] = c; };
const fromAscii = (rows, palette) => {
  const px = blank();
  const top = 16 - rows.length;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === ".") return;
    if (!palette[ch]) throw new Error(`unknown colour '${ch}'`);
    set(px, x, top + y, hex(palette[ch]));
  }));
  return px;
};

// Colours per jam: [main, light, dark].
const JAM_COLOURS = {
  jam: ["#b8202e", "#e05058", "#7a1020"], // sweet berries
  strawberry_jam: ["#d8283a", "#f06a70", "#90121e"],
  blueberry_jam: ["#3a2e7a", "#6a5cb0", "#1e1848"],
  cloudberry_jam: ["#f09a28", "#ffc860", "#b86410"],
  raspberry_jam: ["#c81e5a", "#ee5c8c", "#86103a"],
  jam_of_restoration: ["#ff5cb4", "#ffb0dc", "#c42a80"],
  glow_berry_jam: ["#f0b42a", "#fff07a", "#b07818"],
};

// --- pancakes: a stack of thin, golden, speckled pancakes on a plate, optionally with jam on top ----------
function pancakes(jam) {
  // Thin pancakes seen from the side: golden edges (e/E) with darker seams (d) between them, slightly uneven.
  const px = fromAscii([
    "....oooooooo....",
    "..ooTTtTTTTToo..",
    ".oTsTTTTTsTTTTo.",
    ".oTTTTsTTTTTsTo.",
    ".oTTsTTTTTsTTTo.",
    "..ooTTTTsTTToo..",
    ".deoooooooooood.",
    ".dEeeeeeeeeeeEd.",
    "..dddddddddddd..",
    ".dEeeeeeeeeeeeEd",
    ".ddddddddddddddd",
    "wdEeeeeeeeeeeeEw",
    "wwddddddddddddww",
    ".wwWWWWWWWWWWww.",
  ], { o: "#c88838", T: "#eebc64", t: "#f8d890", s: "#b8742c", e: "#f4cc80", E: "#e0a858", d: "#a86a28", w: "#f2f2ec", W: "#bcbcb4" });
  if (!jam) return px;
  const [main, light, dark] = JAM_COLOURS[jam].map((c) => hex(c));
  // a blob of jam on the top pancake (rows 3-7) and drips down the front
  const blob = [
    "................",
    "................",
    "................",
    "......mmmm......",
    "....mllmmmmm....",
    "....mlmmmmmmk...",
    ".....mmmmmkk....",
    "......m..m......",
    "......m..k......",
    "......k.........",
  ];
  blob.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") set(px, x, y + 2, c === "m" ? main : c === "l" ? light : dark); }));
  if (jam === "glow_berry_jam" || jam === "jam_of_restoration") for (const [x, y] of [[2, 1], [13, 0], [14, 3]]) set(px, x, y, light); // sparkle
  return px;
}

// --- jam jar: glass jar, coloured jam, cloth lid tied with string ------------------------------------------
function jar(jam) {
  const [J, j, D] = JAM_COLOURS[jam];
  const lid = jam === "jam_of_restoration" ? ["#fff0f8", "#ff8cc8"] : jam === "glow_berry_jam" ? ["#fff8e0", "#e8a020"] : ["#f8f4ec", "#d03040"];
  return fromAscii([
    "....cCcCcCcC....",
    "...CcCcCcCcCc...",
    "....tttttttt....",
    "....gWJJJJJg....",
    "...gWjJJJJJJg...",
    "...gWjJJJJJJg...",
    "...gjJJJJJJJg...",
    "...gJJJJJJJDg...",
    "...gJJJJJJJDg...",
    "...gJJJJJJDDg...",
    "...gDDDDDDDDg...",
    "....gggggggg....",
  ], { c: lid[0], C: lid[1], t: "#a08060", g: "#9cb8c4", W: "#e8f4f8", J, j, D });
}

// --- berries -------------------------------------------------------------------------------------------
const BERRY_ART = {
  strawberry: [[
    "................",
    ".......G..G.....",
    ".....GgGggGg....",
    "....RgGgGgGRR...",
    "...RrRRgRRRRRD..",
    "...RrsRRRsRRRD..",
    "...RRRRsRRRsRD..",
    "....RsRRRRRRD...",
    "....RRRRsRRsD...",
    ".....RsRRRRD....",
    ".....RRRRsDD....",
    "......RsRDD.....",
    "......RRDD......",
    ".......DD.......",
  ], { G: "#3c8a2a", g: "#6cc04a", R: "#e0283a", r: "#ff7a80", s: "#f8e070", D: "#a01828" }],
  blueberry: [[
    ".........gG.....",
    "........gG......",
    "......BBBB......",
    ".....BbbBBB.....",
    ".....BbBBBBN....",
    "..BBBBBnBBBN....",
    ".BbbBBBBNNNBBB..",
    ".BbBBBBNBBbbBBB.",
    ".BBBBBBNBbBBBBN.",
    ".BBBnBBNBBBBBBN.",
    "..BBBBNNBBBnBBN.",
    "...NNNN.BBBBBN..",
    "........NNNNN...",
  ], { B: "#3c4c9a", b: "#8ea0e0", N: "#222a5c", n: "#14183a", g: "#6cc04a", G: "#3c8a2a" }],
  cloudberry: [[
    "......gGg.......",
    ".......G........",
    ".....oOoOo......",
    "....OyOoOyOo....",
    "...oOoyOoOoOd...",
    "...OyOoOyOoOd...",
    "...oOoOoOoOod...",
    "...OoOyOoOyOd...",
    "....oOoOoOod....",
    "....dOoOoOdd....",
    ".....ddddd......",
  ], { o: "#f4a43a", O: "#ffc76a", y: "#fff0b0", d: "#c06a18", g: "#6cc04a", G: "#3c8a2a" }],
  raspberry: [[
    ".......gG.......",
    "......GgGg......",
    ".....rRrRrR.....",
    "....RpRrRpRr....",
    "...rRrRpRrRrd...",
    "...RpRrRrRpRd...",
    "...rRrRpRrRrd...",
    "...RrRpRrRpRd...",
    "....rRrRrRrd....",
    "....dRrRrRdd....",
    ".....ddddd......",
  ], { r: "#d02860", R: "#ee5486", p: "#ffb0c8", d: "#8a1440", g: "#6cc04a", G: "#3c8a2a" }],
  heart_berry: [[
    ".......gG.......",
    "......gG........",
    "..PPPP...PPPP...",
    ".PwwPPP.PPPPPd..",
    "PwpPPPPPPPPPPPd.",
    "PpPPPPPPPPPPPPd.",
    "PPPPPPPPPPPPPPd.",
    ".PPPPPPPPPPPPd..",
    "..PPPPPPPPPPd...",
    "...PPPPPPPPd....",
    "....PPPPPPd.....",
    ".....PPPPd......",
    "......PPd.......",
    ".......d........",
  ], { P: "#ff4ca8", p: "#ff9cd0", w: "#fff0f8", d: "#c01c78", g: "#6cc04a", G: "#3c8a2a" }],
};

// --- bushes (cross geometry, bottom row is the ground) -----------------------------------------------------
// l leaf, L light leaf, d dark leaf, s stem; x = a berry pixel and h = its highlight. Flowers show on the x/h spots.
const BUSH = [
  "......L...L.....",
  "...L.LlL.LlL.L..",
  "..LlLlxhlLlLlL..",
  ".LlxhlLldlxhLlL.",
  ".lLxxldLlLxxlLl.",
  "LlLldlLxhlLdlLlL",
  "lLdlLlLxxLdlLxhl",
  ".dlxhLdlLdlLlxxd",
  ".ldxxdlLdlxhdLd.",
  "..dlLdldlLxxld..",
  "...dld.sd.ldd...",
  "......s..s......",
];
const SPROUT = [
  "......L.L.......",
  ".....LlLlL..L...",
  "...L..lsl..LlL..",
  "..LlL..s..l.s...",
  "....s..s..s.s...",
  ".....s.s.s.s....",
];
const LEAVES = {
  strawberry: ["#4c9a34", "#78c450", "#2e6a22", "#4c7a2a"],
  blueberry: ["#3c7a44", "#5ea062", "#24502e", "#6a3a2a"],
  cloudberry: ["#6aa040", "#94c45c", "#46742a", "#5a7a2a"],
  raspberry: ["#4a8a30", "#70b04c", "#2c5e20", "#7a4a3a"],
  heart_berry: ["#4ea050", "#7cc878", "#2e6c34", "#8a4a5a"],
};
const FLOWERS = { strawberry: ["#ffffff", "#f8d840"], blueberry: ["#f4d0e0", "#e8a0c0"], cloudberry: ["#ffffff", "#f0e080"], raspberry: ["#f4f0e8", "#c8e080"], heart_berry: ["#ffc8e4", "#ff60b0"] };
const RIPE = {
  strawberry: ["#e0283a", "#ff8088"], blueberry: ["#3c4c9a", "#8ea0e0"], cloudberry: ["#f4a43a", "#fff0b0"],
  raspberry: ["#d02860", "#ffb0c8"], heart_berry: ["#ff4ca8", "#fff0f8"],
};
function bush(berry, look) {
  const [l, L, d, s] = LEAVES[berry];
  const leaf = { l, L, d, s };
  if (look === "sprout") return fromAscii(SPROUT, leaf);
  const spot = look === "flowers" ? FLOWERS[berry] : look === "ripe" ? RIPE[berry] : [l, L];
  // leaves: berry spots fall back to the leaf colour; flowers: only the highlight pixel shows (small blossoms)
  const x = look === "flowers" ? l : spot[0];
  const h = spot[1];
  const px = fromAscii(BUSH, { ...leaf, x, h });
  if (look === "flowers") {
    // a petal ring around each flower centre
    const centres = [];
    BUSH.forEach((row, y) => [...row].forEach((c, xx) => { if (c === "h") centres.push([xx, 16 - BUSH.length + y]); }));
    for (const [cx, cy] of centres) {
      for (const [dx, dy] of [[-1, 0], [0, 1], [-1, 1]]) set(px, cx + dx, cy + dy, hex(FLOWERS[berry][0]));
      set(px, cx, cy, hex(FLOWERS[berry][1]));
    }
  }
  return px;
}

// --- write ---------------------------------------------------------------------------------------------
const out = [];
out.push(["items/foodcraft_pancakes", pancakes(null)]);
for (const j of JAMS) {
  out.push([`items/foodcraft_${j.id}`, jar(j.id)]);
  out.push([`items/foodcraft_pancakes_with_${j.id}`, pancakes(j.id)]);
}
for (const [berry, [rows, pal]] of Object.entries(BERRY_ART)) out.push([`items/foodcraft_${berry}`, fromAscii(rows, pal)]);
for (const berry of Object.keys(BERRIES)) for (const look of ["sprout", "leaves", "flowers", "ripe"]) out.push([`blocks/foodcraft_${berry}_bush_${look}`, bush(berry, look)]);

const previewAt = process.argv.indexOf("--preview");
if (previewAt > 0) {
  // sheet: 8 per row, each 16x16 at 6x, on a grass-green check so transparency shows
  const S = 6, cols = 8, rows = Math.ceil(out.length / cols);
  const W = cols * 17 * S, H = rows * 17 * S;
  const sheet = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => ((x >> 3) + (y >> 3)) % 2 ? [150, 170, 140, 255] : [170, 190, 160, 255]));
  out.forEach(([, px], i) => {
    const ox = (i % cols) * 17 * S, oy = Math.floor(i / cols) * 17 * S;
    for (let y = 0; y < 16 * S; y++) for (let x = 0; x < 16 * S; x++) {
      const p = px[Math.floor(y / S)][Math.floor(x / S)];
      if (p[3]) sheet[oy + y][ox + x] = p;
    }
  });
  writePng(process.argv[previewAt + 1], sheet);
  console.log(out.map(([n], i) => `${i}: ${n}`).join("\n"));
} else {
  for (const [name, px] of out) writePng(path.join(RP, `${name}.png`), px);
  console.log(`berry art: ${out.length} textures written`);
}
void shade; void mix;
