#!/usr/bin/env node
// Pixel art for oregano (purple flowers) and lettuce (a head of lettuce, not grass): crop stages 0-3 and the
// wild plant, 16x16 for the cross geometry. Overwrites these textures; edit the drawings here and rerun.
// Rows shorter than 16 are padded on the right; drawings sit on the bottom row (the ground).
// Usage: node tools/art_plants.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex } from "./png.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packs/foodcraft_rp/textures/blocks");

const OREGANO = {
  L: "#86b852", // leaf light
  g: "#5f8f3a", // leaf
  G: "#44702a", // leaf shade
  s: "#7a5a3a", // reddish stem
  P: "#d39cf0", // flower light
  p: "#a05cc8", // flower
  m: "#6e3a8a", // flower shade
};
const LETTUCE = {
  c: "#dcf2a4", // pale heart
  l: "#a8da6c", // light frilly edge
  g: "#78b848", // leaf
  o: "#4f8f2e", // outer leaf
  O: "#3b7022", // outer leaf shade
  v: "#2f5e1c", // vein / shadow
  y: "#ecd84a", // flower (wild lettuce bolts)
};

const oreganoBloom = [
  "....P.....P",
  "...PpP.P.PpP",
  "...mpm.pPmpm",
  "....s.PpP.s",
  "..P.s.mpm.s.P",
  ".PpPL.Ls.LgPpP",
  ".mpmgLgsLgLmpm",
  "..sLgsLgLgsgs",
  "LgLgLgsGsgGLgL",
  ".gGsgGsLsGsgG",
  "..GgsGgsgsGg",
  "...GsG.sG.sG",
  ".....s..s.s",
];

const ART = {
  foodcraft_oregano_crop_0: [OREGANO, [
    ".......L.L",
    "......LgLgL",
    ".......gsg",
    "........s",
    "........s",
  ]],
  foodcraft_oregano_crop_1: [OREGANO, [
    ".........L",
    "......L.LgL",
    ".....LgLgsg.L",
    "....gLsgLs.Lg",
    ".....gGsgsGg",
    "......GsGsG",
    ".......s.s",
  ]],
  foodcraft_oregano_crop_2: [OREGANO, [
    ".......L",
    "....L.LgL..L",
    "...LgL.s.LLgL",
    "....gsLgLgsg",
    ".L..Lsg.sLg..L",
    "LgLgLgsGsgGLgL",
    ".gGsgGsLsGsgG",
    "..GgsGgsgsGg",
    "...GsG.sG.sG",
    ".....s..s.s",
  ]],
  foodcraft_oregano_crop_3: [OREGANO, oreganoBloom],
  foodcraft_wild_oregano: [OREGANO, oreganoBloom],

  foodcraft_lettuce_crop_0: [LETTUCE, [
    "......l..l",
    ".....lgllgl",
    "......gggg",
    ".......vv",
  ]],
  foodcraft_lettuce_crop_1: [LETTUCE, [
    "......l.ll",
    "....lgllgglgl",
    "...lggcllcggl",
    "..ogglccclggo",
    "..Oogglllggoo",
    "...OoooooooO",
  ]],
  foodcraft_lettuce_crop_2: [LETTUCE, [
    ".....l.ll.l",
    "....lgllglgl",
    "...lggcllcggl",
    "..lgglcccclggl",
    "..oggllcclggoo",
    ".oogglllllggooo",
    ".Ooogggggggooo",
    "..OOoooooooOO",
  ]],
  foodcraft_lettuce_crop_3: [LETTUCE, [
    "......l.l",
    "....l.lllll.l",
    "...lgllcclllgl",
    "..lgglccccclggl",
    ".lgglcccccclggl",
    ".oggllcccclggoo",
    "oogggllllllggooo",
    "OoogggoggOgggooo",
    ".OOoooggggoooOO",
    "..OOOoooooooOO",
  ]],
  // wild lettuce has bolted: a stalk with small yellow flowers above the head
  foodcraft_wild_lettuce: [LETTUCE, [
    "......y.y",
    ".....yly.y",
    "......l.ly",
    ".......l",
    ".......g",
    ".......g",
    "......lg",
    "....l.lgl.l",
    "...lglllcllgl",
    "..lgglccclggl",
    "..ogglccclggo",
    ".oogglllllggoo",
    ".Ooogggggggooo",
    "..OOoooooooOO",
  ]],
};

for (const [name, [palette, drawing]] of Object.entries(ART)) {
  if (drawing.length > 16 || drawing.some((r) => r.length > 16)) throw new Error(`${name}: drawing larger than 16x16`);
  const rows = [...Array(16 - drawing.length).fill(""), ...drawing].map((r) => r.padEnd(16, "."));
  const px = rows.map((row) => [...row].map((c) => {
    if (c === ".") return [0, 0, 0, 0];
    if (!palette[c]) throw new Error(`${name}: unknown colour '${c}'`);
    return hex(palette[c]);
  }));
  writePng(path.join(OUT, `${name}.png`), px);
}
console.log(`plant art: ${Object.keys(ART).length} textures written`);
