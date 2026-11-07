#!/usr/bin/env node
// Cube lists -> packs/foodcraft_rp/models/blocks/<name>.geo.json + textures/blocks/foodcraft_<name>.png (box UV).
// Usage: node tools/make_models.mjs <name...>   The texture is only written if missing (kids' art is safe).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex, shade } from "./png.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RP = path.join(ROOT, "packs/foodcraft_rp");

// [origin, size, colour]. Block space: x and z in -8..8, y in 0..16. Integer sizes only (box UV).
const C = (o, s, color) => ({ o, s, color });
const MODELS = {
  scallop_bed: {
    shells: [C([-5, 0, -4], [3, 1, 3], "#e8b9a0"), C([1, 0, -5], [3, 1, 3], "#e0a890"), C([-1, 0, 2], [3, 1, 3], "#f0c8b0"), C([3, 0, 1], [2, 1, 2], "#d89880")],
  },
  cutting_board: {
    board: [C([-6, 0, -4], [12, 1, 8], "#b98a55")],
    small_fish: [C([-3, 1, -1], [5, 1, 2], "#8a9aa8"), C([2, 1, -1], [1, 1, 2], "#6a7a88")],
    medium_fish: [C([-4, 1, -1], [7, 1, 2], "#7a8a6a"), C([3, 1, -1], [1, 1, 2], "#5a6a4a")],
    large_fish: [C([-5, 1, -2], [8, 2, 3], "#6b5b45"), C([3, 1, -1], [2, 1, 2], "#4b3b25")],
    tuna: [C([-5, 1, -2], [8, 2, 3], "#34465e"), C([3, 1, -1], [2, 1, 2], "#24364e")],
    beef: [C([-3, 1, -2], [6, 1, 4], "#c23b3b")],
    potato: [C([-2, 1, -2], [4, 2, 3], "#c8a25a")],
    dough: [C([-3, 1, -3], [6, 1, 6], "#eadbb8")],
  },
  cooking_pot: {
    pot: [
      C([-6, 0, -6], [12, 1, 12], "#3c3c40"),
      C([-6, 1, -6], [12, 8, 1], "#46464c"), C([-6, 1, 5], [12, 8, 1], "#46464c"),
      C([-6, 1, -5], [1, 8, 10], "#404046"), C([5, 1, -5], [1, 8, 10], "#404046"),
      C([-8, 7, -1], [2, 1, 2], "#2c2c30"), C([6, 7, -1], [2, 1, 2], "#2c2c30"),
    ],
    water: [C([-5, 1, -5], [10, 6, 10], "#3f76e4")],
    soup_fish_soup: [C([-5, 1, -5], [10, 6, 10], "#e0cc98")],
    soup_bolognese: [C([-5, 1, -5], [10, 6, 10], "#a8432a")],
    soup_mac_and_cheese: [C([-5, 1, -5], [10, 6, 10], "#f0c040")],
    soup_rice_porridge: [C([-5, 1, -5], [10, 6, 10], "#f2ebd8")],
    ingredient_1: [C([-3, 7, -3], [2, 1, 2], "#e8a060")],
    ingredient_2: [C([1, 7, -2], [2, 1, 2], "#78c048")],
    ingredient_3: [C([-2, 7, 1], [2, 1, 2], "#c23b3b")],
    ingredient_4: [C([2, 7, 2], [2, 1, 2], "#f0dca0")],
  },
};

function build(name) {
  const bones = MODELS[name];
  if (!bones) throw new Error(`unknown model ${name}`);
  // shelf-pack the cube nets: a w x h x d cube needs 2(w+d) x (d+h)
  const W = 64;
  let x = 0, y = 0, rowH = 0;
  const placed = [];
  for (const [bone, cubes] of Object.entries(bones)) {
    for (const c of cubes) {
      const [w, h, d] = c.s, nw = 2 * (w + d), nh = d + h;
      if (x + nw > W) { x = 0; y += rowH; rowH = 0; }
      placed.push({ bone, c, u: x, v: y });
      x += nw;
      rowH = Math.max(rowH, nh);
    }
  }
  const H = Math.max(16, 2 ** Math.ceil(Math.log2(y + rowH)));
  const geo = {
    format_version: "1.21.0",
    "minecraft:geometry": [{
      description: { identifier: `geometry.foodcraft_${name}`, texture_width: W, texture_height: H, visible_bounds_width: 2, visible_bounds_height: 2, visible_bounds_offset: [0, 0.5, 0] },
      bones: Object.keys(bones).map((bone) => ({
        name: bone,
        pivot: [0, 0, 0],
        cubes: placed.filter((p) => p.bone === bone).map((p) => ({ origin: p.c.o, size: p.c.s, uv: [p.u, p.v] })),
      })),
    }],
  };
  fs.writeFileSync(path.join(RP, "models/blocks", `${name}.geo.json`), JSON.stringify(geo, null, 2) + "\n");

  const png = path.join(RP, "textures/blocks", `foodcraft_${name}.png`);
  if (fs.existsSync(png)) return console.log(`${name}: geo written, texture kept`);
  const px = Array.from({ length: H }, () => Array.from({ length: W }, () => [0, 0, 0, 0]));
  const rect = (x0, y0, w, h, rgba) => {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const edge = xx === 0 || yy === 0 || xx === w - 1 || yy === h - 1;
      px[y0 + yy][x0 + xx] = edge && w > 2 && h > 2 ? shade(rgba, 0.7) : rgba;
    }
  };
  for (const { c, u, v } of placed) {
    const [w, h, d] = c.s, col = hex(c.color);
    rect(u + d, v, w, d, shade(col, 1.15)); // top
    rect(u + d + w, v, w, d, shade(col, 0.8)); // bottom
    rect(u, v + d, d, h, shade(col, 0.9)); // east
    rect(u + d, v + d, w, h, col); // north
    rect(u + d + w, v + d, d, h, shade(col, 0.9)); // west
    rect(u + 2 * d + w, v + d, w, h, col); // south
  }
  writePng(png, px);
  console.log(`${name}: geo and texture written (${W}x${H})`);
}

for (const name of process.argv.slice(2)) build(name);
