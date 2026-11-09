#!/usr/bin/env node
// Pixel art for the heart tree (16x16): bark, bark with the heart seed, log top, blossom leaves, the sapling
// and the heart flower plant (growth stages 1, 2, 4, 8 and 16 pixels tall), and the seed item icon.
// Overwrites those textures; edit the drawings here and rerun.
// Usage: node tools/art_heart_tree.mjs [--preview <png>]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex } from "./png.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packs/foodcraft_rp/textures");

const PALETTE = {
  b: "#9a6038", // bark
  B: "#6e4022", // bark shade
  l: "#b87a4a", // bark light
  t: "#d8a870", // wood (log top)
  T: "#c08850", // wood ring
  r: "#c02858", // seed
  R: "#741434", // seed shade
  w: "#f6a0c0", // seed shine
  p: "#f2a2b4", // blossom pink
  P: "#d77890", // blossom shade
  q: "#fcd2d6", // blossom light
  c: "#fdeccc", // cream flower
  y: "#f0a830", // flower centre
  g: "#5e9e7c", // leaf green
  G: "#3e7a5c", // leaf shade
  s: "#5a9a48", // stem
  S: "#3f7432", // stem shade
};

// Hashed noise, so the bark and leaves look the same every run.
const noise = (x, y, k = 0) => {
  let h = (x * 374761393 + y * 668265263 + k * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const grid = (f) => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => f(x, y)).join(""));

// Twisted bark: streaks that lean, like the trunk in the drawing.
const bark = grid((x, y) => {
  const v = (x + Math.floor(y / 2)) % 6;
  return v === 0 ? "B" : v === 3 ? "l" : noise(x, y) < 0.12 ? "B" : "b";
});
const overlay = (base, at, rows) =>
  base.map((row, y) => [...row].map((ch, x) => {
    const c = rows[y - at[1]]?.[x - at[0]];
    return c && c !== "." ? c : ch;
  }).join(""));

const ART = {
  "blocks/foodcraft_heart_tree_log": bark,
  "blocks/foodcraft_heart_tree_log_top": grid((x, y) => {
    if (Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) > 6.5) return noise(x, y) < 0.3 ? "B" : "b";
    return Math.floor(Math.hypot(x - 7.5, y - 7.5)) % 2 ? "T" : "t";
  }),
  // The seed sits in a hollow in the bark.
  "blocks/foodcraft_heart_tree_seed_log": overlay(bark, [5, 3], [
    "..BB..",
    ".BRrB.",
    "BRrwrB",
    "BrrwrB",
    "BRrrrB",
    "BRRrRB",
    ".BRRB.",
    "..BB..",
  ]),
  "blocks/foodcraft_heart_tree_leaves": (() => {
    let g = grid((x, y) => {
      const n = noise(x, y, 1);
      return n < 0.18 ? "P" : n > 0.8 ? "q" : "p";
    });
    for (const [fx, fy] of [[3, 3], [11, 9]]) g = overlay(g, [fx - 1, fy - 1], [".c.", "cyc", ".c."]);
    for (const [gx, gy] of [[12, 2], [5, 12]]) g = overlay(g, [gx, gy], ["gG", "G."]);
    return g;
  })(),

  // Sapling: brown stem, pink leaves. 1, 2, 4, 8 and 16 pixels tall.
  "blocks/foodcraft_heart_tree_sapling_0": [
    ...Array(15).fill("................"),
    "......pbp.......",
  ],
  "blocks/foodcraft_heart_tree_sapling_1": [
    ...Array(14).fill("................"),
    "......p.p.......",
    ".......b........",
  ],
  "blocks/foodcraft_heart_tree_sapling_2": [
    ...Array(12).fill("................"),
    "......q.p.......",
    ".....pppbp......",
    ".......b........",
    ".......b........",
  ],
  "blocks/foodcraft_heart_tree_sapling_3": [
    ...Array(8).fill("................"),
    "......pqp.......",
    ".....ppqpp......",
    "...pp.pbp.pp....",
    "..pqpp.b.ppqp...",
    "...p..lb...P....",
    ".......bb.......",
    ".......b........",
    "......Bb........",
  ],
  "blocks/foodcraft_heart_tree_sapling_4": [
    ".....pqqpp......",
    "...ppqqpppPp....",
    "..pqpcppqpppp...",
    ".ppppcyccqppPp..",
    ".pPppppcpppqppp.",
    "pppPpp.bpppPpPpp",
    "pPp.pPpbl.ppp.Pp",
    "pp..p..lb..p..pp",
    "P...P..bb..P...P",
    "......lb........",
    "......bb........",
    ".......b........",
    ".......bl.......",
    ".......bb.......",
    "......Bbb.......",
    ".....BbbbB......",
  ],

  // Heart flower plant: green stem and leaves, a pink heart flower at 16 pixels.
  "blocks/foodcraft_heart_flower_plant_0": [
    ...Array(15).fill("................"),
    "......gsg.......",
  ],
  "blocks/foodcraft_heart_flower_plant_1": [
    ...Array(14).fill("................"),
    "......g.g.......",
    ".......s........",
  ],
  "blocks/foodcraft_heart_flower_plant_2": [
    ...Array(12).fill("................"),
    "........g.......",
    ".....gg.sg......",
    "......gs........",
    ".......s........",
  ],
  "blocks/foodcraft_heart_flower_plant_3": [
    ...Array(8).fill("................"),
    ".......pp.......",
    ".......Pp.......",
    ".......sg.......",
    "....gg.s..gg....",
    ".....Ggs.gG.....",
    ".......sgg......",
    "......gs........",
    ".......s........",
  ],
  "blocks/foodcraft_heart_flower_plant_4": [
    "................",
    "....pp...pp.....",
    "...pqqp.pqpp....",
    "...pqpppppppP...",
    "...ppppppppPP...",
    "....ppppppPP....",
    ".....pppppP.....",
    "......ppPP......",
    ".......Ps.......",
    "....gg..s..gg...",
    "...gGgg.s.ggGg..",
    ".....Gg.sgg.....",
    ".......gs.......",
    "....gg..s.gg....",
    ".....Gg.sgG.....",
    "........s.......",
  ],

  // Item icon: the seed (a gem-like heart seed).
  "items/foodcraft_heart_seed": [
    "................",
    "................",
    ".......RR.......",
    "......RrrR......",
    ".....RrwrrR.....",
    ".....RwwrrR.....",
    "....RrwrrrrR....",
    "....RrrrrrrR....",
    "....RrrrrrRR....",
    "....RRrrrrRR....",
    ".....RrrrRR.....",
    ".....RRrRRR.....",
    "......RRRR......",
    ".......RR.......",
    "................",
    "................",
  ],
};

const drawn = {};
for (const [name, rows] of Object.entries(ART)) {
  if (rows.length !== 16 || rows.some((r) => r.length !== 16)) throw new Error(`${name}: drawing must be 16x16 (${rows.map((r) => r.length)})`);
  drawn[name] = rows.map((row) => [...row].map((c) => {
    if (c === ".") return [0, 0, 0, 0];
    if (!PALETTE[c]) throw new Error(`${name}: unknown colour ${c}`);
    return hex(PALETTE[c]);
  }));
  writePng(path.join(ROOT, `${name}.png`), drawn[name]);
}

const at = process.argv.indexOf("--preview");
if (at > 0) {
  const S = 10, list = Object.values(drawn), cols = 6, rowsN = Math.ceil(list.length / cols);
  const sheet = Array.from({ length: rowsN * 17 * S }, (_, y) =>
    Array.from({ length: cols * 17 * S }, (_, x) => {
      const i = Math.floor(y / (17 * S)) * cols + Math.floor(x / (17 * S));
      const lx = Math.floor((x % (17 * S)) / S), ly = Math.floor((y % (17 * S)) / S);
      const px = lx < 16 && ly < 16 ? list[i]?.[ly]?.[lx] : undefined;
      return px && px[3] ? px : (lx + ly) % 2 ? [200, 200, 200, 255] : [235, 235, 235, 255];
    })
  );
  writePng(process.argv[at + 1], sheet);
}
console.log(`heart tree art: ${Object.keys(ART).length} textures written`);
