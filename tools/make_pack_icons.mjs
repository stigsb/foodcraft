#!/usr/bin/env node
// Pack icons for both packs: the pancakes item icon, scaled up 16x with sharp pixels (256x256).
// Rerun after redrawing the pancakes (tools/art_berries.mjs). Usage: node tools/make_pack_icons.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, writePng } from "./png.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "packs/foodcraft_rp/textures/items/foodcraft_pancakes.png");
const SCALE = 16;

const src = readPng(SOURCE);
const big = Array.from({ length: src.length * SCALE }, (_, y) =>
  Array.from({ length: src[0].length * SCALE }, (_, x) => src[Math.floor(y / SCALE)][Math.floor(x / SCALE)]));
for (const pack of ["foodcraft_bp", "foodcraft_rp"]) writePng(path.join(ROOT, "packs", pack, "pack_icon.png"), big);
console.log(`pack icons: ${big[0].length}x${big.length} from ${path.relative(ROOT, SOURCE)}`);
