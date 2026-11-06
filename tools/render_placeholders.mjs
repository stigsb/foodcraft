#!/usr/bin/env node
// Render 16x16 placeholder PNGs from the concept SVGs in docs/superpowers/specs/images.
// Usage: node tools/render_placeholders.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, crc32 } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SVG_DIR = join(ROOT, "docs/superpowers/specs/images");
const RP = join(ROOT, "packs/foodcraft_rp/textures");
const TILE_SIZES = { 96: 6, 128: 8, 160: 10 };
const TILE_BG = "#3b3b46";

const RECT = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9a-fA-F]{6})"\/>/g;
const TEXT = /<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g;

function chunk(tag, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(tag, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** pixels: 16 rows of 16 [r, g, b, a] arrays. */
function writePng(path, pixels) {
  const raw = Buffer.concat(pixels.map((row) => Buffer.from([0, ...row.flat()])));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(16, 0);
  ihdr.writeUInt32BE(16, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

function hexRgba(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
}

/** Yield [label, pixels] for every labelled tile in one SVG. */
function* tilesOf(svgText) {
  const rects = [...svgText.matchAll(RECT)].map((m) => [+m[1], +m[2], +m[3], +m[4], m[5]]);
  const labels = [...svgText.matchAll(TEXT)].map((m) => [+m[1], +m[2], m[3].trim()]);
  const tiles = rects.filter(([, , w, h, f]) => f === TILE_BG && TILE_SIZES[w] && w === h);
  for (const [tx, ty, size] of tiles) {
    const px = TILE_SIZES[size];
    const hit = labels.find(([lx, ly]) => tx <= lx && lx <= tx + size && ty + size < ly && ly < ty + size + 40);
    if (!hit) continue;
    const pixels = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => [0, 0, 0, 0]));
    for (const [x, y, w, h, f] of rects) {
      if (w === px && h === px && tx <= x && x < tx + size && ty <= y && y < ty + size) {
        pixels[Math.trunc((y - ty) / px)][Math.trunc((x - tx) / px)] = hexRgba(f);
      }
    }
    yield [hit[2], pixels];
  }
}

function outPath(svgName, label) {
  let name = label.replaceAll(" ", "_");
  if (svgName === "ingredients") {
    if (name === "dough") name = "pizza_dough";
    return join(RP, "items", `foodcraft_${name}.png`);
  }
  if (svgName === "pizzas") {
    return join(RP, "items", name.startsWith("raw_")
      ? `foodcraft_${name.replace("raw_", "raw_pizza_")}.png`
      : `foodcraft_pizza_${name}.png`);
  }
  if (svgName === "crops") {
    const i = name.lastIndexOf("_");
    return join(RP, "blocks", `foodcraft_${name.slice(0, i)}_crop_${name.slice(i + 1)}.png`);
  }
  if (svgName === "oven") return join(RP, "blocks", `foodcraft_oven_front_${name}.png`);
  throw new Error(`unknown svg ${svgName}`);
}

function main() {
  const written = [];
  for (const file of readdirSync(SVG_DIR).filter((f) => f.endsWith(".svg")).sort()) {
    const svgName = basename(file, ".svg");
    for (const [label, pixels] of tilesOf(readFileSync(join(SVG_DIR, file), "utf8"))) {
      const path = outPath(svgName, label);
      writePng(path, pixels);
      written.push(path);
    }
  }
  const copies = [
    ["items/foodcraft_pineapple_crown.png", "items/foodcraft_pineapple.png"],
    ["blocks/foodcraft_oven_side.png", "blocks/foodcraft_oven_front_empty.png"],
    ["blocks/foodcraft_oven_top.png", "blocks/foodcraft_oven_front_empty.png"],
  ];
  for (const plant of ["tomato", "garlic", "oregano", "pineapple"]) {
    copies.push([`blocks/foodcraft_wild_${plant}.png`, `blocks/foodcraft_${plant}_crop_3.png`]);
  }
  for (const [dst, src] of copies) {
    copyFileSync(join(RP, src), join(RP, dst));
    written.push(join(RP, dst));
  }
  console.log(`wrote ${written.length} textures`);
  return written;
}

main();
