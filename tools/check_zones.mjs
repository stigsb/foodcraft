// Checks scripts/fish_data.js against a game version's biome list.
// Usage: node tools/check_zones.mjs <file URL of @minecraft/vanilla-data lib/index.js>
import { ZONES } from "../packs/foodcraft_bp/scripts/fish_data.js";

const vd = await import(process.argv[2]);
const known = new Set(Object.values(vd.MinecraftBiomeTypes));
const seen = new Map();
for (const z of ZONES) for (const b of z.biomes) {
  if (!known.has(`minecraft:${b}`)) console.log("unknown", b);
  if (seen.has(b)) console.log("twice", b, seen.get(b), z.name);
  seen.set(b, z.name);
}
console.log("biomes", seen.size);
console.log("not in a zone:", [...known].filter((b) => !seen.has(b.slice(10))).join(" "));
