// Minimal RGBA PNG writer and reader. pixels: rows of [r, g, b, a].
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync, inflateSync, crc32 } from "node:zlib";

function chunk(tag, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(tag, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

export function writePng(path, pixels) {
  const h = pixels.length, w = pixels[0].length;
  const raw = Buffer.concat(pixels.map((row) => Buffer.from([0, ...row.flat()])));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
}

export const hex = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];
export const shade = ([r, g, b, a], k) => [Math.min(255, Math.round(r * k)), Math.min(255, Math.round(g * k)), Math.min(255, Math.round(b * k)), a];
export const mix = (p, q, t) => p.map((v, i) => (i === 3 ? v : Math.round(v + (q[i] - v) * t)));

// Minimal PNG reader: 8-bit RGB or RGBA, not interlaced. Returns rows of [r, g, b, a].
export function readPng(path) {
  const b = readFileSync(path);
  let o = 8, w, h, ch;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), tag = b.toString("ascii", o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (tag === "IHDR") {
      w = d.readUInt32BE(0); h = d.readUInt32BE(4); ch = { 6: 4, 2: 3 }[d[9]];
      if (d[8] !== 8 || !ch || d[12]) throw new Error(`${path}: only 8-bit RGB/RGBA, not interlaced`);
    }
    if (tag === "IDAT") idat.push(d);
    o += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), stride = w * ch, rows = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0, u = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let p = 0;
      if (f === 1) p = a;
      else if (f === 2) p = u;
      else if (f === 3) p = (a + u) >> 1;
      else if (f === 4) { const q = a + u - c, pa = Math.abs(q - a), pb = Math.abs(q - u), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      line[i] = (line[i] + p) & 255;
    }
    rows.push(Array.from({ length: w }, (_, x) => (ch === 4 ? [...line.subarray(x * 4, x * 4 + 4)] : [...line.subarray(x * 3, x * 3 + 3), 255])));
    prev = line;
  }
  return rows;
}
