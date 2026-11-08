#!/usr/bin/env node
// Pixel art for the corn plant (cross geometry, 16x16): growth stages 0-3 of the lower half, stages 2-3 of
// the top half, and wild corn. Overwrites the corn textures; edit the drawings here and rerun.
// Usage: node tools/art_corn.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex } from "./png.mjs";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packs/foodcraft_rp/textures/blocks");

const PALETTE = {
  s: "#4b7a2a", // stalk
  S: "#3a6220", // stalk shade
  l: "#6aa63a", // leaf
  d: "#3f6c22", // leaf shade
  h: "#93c855", // leaf highlight
  k: "#a9c463", // husk
  K: "#86a447", // husk shade
  y: "#f4cc38", // kernels
  o: "#d29e18", // kernels shade
  r: "#b5683a", // silk
  t: "#e0c878", // tassel
  u: "#b09048", // tassel shade
};

const ART = {
  foodcraft_corn_crop_0: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "........h.......",
    ".......hl.......",
    ".......l...h....",
    "...h...l..hl....",
    "....hl.s.ll.....",
    "......lsl.......",
    ".......s........",
  ],
  foodcraft_corn_crop_1: [
    "................",
    "................",
    "................",
    "................",
    "........h.......",
    ".......hl.......",
    ".......ls...hh..",
    "..hh...sl..hl...",
    "....hl.s..l.....",
    "......lsll......",
    ".d.....s.....d..",
    "..dd..Ssl...d...",
    "....ddSs.ddd....",
    "......Ss........",
    ".....dSsd.......",
    ".......s........",
  ],
  foodcraft_corn_crop_2: [
    ".......sh.......",
    "..h....sl...hh..",
    "...hl..sl..hl...",
    ".....l.sl.l.....",
    "......lsll......",
    ".d.....Ss....d..",
    "..ddd..Ssl.dd...",
    ".....ddSsdd.....",
    "..h....Ss.......",
    "...hl..Ssl..hh..",
    ".....llSs..l....",
    ".......Ssll.....",
    "...d...Ss.......",
    "....dd.Ssl.dd...",
    "......dSsdd.....",
    ".......Ss.......",
  ],
  foodcraft_corn_crop_3: [
    ".......sh.......",
    "..h....sl...hh..",
    "...hl..sl..hl...",
    ".....r.sl.l.....",
    "....rKksll......",
    "....Kyok.....d..",
    "....kyoks..dd...",
    "....kyoKsdd.....",
    "....Kyok........",
    ".....KkSsr..hh..",
    ".....llSkk.l....",
    ".......Skyo.....",
    "...d...Skyo.....",
    "....dd.Skyo.d...",
    "......dSsKdd....",
    ".......Ss.......",
  ],
  foodcraft_corn_crop_top_2: [
    "................",
    "................",
    "................",
    "................",
    ".......l........",
    ".......h........",
    ".......sl.......",
    "...hh..sl.......",
    ".....h.s..hh....",
    "......lsl.l.....",
    ".......sll......",
    "..dd...Ss....d..",
    "....dd.Ssl.dd...",
    "......dSsdd.....",
    "..h....Ss...hh..",
    "...hl..Ssl.hl...",
  ],
  foodcraft_corn_crop_top_3: [
    "..t...u..t......",
    "...t..t.t...u...",
    ".u..t.ttt..t....",
    "...u.ttutt.t....",
    ".....uttu.......",
    ".......tu.......",
    ".......sl.......",
    "...hh..sl.......",
    ".....h.s..hh....",
    "......lsl.l.....",
    ".......sll......",
    "..dd...Ss....d..",
    "....dd.Ssl.dd...",
    "......dSsdd.....",
    "..h....Ss...hh..",
    "...hl..Ssl.hl...",
  ],
  // wild corn: one block, a short plant with a cob and a tassel
  foodcraft_wild_corn: [
    "................",
    "................",
    ".......t.u......",
    "......tut.t.....",
    ".......tu.......",
    ".......sl.......",
    "..hh...sl..hh...",
    "....hl.s..l.....",
    ".....rKsll......",
    "....Kyok.....d..",
    "....kyoks..dd...",
    "....KyoKsdd.....",
    "..d..KkSs.......",
    "...dd..Ssl.dd...",
    ".....ddSsdd.....",
    ".......Ss.......",
  ],
};

for (const [name, rows] of Object.entries(ART)) {
  if (rows.length !== 16 || rows.some((r) => r.length !== 16)) throw new Error(`${name}: drawing must be 16x16`);
  const px = rows.map((row) => [...row].map((c) => (c === "." ? [0, 0, 0, 0] : hex(PALETTE[c]))));
  writePng(path.join(OUT, `${name}.png`), px);
}
console.log(`corn art: ${Object.keys(ART).length} textures written`);
