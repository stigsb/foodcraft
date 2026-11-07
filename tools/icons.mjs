// 16x16 placeholder icons: a shape filled with main/accent colours and a dark vanilla-style outline.
import { hex, shade, mix } from "./png.mjs";

const E = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
const FIXED = { eye: "#111111", bowl: "#7a4a24", glass: "#cfe8ef", rim: "#9a9a9a", blade: "#c8ccd0", stem: "#4f7d2c" };

// Each shape returns a colour role for pixel (x, y), or null for transparent.
const SHAPES = {
  fish(x, y, { size = 2 }) {
    const len = [0, 4, 5, 6][size], cy = 8;
    if (E(x, y, 7, cy, len, 2 + size * 0.5)) {
      if (x === 7 - len + 2 && y === cy - 1) return "eye";
      return y >= cy ? "accent" : "main";
    }
    const tx = 7 + len - 1;
    if (x >= tx && x <= tx + 3 && Math.abs(y + 0.5 - cy) <= x - tx + 0.5) return "main";
    return null;
  },
  fillet(x, y) {
    const u = (x - 7.5) * 0.8 + (y - 7.5) * 0.6, v = -(x - 7.5) * 0.6 + (y - 7.5) * 0.8;
    if ((u / 6.5) ** 2 + (v / 2.8) ** 2 > 1) return null;
    return (x + y) % 3 === 0 ? "accent" : "main";
  },
  bowl(x, y) {
    if (y >= 8 && E(x, y, 8, 8, 6.5, 5.5)) return "bowl";
    if (y >= 6 && y < 8 && E(x, y, 8, 7.5, 6, 1.6)) return (x * 7 + y * 3) % 5 === 0 ? "accent" : "main";
    return null;
  },
  disc(x, y) {
    if (!E(x, y, 8, 8, 6.5, 6.5)) return null;
    return E(x, y, 8, 8, 5, 5) && (x * 5 + y * 3) % 7 === 0 ? "accent" : "main";
  },
  blob(x, y) {
    if (x >= 7 && x <= 8 && y >= 2 && y <= 4) return "stem";
    if (!E(x, y, 8, 9.5, 5.5, 5.5)) return null;
    return x === 6 && y === 7 ? "accent" : "main";
  },
  head(x, y) {
    if (!E(x, y, 8, 9, 6.5, 6)) return null;
    return Math.abs(x - 8) === Math.abs(y - 9) || x === 8 ? "accent" : "main";
  },
  cob(x, y) {
    if (y >= 11 && E(x, y, 8, 12, 5, 3.5) && Math.abs(x - 8) >= 2) return "stem";
    if (!E(x, y, 8, 7.5, 3, 6.5)) return null;
    return (x + y) % 2 === 0 ? "accent" : "main";
  },
  stick(x, y) {
    if (x < 2 || x > 13 || Math.abs(x - (15 - y)) > 1) return null;
    return x <= 3 || x >= 12 ? "accent" : "main";
  },
  seeds(x, y) {
    const dots = [[4, 5], [9, 4], [6, 9], [11, 9], [8, 12], [3, 11]];
    return dots.some(([dx, dy]) => x >= dx && x <= dx + 1 && y >= dy && y <= dy + 1) ? "main" : null;
  },
  pile(x, y) {
    if (y < 5 || y > 13 || Math.abs(x + 0.5 - 8) > (y - 4) * 0.9) return null;
    return (x * 3 + y) % 7 === 0 ? "accent" : "main";
  },
  shell(x, y) {
    if (y >= 12 && y <= 13 && x >= 6 && x <= 9) return "accent";
    const dx = x + 0.5 - 8, dy = 12 - (y + 0.5);
    if (dy < 0 || dx * dx + dy * dy > 49) return null;
    return Math.round(Math.atan2(dy, dx) * 4) % 2 === 0 ? "accent" : "main";
  },
  bottle(x, y) {
    if (x >= 7 && x <= 8 && y >= 2 && y <= 4) return "glass";
    if (!E(x, y, 8, 10, 4.5, 4.5)) return null;
    return y >= 8 ? "main" : "glass";
  },
  tray(x, y) {
    if (x < 2 || x > 13 || y < 5 || y > 12) return null;
    if (x === 2 || x === 13 || y === 5 || y === 12) return "rim";
    return (x * 5 + y * 3) % 6 === 0 ? "accent" : "main";
  },
  bun(x, y) {
    if (!E(x, y, 8, 8, 6, 6)) return null;
    const r = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
    return (r > 1.5 && r < 2.5) || (r > 4 && r < 5) ? "accent" : "main";
  },
  bar(x, y) {
    if (x < 3 || x > 12 || y < 5 || y > 11) return null;
    return y <= 6 ? "accent" : "main";
  },
  waffle(x, y) {
    if (x < 2 || x > 13 || y < 2 || y > 13) return null;
    return x % 3 === 2 || y % 3 === 2 ? "accent" : "main";
  },
  stack(x, y) {
    for (const cy of [11, 8.5, 6]) if (E(x, y, 8, cy, 6.5, 1.8)) return cy === 6 && x % 4 === 1 ? "accent" : "main";
    return null;
  },
  taco(x, y) {
    if (y < 7 || !E(x, y, 8, 8, 7, 6)) return null;
    return y <= 8 ? "accent" : "main";
  },
  // Handle at the bottom left, blade to the top right, like vanilla swords: the hand holds the bottom-left corner.
  knife(x, y) {
    if (x + y < 14 || x + y > 15 || x < 2 || x > 13) return null;
    if (x === 13 && y === 1) return null; // pointed tip
    return x <= 5 ? "main" : "blade";
  },
  // A bucket (rim grey) with the fish's colours showing in the water at the top.
  fish_bucket(x, y) {
    const half = 6 - Math.floor((y - 4) / 4); // the bucket narrows towards the bottom
    if (y < 3 || y > 14 || Math.abs(x + 0.5 - 8) > half) return null;
    if (y <= 4) return (x + y) % 3 === 0 ? "accent" : "main"; // the fish in the water
    if (y === 5) return "glass";
    return "rim";
  },
  // crop stages (cross texture): 0 sprout, 1-2 growing, 3 ripe with produce dots in the accent colour
  crop0: (x, y) => (Math.abs(x - 8) <= 1 && y >= 11) || (y === 11 && Math.abs(x - 8) <= 3) ? "main" : null,
  crop1: (x, y) => (x % 4 === 1 && y >= 9) || (y === 10 && x % 2 === 0) ? "main" : null,
  crop2: (x, y) => (x % 3 === 1 && y >= 5) || (y % 4 === 1 && y >= 5 && x % 2 === 0) ? "main" : null,
  crop3(x, y) {
    if ((x % 5 === 2 || x % 5 === 3) && y >= 3 && y <= 6) return "accent";
    return (x % 3 === 1 && y >= 3) || (y % 4 === 1 && y >= 3 && x % 2 === 0) ? "main" : null;
  },
};

export function drawIcon({ shape, main, accent = main, size }) {
  const fn = SHAPES[shape];
  if (!fn) throw new Error(`unknown icon shape ${shape}`);
  const colours = { main: hex(main), accent: hex(accent) };
  for (const [k, v] of Object.entries(FIXED)) colours[k] = hex(v, k === "glass" ? 190 : 255);
  const roles = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x, y, { size })));
  const isCrop = shape.startsWith("crop") || shape === "knife"; // thin shapes: an outline would darken every pixel
  return roles.map((row, y) =>
    row.map((role, x) => {
      if (!role) return [0, 0, 0, 0];
      const c = colours[role];
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !roles[y + dy]?.[x + dx]);
      return edge && !isCrop ? shade(c, 0.55) : c; // crops are see-through plants, no outline
    })
  );
}

export const browned = (h) => {
  const [r, g, b] = mix(hex(h), hex("#8a5a2b"), 0.55);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};
