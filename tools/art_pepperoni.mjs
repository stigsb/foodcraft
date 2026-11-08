#!/usr/bin/env node
// Pixel art for the pepperoni items (16x16): the sausage and the slices. Overwrites those two textures;
// edit the drawings here and rerun. The sausage is held at its tied end, bottom left.
// Usage: node tools/art_pepperoni.mjs [--preview <png>]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex } from "./png.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packs/foodcraft_rp/textures/items");

const PALETTE = {
  o: "#4a140c", // outline
  r: "#a3382a", // sausage / slice
  R: "#7a2418", // shade
  h: "#c8584a", // highlight
  p: "#d86a5a", // cut face
  f: "#f2d2bc", // fat specks
  t: "#e8dcc0", // string
};

const ART = {
  foodcraft_pepperoni_sausage: [
    "................",
    "...........ooo..",
    "..........opfpo.",
    ".........ohppfpo",
    "........ohrpfppo",
    ".......ohrrppfo.",
    "......ohrrrRpo..",
    ".....ohrrrRoo...",
    "....ohrrrRo.....",
    "...ohrrrRo......",
    "..ohrrrRo.......",
    ".ohrrrRo........",
    ".orrrRo.........",
    ".ttRRo..........",
    "t.too...........",
    "t...............",
  ],
  foodcraft_pepperoni_slices: [
    "................",
    "......oooo......",
    ".....ohhhho.....",
    "....ohhhfrro....",
    "....ohfhrrro....",
    "....ohhrrrro....",
    "....ohrrrfro....",
    "..oooorfrrooo...",
    "..ohhoooooohfo..",
    ".ohfhhohhhfrrro.",
    ".ohhhrohfhrrrro.",
    ".ohhrrohhrrrrfo.",
    "..orfrrorrrfro..",
    "..oorrroofrroo..",
    "....ooo.ooooo...",
    "................",
  ],
};

const drawn = {};
for (const [name, rows] of Object.entries(ART)) {
  if (rows.length !== 16 || rows.some((r) => r.length !== 16)) throw new Error(`${name}: drawing must be 16x16`);
  drawn[name] = rows.map((row) => [...row].map((c) => (c === "." ? [0, 0, 0, 0] : hex(PALETTE[c]))));
  writePng(path.join(OUT, `${name}.png`), drawn[name]);
}

const at = process.argv.indexOf("--preview");
if (at > 0) {
  const S = 16, list = Object.values(drawn);
  const sheet = Array.from({ length: 16 * S }, (_, y) =>
    Array.from({ length: list.length * 16 * S + (list.length - 1) * S }, (_, x) => {
      const i = Math.floor(x / (17 * S)), lx = Math.floor((x % (17 * S)) / S), ly = Math.floor(y / S);
      const px = lx < 16 ? list[i]?.[ly]?.[lx] : undefined;
      return px && px[3] ? px : (lx + ly) % 2 ? [200, 200, 200, 255] : [235, 235, 235, 255];
    })
  );
  writePng(process.argv[at + 1], sheet);
}
console.log(`pepperoni art: ${Object.keys(ART).length} textures written`);
