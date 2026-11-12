#!/usr/bin/env node
// Fish item icons in the vanilla style: each fish lies on the diagonal, head bottom left, tail top right, with a
// darker edge, a lighter belly, an eye and fins, plus what makes the species recognisable. Also the cooked fish
// (the same fish, browned) and the fish buckets: the fish sitting in the vanilla water bucket
// (tools/data/vanilla_bucket_water.png, from Mojang's bedrock-samples resource pack).
// Overwrites those textures; edit the species table here and rerun.
// Usage: node tools/art_fish.mjs [--preview <png>]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, writePng, hex, shade, mix } from "./png.mjs";
import { FISH } from "../packs/foodcraft_bp/scripts/fish_data.js";

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(TOOLS, "..", "packs/foodcraft_rp/textures/items");
const BUCKET = readPng(path.join(TOOLS, "data/vanilla_bucket_water.png"));

// Per species. Lengths are along the fish (a), heights across it (b), both in half pixels on the diagonal.
// len: snout to tail tip. body: fraction of len before the tail. h: half height of the body. tail: half height of the
// tail fin. back/belly: colours (belly defaults to the species accent). pattern(a, b, h, len) -> colour or undefined.
// extra: [{ a, b, c }] pixels added in fish space (a from the snout, b across, c colour).
const SPECIES = {
  arctic_char: { len: 22, h: 3.2, tail: 3, back: "#5f6e7c", belly: "#e0603a",
    pattern: (a, b) => (b < -0.8 && (Math.round(a * 2) % 5 === 0) ? "#e8d8c0" : undefined) },
  trout: { len: 24, h: 3.6, tail: 3.2, back: "#7f8752", belly: "#e8d8b8",
    pattern: (a, b) => Math.abs(b) < 0.6 ? "#d98c8c" : (b < -1 && Math.round(a * 2 + b * 3) % 4 === 0 ? "#3e3a28" : undefined) },
  perch: { len: 21, h: 3.8, tail: 3, back: "#8fae3a", belly: "#e8e2a8", dorsal: "#5a6e28",
    pattern: (a, b) => (b < 1 && a > 4 && a < 15 && Math.round(a * 2) % 5 < 2 ? "#3a521c" : undefined), fins: "#e0603a" },
  pike: { len: 27, body: 0.82, h: 2.6, tail: 2.6, back: "#4f6c32", belly: "#d8dc9a",
    pattern: (a, b) => (b < 0.8 && a > 5 && (Math.round(a * 3 + b * 5) % 6 === 0) ? "#c9d48a" : undefined) },
  // Catfish: moved up from the corner to make room for two long whiskers (barbels) hanging from the mouth.
  catfish: { len: 21, h: 3.6, tail: 2.8, back: "#5b5148", belly: "#a89a86", head: 1.1, shift: 1.6, whiskers: "#2a221c" },
  piranha: { len: 19, h: 4.6, tail: 3.2, back: "#6f7e8e", belly: "#d13b2b",
    extra: [{ a: 0.5, b: 1, c: "#f4f4f4" }, { a: 1, b: 1.5, c: "#f4f4f4" }] },
  herring: { len: 22, h: 2.8, tail: 2.8, back: "#4e6a88", belly: "#e8eef4", mid: "#a9b8c8" },
  mackerel: { len: 24, h: 3, tail: 3, back: "#2f7a7c", belly: "#e2eaec",
    pattern: (a, b) => (b < -0.4 && Math.round(a * 2 - b * 2) % 4 === 0 ? "#173c44" : undefined) },
  saithe: { len: 24, h: 3.4, tail: 3.2, back: "#3e4852", belly: "#aab4bc",
    pattern: (a, b) => (Math.abs(b - 0.3) < 0.3 && a > 3 ? "#c8d0d6" : undefined) },
  wolffish: { len: 25, body: 0.86, h: 3.6, tail: 2.6, back: "#7a6a5a", belly: "#a89888", head: 1.15,
    pattern: (a, b) => (a > 6 && Math.round(a * 2) % 6 < 2 ? "#3a3029" : undefined),
    extra: [{ a: 0.5, b: 1, c: "#f0ead8" }, { a: 1, b: 1.5, c: "#f0ead8" }] },
  halibut: { len: 24, h: 5, tail: 3.6, back: "#6b5b45", belly: "#8a7a5e", eyeUp: true,
    pattern: (a, b) => (Math.round(a * 3 + b * 7) % 9 === 0 ? "#4a3e2e" : undefined) },
  tuna: { len: 27, h: 4.2, tail: 4.2, back: "#26364c", belly: "#c0c8d4", mid: "#5a6e88",
    finlets: "#f0c830" },
  // Swordfish: moved up from the corner so the sword (a bright line with a dark edge) reaches into it.
  swordfish: { len: 19, h: 3.2, tail: 3.8, back: "#3e5274", belly: "#b8c4d6", dorsal: "#2a3a56", shift: 2.6,
    sword: { light: "#e4e9f0", dark: "#5e6878" } },
};

// --- drawing in fish space ---------------------------------------------------------------------------
// A pixel (x, y) maps to a (along the fish, from the snout) and b (across it, + is the belly) by the placement.
function render(spec, place, colours) {
  const { len, body = 0.8, h: H, tail: T, head = 1 } = spec;
  const tailStart = len * body;
  const half = (a) => {
    if (a < 0 || a > len) return -1;
    if (a <= tailStart) {
      const t = a / tailStart;
      const front = Math.min(1, Math.sqrt(t / 0.32)) * head;
      const back = t < 0.45 ? 1 : 1 - ((t - 0.45) / 0.55) ** 1.4 * 0.6;
      return H * Math.min(front, back, head > 1 ? Math.max(back, 1) : 1) * (t < 0.32 ? 1 : 1);
    }
    const t = (a - tailStart) / (len - tailStart);
    const fork = t > 0.82 ? T * 0.35 * ((t - 0.82) / 0.18) : 0; // a small notch in the middle of the tail end
    return Object.assign(H * 0.4 + (T * 1.25 - H * 0.4) * Math.min(1, t * 1.4), { fork });
  };
  const inside = (x, y) => {
    const { a, b } = place(x, y);
    const hh = half(a);
    if (hh < 0) return false;
    if (Math.abs(b) > hh + 0.25) return false;
    if (hh.fork && Math.abs(b) < hh.fork) return false;
    return true;
  };
  const px = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => [0, 0, 0, 0]));
  const C = (h) => colours(h);
  const back = hex(C(spec.back)), belly = hex(C(spec.belly)), mid = spec.mid ? hex(C(spec.mid)) : mix(back, belly, 0.5);
  const edge = (c) => shade(c, 0.6);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!inside(x, y)) continue;
    const { a, b } = place(x, y);
    const hh = half(a);
    const rel = b / Math.max(hh, 0.5);
    let c = rel < -0.25 ? back : rel > 0.35 ? belly : mid;
    const p = spec.pattern?.(a, b, hh, len);
    if (p && a > 1.5 && a <= tailStart) c = hex(C(p));
    if (a > tailStart) c = shade(back, 0.9); // tail fin
    if (spec.finlets && a > tailStart - 3 && a <= tailStart && Math.abs(rel) > 0.7) c = hex(C(spec.finlets));
    const boundary = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inside(x + dx, y + dy));
    if (boundary) c = rel > 0.35 && a <= tailStart ? shade(belly, 0.7) : edge(back);
    px[y][x] = c;
  }
  // Dorsal fin on the back, pectoral fin on the belly side.
  const at = (a, b) => place.inverse(a, b);
  const put = (a, b, c) => {
    const [x, y] = at(a, b);
    if (x >= 0 && x < 16 && y >= 0 && y < 16) px[y][x] = c;
  };
  const dorsal = hex(C(spec.dorsal ?? shade(back, 0.75).slice(0, 3).reduce((s, v) => s + v.toString(16).padStart(2, "0"), "#")));
  // A fin grows out from the edge: walk from the middle of the fish outwards to the first empty pixel.
  const fin = (a, dir, size, c) => {
    let b = 0;
    while (Math.abs(b) < 12) {
      const [x, y] = at(a, b);
      if (x < 0 || x > 15 || y < 0 || y > 15) return;
      if (!px[y][x][3]) break;
      b += dir * 0.25;
    }
    for (let i = 0; i < size; i++) put(a, b + dir * i * 0.9, c);
  };
  fin(len * 0.42, -1, spec.dorsal || spec.sword ? 2 : 1, dorsal);
  fin(len * 0.52, -1, 1, dorsal);
  const fins = spec.fins ? hex(C(spec.fins)) : shade(belly, 0.75);
  fin(len * 0.45, 1, 1, fins);
  // Sword: a long bill in front of the snout.
  if (spec.sword) {
    const [mx, my] = at(-0.4, 0); // just in front of the snout
    const { dir, edge, length } = place.sword;
    for (let k = 0; k < length; k++) {
      const x = mx + dir[0] * k, y = my + dir[1] * k;
      if (x < 0 || x > 15 || y < 0 || y > 15) break;
      if (!px[y][x][3]) px[y][x] = hex(C(spec.sword.light));
      const ex = x + edge[0], ey = y + edge[1];
      if (ex >= 0 && ex < 16 && ey >= 0 && ey < 16 && !px[ey][ex][3]) px[ey][ex] = hex(C(spec.sword.dark));
    }
  }
  for (const e of spec.extra ?? []) put(e.a, e.b, hex(C(e.c)));
  // Eye: dark, near the snout on the back side (a halibut has both eyes on top).
  put(2.4 * head, spec.eyeUp ? -1.4 : -0.7, [20, 20, 20, 255]);
  // Whiskers: pixel lines from the mouth, drawn where the icon is still empty.
  if (spec.whiskers) {
    const [mx, my] = at(-0.4, 0.6); // just in front of the mouth
    for (const line of place.whiskers) for (const [dx, dy] of line) {
      const x = mx + dx, y = my + dy;
      if (x >= 0 && x < 16 && y >= 0 && y < 16 && !px[y][x][3]) px[y][x] = hex(C(spec.whiskers));
    }
  }
  return px;
}

// Item icon: the fish on the diagonal, snout at the bottom left. Fish units are 1/F pixel.
const F = 1.45, FB = 1.15; // along / across the fish: a bit shorter and plumper than fish units
function diagonal(len, shift = 0) {
  const s = Math.SQRT1_2, start = 7.4 - (len / F / 2) * s + shift * s; // centre the fish, a bit towards the snout
  const place = (x, y) => {
    const dx = x + 0.5 - start, dy = 15.5 - y - start + 0.5; // from the snout corner, y up
    return { a: (dx + dy) * s * F, b: (dx - dy) * s * FB };
  };
  place.inverse = (a, b) => {
    const dx = (a / F + b / FB) * s, dy = (a / F - b / FB) * s;
    return [Math.floor(dx + start), Math.floor(16 - dy - start)];
  };
  place.whiskers = [[[0, 0], [-1, 0], [-2, 1], [-3, 1], [-4, 2]], [[0, 1], [0, 2], [-1, 3], [-1, 4]]]; // left and down
  place.sword = { dir: [-1, 1], edge: [1, 0], length: 8 }; // down to the bottom left corner
  return place;
}

// Bucket icon: a small fish lying nearly level on top of the water, head left (like the vanilla cod bucket).
function inBucket(len) {
  const k = 9.5 / len, kb = k * 1.3, angle = 0.15, ca = Math.cos(angle), sa = Math.sin(angle), x0 = 3, y0 = 3.4;
  const place = (x, y) => {
    const dx = x + 0.5 - x0, dy = y0 - (y + 0.5);
    return { a: (dx * ca + dy * sa) / k, b: (dx * sa - dy * ca) / kb };
  };
  place.inverse = (a, b) => {
    const u = a * k, v = b * kb; // along, across in pixels
    const dx = u * ca + v * sa, dy = u * sa - v * ca;
    return [Math.floor(dx + x0), Math.floor(y0 - dy)];
  };
  place.whiskers = [[[0, 0], [-1, 0], [-2, 1]], [[0, 1], [-1, 2], [-1, 3]]]; // left and down, over the bucket rim
  place.sword = { dir: [-1, 0], edge: [0, 1], length: 4 }; // straight out to the left
  return place;
}

// The vanilla water bucket moved down one row, with the fish lying over its rim and water (rows 0-5).
// Below that the bucket wall stays in front of the fish.
const isWall = (p) => p[3] && p[0] < 70 && p[2] < 90;
function bucketWith(fish) {
  const shifted = [Array.from({ length: 16 }, () => [0, 0, 0, 0]), ...BUCKET.slice(0, 15)];
  return shifted.map((row, y) => row.map((p, x) => {
    const f = fish[y][x];
    if (!f[3] || y > 5) return p;
    if (y >= 4 && isWall(p)) return p;
    return f;
  }));
}

const identity = (h) => h;
const browned = (h) => {
  const [r, g, b] = mix(hex(h), hex("#8a5a2b"), 0.55);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};

const sheets = [];
for (const id of Object.keys(FISH)) {
  const spec = SPECIES[id];
  if (!spec) throw new Error(`no drawing for fish ${id}`);
  const raw = render(spec, diagonal(spec.len, spec.shift), identity);
  const cooked = render(spec, diagonal(spec.len, spec.shift), browned);
  const bucket = bucketWith(render(spec, inBucket(spec.len), identity));
  writePng(path.join(OUT, `foodcraft_${id}.png`), raw);
  writePng(path.join(OUT, `foodcraft_cooked_${id}.png`), cooked);
  writePng(path.join(OUT, `foodcraft_${id}_bucket.png`), bucket);
  sheets.push([raw, bucket, cooked]);
}

const zoomAt = process.argv.indexOf("--zoom"); // --zoom <png> <id,id,...>: big view of a few fish
if (zoomAt > 0) {
  const ids = process.argv[zoomAt + 2].split(","), S = 20, list = ids.flatMap((id) => sheets[Object.keys(FISH).indexOf(id)].slice(0, 2));
  writePng(process.argv[zoomAt + 1], Array.from({ length: 16 * S }, (_, y) => Array.from({ length: list.length * 17 * S }, (_, x) => {
    const i = Math.floor(x / (17 * S)), lx = Math.floor((x % (17 * S)) / S), ly = Math.floor(y / S);
    const p = lx < 16 ? list[i][ly][lx] : [255, 255, 255, 255];
    return p[3] ? p : (lx + ly) % 2 ? [200, 200, 200, 255] : [235, 235, 235, 255];
  })));
}
const at = process.argv.indexOf("--preview");
if (at > 0) {
  const S = 8, cols = sheets.length;
  const sheet = Array.from({ length: 3 * 17 * S }, (_, y) => Array.from({ length: cols * 17 * S }, (_, x) => {
    const c = Math.floor(x / (17 * S)), r = Math.floor(y / (17 * S));
    const lx = Math.floor((x % (17 * S)) / S), ly = Math.floor((y % (17 * S)) / S);
    if (lx > 15 || ly > 15) return [255, 255, 255, 255];
    const p = sheets[c][r][ly][lx];
    return p[3] ? p : (lx + ly) % 2 ? [200, 200, 200, 255] : [235, 235, 235, 255];
  }));
  writePng(process.argv[at + 1], sheet);
}
console.log(`fish art: ${sheets.length} fish, cooked fish and buckets written`);
