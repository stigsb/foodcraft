# Fish and Feasts (Foodcraft v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the v2 content to the v1 add-on, one playable step at a time:
- 13 fish caught by water zone, and scallops
- four crops
- a cutting board with a knife
- a cooking pot
- an extended pizza oven
- fish, pasta, taco and baking dishes

**Architecture:** Same two packs as v1.
- **Generated content.** Plain items, crafting recipes, furnace recipes, lang lines, atlas entries and placeholder icons come from one data table (`tools/content_v2.mjs`), written by a generator (`tools/make_content.mjs <step>`). The 60+ item files are never hand-copied, and each task turns on only its own content.
- **Hand-written content.** Blocks with behavior (scallop bed, cutting board, cooking pot, crops, wild plants) are hand-written JSON like in v1.
- **Models.** Simple block models come from `tools/make_models.mjs`, which writes `.geo.json` and texture together.
- **Scripts.** Three new script modules: `fishing.js`, `board.js` and `pot.js`. They share fish data with the generator through `scripts/fish_data.js`, which has no `@minecraft` imports so Node can load it too.

**Tech Stack:** As v1:
- Minecraft Bedrock 1.26.60
- `@minecraft/server` 2.11.0
- `format_version` 1.26.50
- plain JavaScript and Node tools, no build step

**Spec:** `docs/superpowers/specs/2026-11-07-fish-and-feasts-design.md`

## Spec conflicts and decisions

- **2.6 oven state:** renamed from `foodcraft:pizza` to `foodcraft:dish` as the spec says. Decided 2026-11-07: v2 does not need to work with v1 worlds, so ovens placed in v1 may break. Test v2 in new worlds.
- **2.5 "4 ingredients and no match":** cannot happen. The pot only accepts an ingredient if a recipe is still possible with it, so a fourth wrong ingredient is refused with "That doesn't go in the pot". Taking the last ingredient back out with an empty hand stays.
- **2.5 "Pot broken: drops ingredients":** a milk bucket already in the pot is not dropped. Its empty bucket was handed back when it went in, so dropping it would duplicate a bucket.
- **2.4 / 2.5 / v1 4.2 breaking:** drops on break only work for player breaks (`onPlayerBreak`), as in v1.
- **Oven output counts:** one raw tray can bake into several items. Raw cinnamon buns give 3 cinnamon buns, raw brownies give 4 brownies, and batter gives 3 waffles. Spec 2.7 says "3 raw buns", so the plan uses one raw tray of buns and 3 baked buns, which saves the player two extra bakes.
- **Recipes with a bucket coming back** must be shaped. v1 found that only shaped recipes take an array `result`, which is why batter is shaped.

## Doc sources used

All checked 2026-11-07.

| Topic | Source | What it settled |
|---|---|---|
| Script API 2.11.0 | `npm pack @minecraft/server@2.11.0`, `index.d.ts` | `Dimension.getBiome(location): BiomeType` (`id`, `getTags()`), `BiomeTypes.get/getAll`. `world.afterEvents.entitySpawn` (`entity`, `cause`), `world.afterEvents.entityRemove` (`removedEntityId`, `typeId`). `EntityItemComponent` (`minecraft:item`, `itemStack`). `Entity.getVelocity/clearVelocity/applyImpulse`, `Entity.isValid` (property). `Dimension.getEntities({type, location, maxDistance, closest})`. `EntityProjectileComponent.owner`. `ItemDurabilityComponent.damage/maxDurability`. `Block.isWaterlogged/setWaterlogged`. `World.get/setDynamicProperty` (string values). `world.afterEvents.playerInventoryItemChange` (`player`, `slot`, `itemStack`, `beforeItemStack`) |
| Vanilla biome ids 1.26.60 | `npm pack @minecraft/vanilla-data@1.26.60`, `MinecraftBiomeTypes` | Bedrock ids differ from the Java names in the spec: snowy beach = `cold_beach`, stony shore = `stone_beach`, mushroom fields = `mushroom_island` (+ `_shore`), snowy plains = `ice_plains`, ice spikes = `ice_plains_spikes`, windswept hills = `extreme_hills*`, old growth taiga = `mega_taiga*` / `redwood_taiga*`, dark forest = `roofed_forest*`, badlands = `mesa*`, swamp = `swampland*`. New in 1.26: `dappled_forest` (put in temperate lakes) and `sulfur_caves` (cave, vanilla fishing) |
| Fishing loot table | learn.microsoft.com `.../vanillabehaviorpack_snippets/loot_tables/gameplay/fishing` | `fishing.json` picks `fishing/junk.json` (10), `treasure.json` (5), `fish.json` (85). No biome condition. Used only for the Task 1 fallback |
| Everything from v1 | v1 plan "Doc sources used" | Items, blocks, recipes, features, loot tables, custom components |

## Global Constraints

- Everything from the v1 plan's Global Constraints still holds: namespace `foodcraft:`, versions, lang key patterns, deploy + content log + checklist at the end of every task, commit after each task, no co-author lines.
- **Never overwrite a texture that exists.** The generators write a placeholder PNG only when the file is missing, so the kids' drawings are safe. To get a fresh placeholder, delete the PNG and rerun.
- Shared hand helpers (`takeOne`, `giveOrDrop`, `heldItem`, `isCreative`) live in `scripts/hand.js`. `board.js` and `pot.js` import them from there instead of defining or exporting their own.
- Generated files (`items/*.json`, `recipes/*.json` listed in `content_v2.mjs`) are owned by the generator. Change the table and rerun; do not hand-edit them.
- New lang lines go into both `en_US.lang` and `nb_NO.lang` from the start, because the table has both names. Task 11 is only the kids' review of the Norwegian names.
- Both lang files use CRLF line endings; the generator keeps them.
- Test world: the v1 `Foodcraft Test` world for items and stations. Fishing zones, scallops and wild plants need a new non-flat world (`Foodcraft Ocean Test`).

## File structure (new and changed)

```
packs/foodcraft_bp/
  items/                    generated (Task 2 onward)
  recipes/                  generated, plus cutting_board, knife, cooking_pot via the table
  blocks/
    scallop_bed.json        Task 4
    cutting_board.json      Task 5
    cooking_pot.json        Task 7
    {corn,lettuce,rice,cinnamon}_crop.json, wild_{corn,lettuce,rice,cinnamon}.json   Task 6
    pizza_oven.json         Task 8: more values for foodcraft:pizza, more bones
  loot_tables/blocks/       scallop_bed, 4 crops x (seed, mature), 4 wild plants
  features/, feature_rules/ scallops, 4 wild plants
  scripts/
    fish_data.js            Task 2: species, sizes, water zones (no @minecraft imports)
    fishing_probe.js        Task 1 only, deleted at the end of Task 3
    fishing.js              Task 3
    board.js                Task 5
    pot.js                  Task 7
    oven.js                 Task 8: dish table instead of four fixed pizzas
    main.js                 imports and registrations
packs/foodcraft_rp/
  models/blocks/{cutting_board,cooking_pot,scallop_bed}.geo.json   generated
  models/blocks/pizza_oven.geo.json                                re-exported in Task 8
  textures/items/*.png, textures/blocks/*.png                      placeholders, then kids' art
  textures/item_texture.json, terrain_texture.json, texts/*.lang, blocks.json
  sounds/sound_definitions.json                                    Task 11 (chop, bubbling)
tools/
  png.mjs                   PNG writer for any size (new; render_placeholders.mjs stays as is)
  icons.mjs                 16x16 placeholder shapes
  content_v2.mjs            the v2 data table
  make_content.mjs          table -> items, recipes, lang, atlas, icons
  make_models.mjs           cube lists -> geo.json + box-UV texture
docs/test-checklist.md      v2 sections appended per task
```

---

### Task 0: Test v1 in game

Build order step 0. The v2 work assumes v1 works.

- [ ] **Step 1:** Run `tools/deploy.ps1` (Windows) or `tools/push.sh` (tablet), and go through every v1 line in `docs/test-checklist.md`.
- [ ] **Step 2:** Fix what fails, one commit per fix, and tick the v1 "Deploy and verify" steps in `docs/superpowers/plans/2026-11-06-pizza-night.md`.

---

### Task 1: Fishing probe (prove the risky part first)

Spec 3.1. Find out what a script can see when a fish is caught. No content yet.

**Files:**
- Create: `packs/foodcraft_bp/scripts/fishing_probe.js`
- Modify: `packs/foodcraft_bp/scripts/main.js` (one import line)

- [ ] **Step 1: The probe**

```js
// Task 1 probe: prints what the script sees when something is fished up. Deleted in Task 3.
import { world, system, EntityComponentTypes } from "@minecraft/server";

const fmt = (v) => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;

world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
  const d = entity.dimension;
  if (entity.typeId === "minecraft:fishing_hook") {
    const owner = entity.getComponent(EntityComponentTypes.Projectile)?.owner;
    world.sendMessage(`[probe] hook spawned at ${fmt(entity.location)} owner=${owner?.nameTag || owner?.typeId || "?"}`);
    return;
  }
  if (entity.typeId !== "minecraft:item") return;
  const stack = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
  if (!stack) return;
  const hooks = (r) => d.getEntities({ type: "minecraft:fishing_hook", location: entity.location, maxDistance: r }).length;
  world.sendMessage(
    `[probe] item ${stack.typeId} x${stack.amount} cause=${cause} biome=${d.getBiome(entity.location).id} ` +
      `hooks r2=${hooks(2)} r5=${hooks(5)} v=${fmt(entity.getVelocity())}`
  );
  system.run(() => {
    if (entity.isValid) world.sendMessage(`[probe]   next tick v=${fmt(entity.getVelocity())} hooks r2=${hooks(2)}`);
  });
});

world.afterEvents.entityRemove.subscribe(({ typeId }) => {
  if (typeId === "minecraft:fishing_hook") world.sendMessage("[probe] hook removed");
});
```

Add `import "./fishing_probe.js";` to `main.js` under the other imports.

- [ ] **Step 2: Deploy and fish**

In a new survival world, fish about 20 times in a river and 20 times in an ocean, and write down the chat lines. Then do the same to check for false alarms:
- break a block with an item drop next to a fishing hook in the water
- kill a cod with a sword while holding nothing else
- throw a cod from the inventory into the water

- [ ] **Step 3: Decide, and write the result into this step**

| What the probe shows | Decision for Task 3 |
|---|---|
| Fished items log `hooks r2>=1` and dropped/killed fish log `hooks r2=0` | **A.** Use `fishing.js` as written in Task 3: hook within 2 blocks at spawn, swap on the next tick |
| Fished items log `hooks r2=0` (the hook is already gone) but `next tick v` points toward the player | **B.** Replace `hookedHere` in Task 3: a player within 33 blocks has `minecraft:fishing_rod` in the main hand and the item's next-tick velocity points at that player (dot product of velocity and the direction to the player > 0.5 × speed) |
| Neither | **C.** Fallback from spec 3.1: copy the vanilla `loot_tables/gameplay/fishing/fish.json` into the behavior pack, keep cod 60 / salmon 25 / tropical 2 / pufferfish 13, add each Foodcraft fish with weight 4, skip `fishing.js`, and tell the kids that fish are not tied to biomes |

Write down here which row matched and the `HOOK_RADIUS` that separated real catches from false alarms.

- [ ] **Step 4: Commit** "Fishing probe: what a script sees when a fish is caught". The probe stays in until Task 3.

---

### Task 2: Generator, fish data and the 13 fish

Build order step 1 (part 1). After this task every fish exists as raw and cooked item, cooks in the furnace, smoker and campfire, and has a placeholder icon. It can be tested with `/give`.

**Files:**
- Create: `tools/png.mjs`, `tools/icons.mjs`, `tools/content_v2.mjs`, `tools/make_content.mjs`, `tools/check_zones.mjs`, `packs/foodcraft_bp/scripts/fish_data.js`
- Generated: items, recipes, lang lines, atlas entries, icons

- [ ] **Step 1: `packs/foodcraft_bp/scripts/fish_data.js`**

```js
// Fish species and water zones. Used by fishing.js, board.js and tools/make_content.mjs.
// No @minecraft imports here, so Node can load this file too.

// size: 1 small, 2 medium, 3 large. It sets the fillets on the cutting board and the hunger of the cooked fish.
export const FISH = {
  arctic_char: { en: "Arctic Char", nb: "Røye", size: 1, main: "#6d7a86", accent: "#e0603a" },
  trout: { en: "Trout", nb: "Ørret", size: 2, main: "#8a8f5a", accent: "#d98c8c" },
  perch: { en: "Perch", nb: "Abbor", size: 1, main: "#8fae3a", accent: "#2f4a1c" },
  pike: { en: "Pike", nb: "Gjedde", size: 2, main: "#5d7a3a", accent: "#c9d48a" },
  catfish: { en: "Catfish", nb: "Malle", size: 3, main: "#5b5148", accent: "#a89a86" },
  piranha: { en: "Piranha", nb: "Piraja", size: 1, main: "#7b8a9a", accent: "#d13b2b" },
  herring: { en: "Herring", nb: "Sild", size: 1, main: "#a9b8c8", accent: "#e8eef4" },
  mackerel: { en: "Mackerel", nb: "Makrell", size: 1, main: "#3c7a8c", accent: "#d6e2e6" },
  saithe: { en: "Saithe", nb: "Sei", size: 2, main: "#4e5a66", accent: "#9aa6b0" },
  wolffish: { en: "Atlantic Wolffish", nb: "Steinbit", size: 2, main: "#7a6a5a", accent: "#3a3029" },
  halibut: { en: "Halibut", nb: "Kveite", size: 3, main: "#6b5b45", accent: "#e8e2d4" },
  tuna: { en: "Tuna", nb: "Tunfisk", size: 3, main: "#34465e", accent: "#c0c8d4" },
  swordfish: { en: "Swordfish", nb: "Sverdfisk", size: 3, main: "#4a5f80", accent: "#b8c4d6" },
};

// Spec 2.1 water zones, with Bedrock biome ids (without the "minecraft:" prefix).
export const ZONES = [
  { name: "arctic sea", fish: ["halibut", "wolffish"], biomes: ["frozen_ocean", "deep_frozen_ocean", "legacy_frozen_ocean", "cold_beach"] },
  { name: "cold sea", fish: ["saithe", "halibut", "herring", "wolffish"], biomes: ["cold_ocean", "deep_cold_ocean", "stone_beach"] },
  { name: "temperate sea", fish: ["herring", "mackerel", "saithe"], biomes: ["ocean", "deep_ocean", "beach", "mushroom_island", "mushroom_island_shore"] },
  { name: "warm sea", fish: ["mackerel", "tuna", "swordfish"], biomes: ["lukewarm_ocean", "deep_lukewarm_ocean"] },
  { name: "tropical sea", fish: ["tuna", "swordfish"], biomes: ["warm_ocean", "deep_warm_ocean"] },
  { name: "frozen river", fish: ["arctic_char", "trout"], biomes: ["frozen_river"] },
  { name: "river", fish: ["trout", "perch", "pike"], biomes: ["river"] },
  {
    name: "cold lakes",
    fish: ["arctic_char", "trout"],
    biomes: [
      "taiga", "taiga_hills", "taiga_mutated", "mega_taiga", "mega_taiga_hills", "redwood_taiga_mutated", "redwood_taiga_hills_mutated",
      "cold_taiga", "cold_taiga_hills", "cold_taiga_mutated", "ice_plains", "ice_plains_spikes", "ice_mountains", "grove", "snowy_slopes",
      "meadow", "extreme_hills", "extreme_hills_edge", "extreme_hills_mutated", "extreme_hills_plus_trees", "extreme_hills_plus_trees_mutated",
      "jagged_peaks", "frozen_peaks", "stony_peaks",
    ],
  },
  {
    name: "temperate lakes",
    fish: ["pike", "perch"],
    biomes: [
      "plains", "sunflower_plains", "forest", "forest_hills", "flower_forest", "birch_forest", "birch_forest_hills", "birch_forest_mutated",
      "birch_forest_hills_mutated", "roofed_forest", "roofed_forest_mutated", "pale_garden", "cherry_grove", "dappled_forest",
    ],
  },
  { name: "swamps", fish: ["pike", "catfish"], biomes: ["swampland", "swampland_mutated", "mangrove_swamp"] },
  {
    name: "dry warm lakes",
    fish: ["catfish"],
    biomes: [
      "savanna", "savanna_mutated", "savanna_plateau", "savanna_plateau_mutated", "desert", "desert_hills", "desert_mutated",
      "mesa", "mesa_bryce", "mesa_plateau", "mesa_plateau_mutated", "mesa_plateau_stone", "mesa_plateau_stone_mutated",
    ],
  },
  { name: "tropical lakes", fish: ["piranha", "catfish"], biomes: ["jungle", "jungle_hills", "jungle_mutated", "jungle_edge", "jungle_edge_mutated", "bamboo_jungle", "bamboo_jungle_hills"] },
];

// What the cutting board makes from a fish (spec 2.1, 2.4).
export function filletsOf(fishId) {
  return { item: fishId === "tuna" ? "foodcraft:tuna_fillet" : "foodcraft:fish_fillet", count: FISH[fishId].size };
}
```

Check: no biome id appears in two zones, and every id is in `MinecraftBiomeTypes` from `@minecraft/vanilla-data` 1.26.60. Step 6 runs this check.

- [ ] **Step 2: `tools/png.mjs`**

Use the same PNG code as `render_placeholders.mjs`, but for any size.

```js
// Minimal RGBA PNG writer. pixels: rows of [r, g, b, a].
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync, crc32 } from "node:zlib";

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
```

- [ ] **Step 3: `tools/icons.mjs`**

```js
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
  knife(x, y) {
    if (x + y < 14 || x + y > 15 || x < 2 || x > 13) return null;
    return x <= 9 ? "blade" : "main";
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
  const isCrop = shape.startsWith("crop");
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
```

- [ ] **Step 4: `tools/content_v2.mjs`**

The whole v2 table. `step` is the task that turns an entry on. Ids without `:` mean `foodcraft:`.

```js
// Foodcraft v2 content table. node tools/make_content.mjs <task> writes every entry with step <= task.
import { FISH } from "../packs/foodcraft_bp/scripts/fish_data.js";
import { browned } from "./icons.mjs";

const COOKED_FOOD = { 1: [5, 0.6], 2: [6, 0.8], 3: [7, 0.8] };

// food: [nutrition, saturation_modifier]. returns: item handed back after eating (stack 1 for bowls).
export const ITEMS = [
  ...Object.entries(FISH).flatMap(([id, f]) => [
    { step: 2, id, en: f.en, nb: f.nb, food: [2, 0.1], icon: { shape: "fish", main: f.main, accent: f.accent, size: f.size } },
    { step: 2, id: `cooked_${id}`, en: `Cooked ${f.en}`, nb: `Stekt ${f.nb.toLowerCase()}`, food: COOKED_FOOD[f.size],
      icon: { shape: "fish", main: browned(f.main), accent: browned(f.accent), size: f.size } },
  ]),
  { step: 4, id: "scallop", en: "Scallop", nb: "Kamskjell", food: [1, 0.1], icon: { shape: "shell", main: "#e8b9a0", accent: "#c98a6e" } },
  { step: 4, id: "grilled_scallop", en: "Grilled Scallop", nb: "Grillet kamskjell", food: [4, 0.6], icon: { shape: "shell", main: "#e0a060", accent: "#a86a3a" } },

  { step: 5, id: "knife", en: "Knife", nb: "Kniv", durability: 128, icon: { shape: "knife", main: "#6b4a2a" } },
  { step: 5, id: "fish_fillet", en: "Fish Fillet", nb: "Fiskefilet", food: [1, 0.1], icon: { shape: "fillet", main: "#f0d8c8", accent: "#e0b8a0" } },
  { step: 5, id: "cooked_fish_fillet", en: "Cooked Fish Fillet", nb: "Stekt fiskefilet", food: [3, 0.6], icon: { shape: "fillet", main: "#d8a060", accent: "#b07838" } },
  { step: 5, id: "tuna_fillet", en: "Tuna Fillet", nb: "Tunfiskfilet", food: [2, 0.3], icon: { shape: "fillet", main: "#c03848", accent: "#e8a0a8" } },
  { step: 5, id: "minced_meat", en: "Minced Meat", nb: "Kjøttdeig", food: [1, 0.1], icon: { shape: "pile", main: "#c23b3b", accent: "#e88080" } },
  { step: 5, id: "cooked_minced_meat", en: "Cooked Minced Meat", nb: "Stekt kjøttdeig", food: [4, 0.6], icon: { shape: "pile", main: "#7a4a2a", accent: "#a06a40" } },
  { step: 5, id: "raw_fries", en: "Raw Fries", nb: "Rå pommes frites", food: [1, 0.1], icon: { shape: "stick", main: "#f0e0a0", accent: "#e0c870" } },
  { step: 5, id: "fries", en: "Fries", nb: "Pommes frites", food: [4, 0.4], icon: { shape: "stick", main: "#e8b030", accent: "#c08018" } },
  { step: 5, id: "raw_pasta", en: "Raw Pasta", nb: "Rå pasta", icon: { shape: "stick", main: "#f0dca0", accent: "#e0c880" } },

  { step: 6, id: "corn", en: "Corn", nb: "Mais", food: [2, 0.3], icon: { shape: "cob", main: "#f0c830", accent: "#d8a818" } },
  { step: 6, id: "corn_kernels", en: "Corn Kernels", nb: "Maiskorn", places: "corn_crop", icon: { shape: "seeds", main: "#f0c830" } },
  { step: 6, id: "lettuce", en: "Lettuce", nb: "Salat", food: [2, 0.3], icon: { shape: "head", main: "#78c048", accent: "#b8e888" } },
  { step: 6, id: "lettuce_seeds", en: "Lettuce Seeds", nb: "Salatfrø", places: "lettuce_crop", icon: { shape: "seeds", main: "#a8b878" } },
  { step: 6, id: "rice", en: "Rice", nb: "Ris", places: "rice_crop", icon: { shape: "pile", main: "#f4f0e4", accent: "#d8d0b8" } },
  { step: 6, id: "cinnamon_stick", en: "Cinnamon Stick", nb: "Kanelstang", icon: { shape: "stick", main: "#9a5a2a", accent: "#6a3a18" } },
  { step: 6, id: "cinnamon_cutting", en: "Cinnamon Cutting", nb: "Kanelstikling", places: "cinnamon_crop", icon: { shape: "stick", main: "#6a8a3a", accent: "#9a5a2a" } },

  { step: 7, id: "fish_soup", en: "Fish Soup", nb: "Fiskesuppe", food: [8, 0.8], returns: "minecraft:bowl", icon: { shape: "bowl", main: "#e8d8a8", accent: "#f0a060" } },
  { step: 7, id: "spaghetti_bolognese", en: "Spaghetti Bolognese", nb: "Spaghetti bolognese", food: [10, 0.9], returns: "minecraft:bowl", icon: { shape: "bowl", main: "#f0dca0", accent: "#b8402a" } },
  { step: 7, id: "mac_and_cheese", en: "Mac and Cheese", nb: "Mac and cheese", food: [9, 0.8], returns: "minecraft:bowl", icon: { shape: "bowl", main: "#f0c040", accent: "#f8e080" } },
  { step: 7, id: "rice_porridge", en: "Rice Porridge", nb: "Risgrøt", food: [7, 0.7], returns: "minecraft:bowl", icon: { shape: "bowl", main: "#f4ecd8", accent: "#c08040" } },

  { step: 8, id: "raw_pizza_tuna", en: "Raw Tuna Pizza", nb: "Rå tunfiskpizza", food: [3, 0.3], alwaysEat: true, stack: 16, icon: { shape: "disc", main: "#f0dcb0", accent: "#c03848" } },
  { step: 8, id: "pizza_tuna", en: "Tuna Pizza", nb: "Tunfiskpizza", food: [12, 0.8], stack: 16, icon: { shape: "disc", main: "#c88a40", accent: "#e0a0a8" } },

  { step: 9, id: "raw_fish_cakes", en: "Raw Fish Cakes", nb: "Rå fiskekaker", food: [1, 0.1], icon: { shape: "disc", main: "#ece0c8", accent: "#d0c0a0" } },
  { step: 9, id: "fish_cakes", en: "Fish Cakes", nb: "Fiskekaker", food: [6, 0.8], icon: { shape: "disc", main: "#c8904a", accent: "#a87030" } },
  { step: 9, id: "fish_and_chips", en: "Fish and Chips", nb: "Fish and chips", food: [10, 0.9], icon: { shape: "tray", main: "#e8b030", accent: "#d8a060" } },
  { step: 9, id: "sushi", en: "Sushi", nb: "Sushi", food: [4, 0.6], icon: { shape: "disc", main: "#f4f0e4", accent: "#c03848" } },

  { step: 10, id: "raw_lasagna", en: "Raw Lasagna", nb: "Rå lasagne", icon: { shape: "tray", main: "#e8c890", accent: "#c03030" } },
  { step: 10, id: "lasagna", en: "Lasagna", nb: "Lasagne", food: [12, 0.8], stack: 16, icon: { shape: "tray", main: "#d89040", accent: "#a02818" } },
  { step: 10, id: "corn_flour", en: "Corn Flour", nb: "Maismel", icon: { shape: "pile", main: "#f0d878", accent: "#d8b848" } },
  { step: 10, id: "tortilla", en: "Tortilla", nb: "Tortilla", food: [3, 0.4], icon: { shape: "disc", main: "#ecd8a0", accent: "#c8a868" } },
  { step: 10, id: "taco", en: "Taco", nb: "Taco", food: [9, 0.8], icon: { shape: "taco", main: "#e8c070", accent: "#78c048" } },

  { step: 11, id: "raw_cinnamon_buns", en: "Raw Cinnamon Buns", nb: "Rå kanelsnurrer", icon: { shape: "tray", main: "#f0e0c0", accent: "#9a5a2a" } },
  { step: 11, id: "cinnamon_bun", en: "Cinnamon Bun", nb: "Kanelsnurr", food: [4, 0.5], icon: { shape: "bun", main: "#d8a050", accent: "#8a4a20" } },
  { step: 11, id: "raw_brownies", en: "Raw Brownies", nb: "Rå brownies", icon: { shape: "tray", main: "#6a3a20", accent: "#8a5a38" } },
  { step: 11, id: "brownie", en: "Brownie", nb: "Brownie", food: [4, 0.5], icon: { shape: "bar", main: "#4a2810", accent: "#6a4020" } },
  { step: 11, id: "batter", en: "Batter", nb: "Røre", icon: { shape: "bowl", main: "#f4e4b0", accent: "#e8d090" } },
  { step: 11, id: "pancakes", en: "Pancakes", nb: "Pannekaker", food: [5, 0.6], icon: { shape: "stack", main: "#e0b060", accent: "#c03048" } },
  { step: 11, id: "waffle", en: "Waffle", nb: "Vaffel", food: [5, 0.6], icon: { shape: "waffle", main: "#e0a850", accent: "#b88030" } },
  { step: 11, id: "jam", en: "Jam", nb: "Syltetøy", food: [4, 0.3], returns: "minecraft:glass_bottle", icon: { shape: "bottle", main: "#c02840" } },
];

// Names for hand-written blocks (lang only).
export const BLOCK_NAMES = [
  { step: 4, id: "scallop_bed", en: "Scallop Bed", nb: "Kamskjellbanke" },
  { step: 5, id: "cutting_board", en: "Cutting Board", nb: "Skjærebrett" },
  ...[["corn", "Corn", "Mais"], ["lettuce", "Lettuce", "Salat"], ["rice", "Rice", "Ris"], ["cinnamon", "Cinnamon", "Kanel"]].flatMap(([id, en, nb]) => [
    { step: 6, id: `${id}_crop`, en, nb },
    { step: 6, id: `wild_${id}`, en: `Wild ${en}`, nb: `Vill ${nb.toLowerCase()}` },
  ]),
  { step: 7, id: "cooking_pot", en: "Cooking Pot", nb: "Kokegryte" },
];

// Crop and wild plant textures (cross geometry). accent = the produce colour shown at stage 3.
const CROPS = { corn: ["#6a9a38", "#f0c830"], lettuce: ["#78b848", "#b8e888"], rice: ["#8aa858", "#f4f0e4"], cinnamon: ["#5a7a30", "#9a5a2a"] };
export const BLOCK_TEXTURES = Object.entries(CROPS).flatMap(([id, [main, accent]]) => [
  ...[0, 1, 2, 3].map((n) => ({ step: 6, name: `foodcraft_${id}_crop_${n}`, icon: { shape: `crop${n}`, main, accent } })),
  { step: 6, name: `foodcraft_wild_${id}`, icon: { shape: "crop3", main, accent } },
]);

const FOOD_COOKING = ["furnace", "smoker", "campfire", "soul_campfire"];

export const RECIPES = [
  ...Object.keys(FISH).map((id) => ({ step: 2, type: "furnace", id: `cooked_${id}`, input: id, output: `cooked_${id}`, tags: FOOD_COOKING })),
  { step: 4, type: "furnace", id: "grilled_scallop", input: "scallop", output: "grilled_scallop", tags: FOOD_COOKING },

  { step: 5, type: "shaped", id: "knife", pattern: ["I", "S"], key: { I: "minecraft:iron_ingot", S: "minecraft:stick" }, result: "knife" },
  { step: 5, type: "shaped", id: "cutting_board", pattern: ["SSS"], key: { S: { tag: "minecraft:wooden_slabs" } }, result: "cutting_board" },
  { step: 5, type: "furnace", id: "cooked_fish_fillet", input: "fish_fillet", output: "cooked_fish_fillet", tags: FOOD_COOKING },
  { step: 5, type: "furnace", id: "cooked_minced_meat", input: "minced_meat", output: "cooked_minced_meat", tags: FOOD_COOKING },
  { step: 5, type: "furnace", id: "fries", input: "raw_fries", output: "fries", tags: FOOD_COOKING },

  { step: 7, type: "shaped", id: "cooking_pot", pattern: ["I I", "IBI", "III"], key: { I: "minecraft:iron_ingot", B: "minecraft:bucket" }, result: "cooking_pot" },

  { step: 8, type: "shapeless", id: "raw_pizza_tuna", ingredients: ["pizza_dough", "tomato_sauce", "mozzarella", "tuna_fillet"], result: "raw_pizza_tuna" },

  { step: 9, type: "shapeless", id: "raw_fish_cakes", ingredients: ["fish_fillet", "minecraft:egg", "flour"], result: ["raw_fish_cakes", 2] },
  { step: 9, type: "furnace", id: "fish_cakes", input: "raw_fish_cakes", output: "fish_cakes", tags: FOOD_COOKING },
  { step: 9, type: "shapeless", id: "fish_and_chips", ingredients: ["cooked_fish_fillet", "fries", "minecraft:paper"], result: "fish_and_chips" },
  { step: 9, type: "shapeless", id: "sushi", ingredients: ["tuna_fillet", "rice", "minecraft:dried_kelp"], result: ["sushi", 3] },

  { step: 10, type: "shapeless", id: "raw_lasagna", ingredients: ["raw_pasta", "minced_meat", "tomato_sauce", "mozzarella"], result: "raw_lasagna" },
  { step: 10, type: "shapeless", id: "corn_flour", ingredients: ["corn"], result: "corn_flour" },
  { step: 10, type: "furnace", id: "tortilla", input: "corn_flour", output: "tortilla", tags: ["furnace", "smoker"] },
  { step: 10, type: "shapeless", id: "taco", ingredients: ["tortilla", "cooked_minced_meat", "lettuce", "tomato", "mozzarella"], result: "taco" },

  { step: 11, type: "shapeless", id: "raw_cinnamon_buns", ingredients: ["pizza_dough", "minecraft:sugar", "cinnamon_stick"], result: "raw_cinnamon_buns" },
  { step: 11, type: "shapeless", id: "raw_brownies", ingredients: ["flour", "minecraft:cocoa_beans", "minecraft:egg", "minecraft:sugar"], result: "raw_brownies" },
  { step: 11, type: "shaped", id: "batter", pattern: ["FES", " M "], key: { F: "flour", E: "minecraft:egg", S: "minecraft:sugar", M: "minecraft:milk_bucket" },
    result: "batter", extra: [{ item: "minecraft:bucket", count: 1, data: 0 }] },
  { step: 11, type: "furnace", id: "pancakes", input: "batter", output: "pancakes", tags: ["furnace", "smoker"] },
  { step: 11, type: "shapeless", id: "jam", ingredients: ["minecraft:sweet_berries", "minecraft:sweet_berries", "minecraft:sweet_berries", "minecraft:sugar", "minecraft:glass_bottle"], result: "jam" },
];
```

- [ ] **Step 5: `tools/make_content.mjs`**

```js
#!/usr/bin/env node
// Writes v2 items, recipes, lang lines, atlas entries and missing placeholder textures from tools/content_v2.mjs.
// Usage: node tools/make_content.mjs <task>   (everything with step <= task)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng } from "./png.mjs";
import { drawIcon } from "./icons.mjs";
import { ITEMS, BLOCK_NAMES, BLOCK_TEXTURES, RECIPES } from "./content_v2.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BP = path.join(ROOT, "packs/foodcraft_bp");
const RP = path.join(ROOT, "packs/foodcraft_rp");
const task = Number(process.argv[2]);
if (!task) {
  console.error("usage: node tools/make_content.mjs <task>");
  process.exit(1);
}
const upTo = (list) => list.filter((x) => x.step <= task);
const full = (id) => (id.includes(":") ? id : `foodcraft:${id}`);
const writeJson = (file, obj) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
};

function itemJson(it) {
  const c = {
    "minecraft:icon": { textures: { default: `foodcraft_${it.id}` } },
    "minecraft:display_name": { value: `item.foodcraft.${it.id}.name` },
  };
  if (it.stack) c["minecraft:max_stack_size"] = it.stack;
  if (it.food) {
    const [nutrition, saturation_modifier] = it.food;
    const food = { nutrition, saturation_modifier };
    if (it.alwaysEat) food.can_always_eat = true;
    if (it.returns) {
      food.using_converts_to = it.returns;
      c["minecraft:max_stack_size"] = it.returns === "minecraft:bowl" ? 1 : 16;
    }
    c["minecraft:food"] = food;
    c["minecraft:use_animation"] = { value: "eat" };
    c["minecraft:use_modifiers"] = { start_using: "always", use_duration: 1.6, movement_modifier: 0.35 };
    c["minecraft:tags"] = { tags: ["minecraft:is_food"] };
  }
  if (it.places) c["minecraft:block_placer"] = { block: full(it.places), use_on: ["minecraft:farmland"] };
  if (it.durability) {
    c["minecraft:durability"] = { max_durability: it.durability };
    c["minecraft:max_stack_size"] = 1;
    c["minecraft:hand_equipped"] = true;
  }
  const category = it.durability ? "equipment" : "items";
  return { format_version: "1.26.50", "minecraft:item": { description: { identifier: full(it.id), menu_category: { category } }, components: c } };
}

const keyItem = (v) => (typeof v === "string" ? { item: full(v) } : v);
const resultOf = (r) => {
  const [id, count] = Array.isArray(r.result) ? r.result : [r.result, 1];
  const main = count > 1 ? { item: full(id), count } : { item: full(id) };
  return r.extra ? [main, ...r.extra] : main;
};

function recipeJson(r) {
  const description = { identifier: full(r.id) };
  if (r.type === "furnace") {
    return { format_version: "1.26.50", "minecraft:recipe_furnace": { description, tags: r.tags, input: { item: full(r.input) }, output: full(r.output) } };
  }
  if (r.type === "shaped") {
    const key = Object.fromEntries(Object.entries(r.key).map(([k, v]) => [k, keyItem(v)]));
    const first = Object.values(key)[0];
    return { format_version: "1.26.50", "minecraft:recipe_shaped": { description, tags: ["crafting_table"], pattern: r.pattern, key, unlock: [first], result: resultOf(r) } };
  }
  const counts = new Map();
  for (const id of r.ingredients) counts.set(full(id), (counts.get(full(id)) ?? 0) + 1);
  const ingredients = [...counts].map(([item, count]) => (count > 1 ? { item, count } : { item }));
  return { format_version: "1.26.50", "minecraft:recipe_shapeless": { description, tags: ["crafting_table"], ingredients, unlock: [{ item: ingredients[0].item }], result: resultOf(r) } };
}

function setLang(file, entries) {
  const raw = fs.readFileSync(file, "utf8");
  const nl = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  for (const [key, value] of entries) {
    const at = lines.findIndex((l) => l.startsWith(key + "="));
    if (at >= 0) lines[at] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(file, lines.join(nl) + nl);
}

function addAtlas(file, names, folder) {
  const atlas = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const n of names) atlas.texture_data[n] ??= { textures: `textures/${folder}/${n}` };
  writeJson(file, atlas);
}

function placeholder(file, icon) {
  if (fs.existsSync(file)) return false; // never overwrite the kids' art
  writePng(file, drawIcon(icon));
  return true;
}

const items = upTo(ITEMS), blocks = upTo(BLOCK_NAMES), blockTex = upTo(BLOCK_TEXTURES), recipes = upTo(RECIPES);
for (const it of items) writeJson(path.join(BP, "items", `${it.id}.json`), itemJson(it));
for (const r of recipes) writeJson(path.join(BP, "recipes", `${r.id}.json`), recipeJson(r));
for (const [lang, field] of [["en_US", "en"], ["nb_NO", "nb"]]) {
  setLang(path.join(RP, "texts", `${lang}.lang`), [
    ...items.map((it) => [`item.foodcraft.${it.id}.name`, it[field]]),
    ...blocks.map((b) => [`tile.foodcraft:${b.id}.name`, b[field]]),
  ]);
}
addAtlas(path.join(RP, "textures/item_texture.json"), items.map((it) => `foodcraft_${it.id}`), "items");
addAtlas(path.join(RP, "textures/terrain_texture.json"), blockTex.map((t) => t.name), "blocks");
let fresh = 0;
for (const it of items) fresh += placeholder(path.join(RP, "textures/items", `foodcraft_${it.id}.png`), it.icon);
for (const t of blockTex) fresh += placeholder(path.join(RP, "textures/blocks", `${t.name}.png`), t.icon);
console.log(`task ${task}: ${items.length} items, ${recipes.length} recipes, ${blocks.length} block names, ${fresh} new placeholder textures`);
```

- [ ] **Step 6: Check the fish data and run the generator**

Create `tools/check_zones.mjs`:

```js
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
```

Run it, then the generator:

```
npm pack @minecraft/vanilla-data@1.26.60     (in the scratchpad; unpack the .tgz)
node tools/check_zones.mjs file:///<scratchpad>/package/lib/index.js
node tools/make_content.mjs 2
```

Expected output (checked 2026-11-07 against 1.26.60):
- the check prints `biomes 79`, with no `unknown` and no `twice` lines
- "not in a zone" lists only cave, Nether and End biomes: `basalt_deltas`, `crimson_forest`, `deep_dark`, `dripstone_caves`, `hell`, `ice_caves`, `lush_caves`, `soulsand_valley`, `sulfur_caves`, `the_end`, `warped_forest`
- the generator prints `task 2: 26 items, 13 recipes, 0 block names, 26 new placeholder textures`

Rerun the check after every Minecraft update. A new water biome shows up under "not in a zone".

Run the generator a second time. It must print `0 new placeholder textures`, and `git status` must show no change in the second run.

- [ ] **Step 7: Checklist lines**

Append to `docs/test-checklist.md`:

```
## v2: Fish (Task 2)
- [ ] `/give @s foodcraft:trout` (and the other 12): name, icon, eats
- [ ] Every raw fish cooks in furnace, smoker and campfire into its cooked fish
- [ ] Norwegian names show with the game language set to Norsk
```

- [ ] **Step 8: Deploy and verify in game:** content log clean, checklist lines above.
- [ ] **Step 9: Commit** "v2: content generator, fish data and 13 fish".

---

### Task 3: Fish by water zone

Build order step 1 (part 2). Uses the Task 1 decision. Rows A and B are described here; for row C, see Task 1.

**Files:**
- Create: `packs/foodcraft_bp/scripts/fishing.js`
- Delete: `packs/foodcraft_bp/scripts/fishing_probe.js`
- Modify: `packs/foodcraft_bp/scripts/main.js` (replace the probe import with `import "./fishing.js";`)

- [ ] **Step 1: `fishing.js`**

```js
// Spec 2.1: a vanilla fish caught in a water zone becomes one of that zone's Foodcraft fish half of the time.
import { world, system, ItemStack, EntityComponentTypes } from "@minecraft/server";
import { ZONES } from "./fish_data.js";

const VANILLA_FISH = new Set(["minecraft:cod", "minecraft:salmon", "minecraft:tropical_fish", "minecraft:pufferfish"]);
const SWAP_CHANCE = 0.5;
const HOOK_RADIUS = 2; // from the Task 1 probe

const fishByBiome = new Map(ZONES.flatMap((zone) => zone.biomes.map((b) => [`minecraft:${b}`, zone.fish])));

// Decision A from Task 1. For decision B, replace this function (see Task 1 step 3).
function caughtWithRod(entity) {
  return entity.dimension.getEntities({ type: "minecraft:fishing_hook", location: entity.location, maxDistance: HOOK_RADIUS }).length > 0;
}

function swap(entity, typeId, amount) {
  if (!entity.isValid) return; // already picked up
  const { dimension, location } = entity;
  const velocity = entity.getVelocity();
  entity.remove();
  const caught = dimension.spawnItem(new ItemStack(typeId, amount), location);
  caught.clearVelocity();
  caught.applyImpulse(velocity); // keeps flying toward the player like the original catch
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (entity.typeId !== "minecraft:item" || entity.dimension.id !== "minecraft:overworld") return;
  const stack = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
  if (!stack || !VANILLA_FISH.has(stack.typeId)) return;
  if (!caughtWithRod(entity)) return;
  const fish = fishByBiome.get(entity.dimension.getBiome(entity.location).id);
  if (!fish || Math.random() >= SWAP_CHANCE) return;
  const pick = fish[Math.floor(Math.random() * fish.length)];
  system.run(() => swap(entity, `foodcraft:${pick}`, stack.amount)); // next tick: the catch has its velocity by then
});
```

- [ ] **Step 2: Checklist lines**

```
## v2: Fishing (Task 3) — new world "Foodcraft Ocean Test"
- [ ] River: trout, perch and pike come up among vanilla fish (about half the fish catches)
- [ ] Frozen river: arctic char, trout
- [ ] Ocean / deep ocean: herring, mackerel, saithe
- [ ] Cold ocean: saithe, halibut, herring, wolffish
- [ ] Frozen ocean: halibut, wolffish
- [ ] Lukewarm ocean: mackerel, tuna, swordfish; warm ocean: tuna, swordfish
- [ ] Lake in a taiga or snowy biome: arctic char, trout
- [ ] Lake in plains or forest: pike, perch
- [ ] Swamp: pike, catfish; lake in savanna or desert: catfish; lake in jungle: piranha, catfish
- [ ] Treasure and junk catches are never swapped
- [ ] A swapped fish flies to the player like a normal catch
- [ ] Killing a cod with a sword drops a normal cod
- [ ] Lush caves water: vanilla fish only
```

Use `/locate biome <id>` and `/tp` to reach each biome.

- [ ] **Step 3: Deploy and verify in game**
- [ ] **Step 4: Commit** "v2: fish are caught by water zone".

---

### Task 4: Scallops on the sea floor

Build order step 1 (part 3).

**Files:**
- Create:
  - `tools/make_models.mjs`
  - `packs/foodcraft_bp/blocks/scallop_bed.json`
  - `packs/foodcraft_bp/loot_tables/blocks/scallop_bed.json`
  - `packs/foodcraft_bp/features/scallop_bed_block.json`
  - `packs/foodcraft_bp/features/scallop_bed_patch.json`
  - `packs/foodcraft_bp/feature_rules/scallop_bed_rule.json`
- Generated:
  - `packs/foodcraft_rp/models/blocks/scallop_bed.geo.json`
  - `packs/foodcraft_rp/textures/blocks/foodcraft_scallop_bed.png`
  - item and recipe files from `node tools/make_content.mjs 4`
- Modify: `packs/foodcraft_rp/blocks.json`, `packs/foodcraft_rp/textures/terrain_texture.json`

- [ ] **Step 1: `tools/make_models.mjs`**

Writes a geo.json with box UV and paints the matching texture: each cube's net gets one colour, with a lighter top and a darker outline. The kids can open the geo.json in Blockbench later, repaint, and save it as `art/models/<name>.bbmodel`.

```js
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
```

Run `node tools/make_models.mjs scallop_bed`, then `node tools/make_content.mjs 4`.

- [ ] **Step 2: `blocks/scallop_bed.json`**

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": { "identifier": "foodcraft:scallop_bed", "menu_category": { "category": "nature" } },
    "components": {
      "minecraft:geometry": "geometry.foodcraft_scallop_bed",
      "minecraft:material_instances": { "*": { "texture": "foodcraft_scallop_bed", "render_method": "alpha_test" } },
      "minecraft:liquid_detection": {
        "detection_rules": [{ "liquid_type": "water", "can_contain_liquid": true, "on_liquid_touches": "no_reaction" }]
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-6, 0, -6], "size": [12, 2, 12] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0.3 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [{ "allowed_faces": ["up"], "block_filter": ["minecraft:sand", "minecraft:gravel", "minecraft:clay", "minecraft:dirt"] }]
      },
      "minecraft:loot": "loot_tables/blocks/scallop_bed.json"
    }
  }
}
```

Add `"foodcraft:scallop_bed": { "sound": "gravel" }` to `blocks.json` and `"foodcraft_scallop_bed": { "textures": "textures/blocks/foodcraft_scallop_bed" }` to `terrain_texture.json`.

- [ ] **Step 3: Loot, features, rule**

`loot_tables/blocks/scallop_bed.json`:

```json
{ "pools": [{ "rolls": 1, "entries": [{ "type": "item", "name": "foodcraft:scallop", "weight": 1, "functions": [{ "function": "set_count", "count": { "min": 1, "max": 2 } }] }] }] }
```

`features/scallop_bed_block.json`:

```json
{
  "format_version": "1.21.10",
  "minecraft:single_block_feature": {
    "description": { "identifier": "foodcraft:scallop_bed_block" },
    "places_block": "foodcraft:scallop_bed",
    "enforce_placement_rules": true,
    "enforce_survivability_rules": true,
    "may_replace": ["minecraft:water"],
    "may_attach_to": { "bottom": ["minecraft:sand", "minecraft:gravel", "minecraft:clay", "minecraft:dirt"] }
  }
}
```

`features/scallop_bed_patch.json`: like `wild_garlic_patch.json`, but with `"places_feature": "foodcraft:scallop_bed_block"`, `"iterations": 3`, and **no** `project_input_to_floor`. The rule already gives the sea floor height.

`feature_rules/scallop_bed_rule.json`:

```json
{
  "format_version": "1.13.0",
  "minecraft:feature_rules": {
    "description": { "identifier": "foodcraft:scallop_bed_rule", "places_feature": "foodcraft:scallop_bed_patch" },
    "conditions": {
      "placement_pass": "surface_pass",
      "minecraft:biome_filter": [
        { "test": "has_biome_tag", "operator": "==", "value": "ocean" },
        { "test": "has_biome_tag", "operator": "!=", "value": "frozen" },
        { "test": "has_biome_tag", "operator": "!=", "value": "warm" }
      ]
    },
    "distribution": {
      "iterations": 1,
      "scatter_chance": 30,
      "coordinate_eval_order": "zxy",
      "x": 0,
      "y": "query.above_top_solid(variable.worldx, variable.worldz)",
      "z": 0
    }
  }
}
```

The filter keeps normal, cold and lukewarm oceans (spec 2.1). Before deploying, check the tags `ocean`, `frozen`, `warm` and `lukewarm` in bedrock-samples `behavior_pack/biomes/{warm_ocean,lukewarm_ocean,cold_ocean,frozen_ocean}.biome.json`. Lukewarm must not carry `warm`; if it does, change the last test to `"value": "warm"` together with a check that the biome has no `lukewarm` tag.

- [ ] **Step 4: Waterlogging check.** In the new world, dive to a scallop bed.
  - **Water around the shells:** done.
  - **An air pocket:** add a custom component `foodcraft:scallop_bed` with `onRandomTick({ block }) { if (!block.isWaterlogged) block.setWaterlogged(true); }`, register it in `main.js`, and add `"foodcraft:scallop_bed": {}` to the block.
  - **The feature does not place at all in water:** try `"may_replace": ["minecraft:water", "minecraft:flowing_water"]`.
- [ ] **Step 5: Checklist lines**

```
## v2: Scallops (Task 4) — new world
- [ ] Scallop beds lie on the sea floor in normal, cold and lukewarm oceans, never in frozen or warm ones
- [ ] The bed sits in water (no air pocket)
- [ ] Breaking a bed drops 1–2 scallops
- [ ] Scallop cooks into grilled scallop in furnace, smoker and campfire
```

- [ ] **Step 6: Deploy and verify in game**
- [ ] **Step 7: Commit** "v2: scallop beds on the sea floor".

---

### Task 5: Cutting board and knife

Build order step 2.

**Files:**
- Create: `packs/foodcraft_bp/blocks/cutting_board.json`, `packs/foodcraft_bp/scripts/board.js`
- Generated: `node tools/make_models.mjs cutting_board`, `node tools/make_content.mjs 5`
- Modify:
  - `packs/foodcraft_bp/scripts/main.js`
  - `packs/foodcraft_rp/blocks.json` (`"foodcraft:cutting_board": { "sound": "wood" }`)
  - `terrain_texture.json` (`foodcraft_cutting_board`)

- [ ] **Step 1: `blocks/cutting_board.json`**

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:cutting_board",
      "menu_category": { "category": "items" },
      "states": {
        "foodcraft:item": ["none", "small_fish", "medium_fish", "large_fish", "tuna", "beef", "potato", "dough"],
        "foodcraft:chops": [0, 1, 2]
      }
    },
    "components": {
      "minecraft:geometry": {
        "identifier": "geometry.foodcraft_cutting_board",
        "bone_visibility": {
          "small_fish": "q.block_state('foodcraft:item') == 'small_fish'",
          "medium_fish": "q.block_state('foodcraft:item') == 'medium_fish'",
          "large_fish": "q.block_state('foodcraft:item') == 'large_fish'",
          "tuna": "q.block_state('foodcraft:item') == 'tuna'",
          "beef": "q.block_state('foodcraft:item') == 'beef'",
          "potato": "q.block_state('foodcraft:item') == 'potato'",
          "dough": "q.block_state('foodcraft:item') == 'dough'"
        }
      },
      "minecraft:material_instances": { "*": { "texture": "foodcraft_cutting_board", "render_method": "alpha_test" } },
      "minecraft:collision_box": { "origin": [-6, 0, -4], "size": [12, 2, 8] },
      "minecraft:selection_box": { "origin": [-6, 0, -4], "size": [12, 3, 8] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0.6 },
      "minecraft:light_dampening": 0,
      "foodcraft:cutting_board": {}
    }
  }
}
```

- [ ] **Step 2: `scripts/board.js`**

The board's state shows what lies on it. The exact item id (which fish) is kept in a world dynamic property keyed by position, so the right fish comes back or drops.

```js
// Spec 2.4: put an ingredient on the board, chop three times with the knife, get the result.
import { world, ItemStack, GameMode, EquipmentSlot, EntityComponentTypes, ItemComponentTypes } from "@minecraft/server";
import { FISH, filletsOf } from "./fish_data.js";

const KNIFE = "foodcraft:knife";
const CHOPS_NEEDED = 3;

// held item id -> { look: value of foodcraft:item, out: [[item, count], ...] }
const CHOPPABLE = {
  "minecraft:beef": { look: "beef", out: [["foodcraft:minced_meat", 2]] },
  "minecraft:potato": { look: "potato", out: [["foodcraft:raw_fries", 1]] },
  "foodcraft:pizza_dough": { look: "dough", out: [["foodcraft:raw_pasta", 2]] },
};
for (const id of Object.keys(FISH)) {
  const { item, count } = filletsOf(id);
  const look = id === "tuna" ? "tuna" : ["small_fish", "medium_fish", "large_fish"][FISH[id].size - 1];
  CHOPPABLE[`foodcraft:${id}`] = { look, out: [[item, count]] };
}

const keyOf = (block) => `foodcraft:board@${block.dimension.id}:${block.x},${block.y},${block.z}`;
const creative = (player) => player.getGameMode() === GameMode.Creative;

function setBoard(block, look, chops) {
  block.setPermutation(block.permutation.withState("foodcraft:item", look).withState("foodcraft:chops", chops));
}

function clearBoard(block) {
  setBoard(block, "none", 0);
  world.setDynamicProperty(keyOf(block), undefined);
}

function above(block) {
  const c = block.center();
  return { x: c.x, y: c.y + 0.4, z: c.z };
}

export function giveOrDrop(player, block, stack) {
  const leftover = player.getComponent(EntityComponentTypes.Inventory)?.container?.addItem(stack) ?? stack;
  if (leftover) block.dimension.spawnItem(leftover, above(block));
}

export function takeOne(player, equippable, held) {
  if (creative(player)) return;
  if (held.amount > 1) {
    held.amount -= 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  } else {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}

function wearKnife(player, equippable, knife) {
  if (creative(player)) return;
  const durability = knife.getComponent(ItemComponentTypes.Durability);
  if (!durability) return;
  if (durability.damage + 1 >= durability.maxDurability) {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    player.playSound("random.break");
    return;
  }
  durability.damage += 1;
  equippable.setEquipment(EquipmentSlot.Mainhand, knife);
}

export const cuttingBoardComponent = {
  onPlayerInteract({ block, player }) {
    if (!player) return;
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
    const look = block.permutation.getState("foodcraft:item");

    if (look === "none") {
      const recipe = held && CHOPPABLE[held.typeId];
      if (!recipe) {
        player.onScreenDisplay.setActionBar("Put something to chop on the board");
        return;
      }
      world.setDynamicProperty(keyOf(block), held.typeId);
      takeOne(player, equippable, held);
      setBoard(block, recipe.look, 0);
      block.dimension.playSound("block.itemframe.add_item", block.center());
      return;
    }

    const onBoard = world.getDynamicProperty(keyOf(block));
    if (!held) {
      clearBoard(block); // empty hand: take it back
      if (typeof onBoard === "string") giveOrDrop(player, block, new ItemStack(onBoard, 1));
      return;
    }
    if (held.typeId !== KNIFE) {
      player.onScreenDisplay.setActionBar("Chop it with a knife");
      return;
    }

    const chops = block.permutation.getState("foodcraft:chops") + 1;
    block.dimension.playSound("hit.wood", block.center());
    block.dimension.spawnParticle("minecraft:crop_growth_emitter", above(block));
    wearKnife(player, equippable, held);
    if (chops < CHOPS_NEEDED) {
      setBoard(block, look, chops);
      return;
    }
    clearBoard(block); // state first: a second click sees an empty board
    const recipe = typeof onBoard === "string" ? CHOPPABLE[onBoard] : undefined;
    for (const [item, count] of recipe?.out ?? []) block.dimension.spawnItem(new ItemStack(item, count), above(block));
  },

  onPlayerBreak({ block }) {
    const onBoard = world.getDynamicProperty(keyOf(block));
    world.setDynamicProperty(keyOf(block), undefined);
    if (typeof onBoard === "string") block.dimension.spawnItem(new ItemStack(onBoard, 1), block.center());
  },
};
```

In `main.js`, add `import { cuttingBoardComponent } from "./board.js";` and register it in the startup handler:

```js
event.blockComponentRegistry.registerCustomComponent("foodcraft:cutting_board", cuttingBoardComponent);
```

- [ ] **Step 3: Checklist lines**

```
## v2: Cutting board (Task 5)
- [ ] Knife: iron ingot over stick; board: 3 wooden slabs (any wood)
- [ ] Right-click board with a trout: trout lies on the board (medium fish shape), one trout taken
- [ ] Three right-clicks with the knife: chop sound each time, then 2 fish fillets pop out, board empty
- [ ] Tuna gives 3 tuna fillets; herring gives 1 fish fillet; halibut gives 3 fish fillets
- [ ] Beef -> 2 minced meat; potato -> raw fries; pizza dough -> 2 raw pasta
- [ ] Empty board, holding dirt: action bar "Put something to chop on the board", nothing taken
- [ ] Full board, holding dirt: action bar "Chop it with a knife"
- [ ] Full board, empty hand: the exact item comes back (the same fish species)
- [ ] Break a full board: drops the board and the item
- [ ] Knife loses 1 durability per chop and breaks with a sound at 128 chops (survival)
- [ ] Creative: ingredient not taken, knife not worn
- [ ] Fillet, minced meat and raw fries cook in the furnace
```

- [ ] **Step 4: Deploy and verify in game**
- [ ] **Step 5: Commit** "v2: cutting board and knife".

---

### Task 6: Corn, lettuce, rice and cinnamon

Build order step 3. Pure copies of the v1 garlic files with new names; no new script.

**Files (for each of `corn`, `lettuce`, `rice`, `cinnamon`):**
- `blocks/<id>_crop.json`: copy `garlic_crop.json` and replace `garlic` with `<id>` everywhere (identifier, the four textures, both loot tables).
- `blocks/wild_<id>.json`: copy `wild_garlic.json` the same way.
- `loot_tables/blocks/<id>_crop_seed.json`, `<id>_crop_mature.json` and `wild_<id>.json`, from the table below.
- `features/wild_<id>_block.json`, `features/wild_<id>_patch.json` and `feature_rules/wild_<id>_rule.json`: copy the garlic versions and change the biome filter.
- `blocks.json`: add `grass` sound for the crop and the wild plant. `make_content.mjs 6` adds the items, names, textures and atlas entries.

| Crop | Seed loot (immature) | Mature loot (two pools) | Wild plant loot | Wild biome filter (after `overworld`) |
|---|---|---|---|---|
| corn | corn_kernels 1 | corn 1–2; corn_kernels 1–2 | corn_kernels 1–2 | `any_of`: `savanna`, `plains` |
| lettuce | lettuce_seeds 1 | lettuce 1; lettuce_seeds 1–2 | lettuce_seeds 1–2 | `forest` |
| rice | rice 1 | rice 2–3 | rice 1–2 | `any_of`: `swamp`, `mangrove_swamp` |
| cinnamon | cinnamon_cutting 1 | cinnamon_stick 1–2; cinnamon_cutting 1 | cinnamon_cutting 1 | `jungle` |

An `any_of` filter, as one entry of `minecraft:biome_filter`:

```json
{ "any_of": [
  { "test": "has_biome_tag", "operator": "==", "value": "savanna" },
  { "test": "has_biome_tag", "operator": "==", "value": "plains" }
] }
```

Before deploying, check that the tags `savanna`, `swamp` and `mangrove_swamp` exist in bedrock-samples `behavior_pack/biomes/`. If `mangrove_swamp` has no tag of that name, use the tag the file does carry.

For wild rice, `may_attach_to.bottom` is `["minecraft:grass_block", "minecraft:mud", "minecraft:dirt"]`. Add the same three blocks to its `placement_filter`.

- [ ] **Step 1:** Write the files above, then run `node tools/make_content.mjs 6`.
- [ ] **Step 2: Checklist lines**

```
## v2: New crops (Task 6)
- [ ] Corn kernels, lettuce seeds, rice and cinnamon cutting plant on farmland only
- [ ] Each crop shows 4 stages, grows on its own and with bone meal
- [ ] Mature harvests as in spec 2.2; immature drops only the seed item
- [ ] New world: wild corn in savanna and plains, wild lettuce in forests, wild rice in swamps, wild cinnamon in jungles
```

- [ ] **Step 3: Deploy and verify in game** (crops in the test world, wild plants in a new world).
- [ ] **Step 4: Commit** "v2: corn, lettuce, rice and cinnamon".

---

### Task 7: Cooking pot

Build order step 4.

**Files:**
- Create: `packs/foodcraft_bp/blocks/cooking_pot.json`, `packs/foodcraft_bp/scripts/pot.js`
- Generated: `node tools/make_models.mjs cooking_pot`, `node tools/make_content.mjs 7`
- Modify:
  - `main.js`
  - `blocks.json` (`"foodcraft:cooking_pot": { "sound": "metal" }`)
  - `terrain_texture.json` (`foodcraft_cooking_pot`)

- [ ] **Step 1: `blocks/cooking_pot.json`**

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:cooking_pot",
      "menu_category": { "category": "items" },
      "states": {
        "foodcraft:pot": ["empty", "water", "cooking", "done"],
        "foodcraft:dish": ["none", "fish_soup", "bolognese", "mac_and_cheese", "rice_porridge"],
        "foodcraft:filled": [0, 1, 2, 3, 4],
        "foodcraft:portions": [0, 1, 2, 3]
      }
    },
    "components": {
      "minecraft:geometry": {
        "identifier": "geometry.foodcraft_cooking_pot",
        "bone_visibility": {
          "water": "q.block_state('foodcraft:pot') == 'water' || q.block_state('foodcraft:pot') == 'cooking'",
          "soup_fish_soup": "q.block_state('foodcraft:pot') == 'done' && q.block_state('foodcraft:dish') == 'fish_soup'",
          "soup_bolognese": "q.block_state('foodcraft:pot') == 'done' && q.block_state('foodcraft:dish') == 'bolognese'",
          "soup_mac_and_cheese": "q.block_state('foodcraft:pot') == 'done' && q.block_state('foodcraft:dish') == 'mac_and_cheese'",
          "soup_rice_porridge": "q.block_state('foodcraft:pot') == 'done' && q.block_state('foodcraft:dish') == 'rice_porridge'",
          "ingredient_1": "q.block_state('foodcraft:pot') != 'done' && q.block_state('foodcraft:filled') >= 1",
          "ingredient_2": "q.block_state('foodcraft:pot') != 'done' && q.block_state('foodcraft:filled') >= 2",
          "ingredient_3": "q.block_state('foodcraft:pot') != 'done' && q.block_state('foodcraft:filled') >= 3",
          "ingredient_4": "q.block_state('foodcraft:pot') != 'done' && q.block_state('foodcraft:filled') >= 4"
        }
      },
      "minecraft:material_instances": { "*": { "texture": "foodcraft_cooking_pot", "render_method": "alpha_test" } },
      "minecraft:collision_box": { "origin": [-6, 0, -6], "size": [12, 9, 12] },
      "minecraft:selection_box": { "origin": [-8, 0, -6], "size": [16, 9, 12] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 1.5 },
      "minecraft:light_dampening": 0,
      "minecraft:tick": { "interval_range": [10, 10], "looping": true },
      "foodcraft:cooking_pot": {}
    }
  }
}
```

- [ ] **Step 2: `scripts/pot.js`**

```js
// Spec 2.5: water, up to 4 ingredients, a lit campfire below, 10 s of cooking, 3 portions taken with bowls.
import { world, system, ItemStack, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";
import { giveOrDrop, takeOne } from "./board.js";

const POT_ID = "foodcraft:cooking_pot";
const COOK_TICKS = 200; // 10 seconds
const PORTIONS = 3;
const RECIPES = {
  fish_soup: { item: "foodcraft:fish_soup", needs: ["foodcraft:fish_fillet", "minecraft:potato", "minecraft:carrot"] },
  bolognese: { item: "foodcraft:spaghetti_bolognese", needs: ["foodcraft:raw_pasta", "foodcraft:minced_meat", "foodcraft:tomato_sauce"] },
  mac_and_cheese: { item: "foodcraft:mac_and_cheese", needs: ["foodcraft:raw_pasta", "foodcraft:mozzarella", "foodcraft:mozzarella"] },
  rice_porridge: { item: "foodcraft:rice_porridge", needs: ["foodcraft:rice", "foodcraft:rice", "minecraft:milk_bucket", "minecraft:sugar"] },
};
const GIVES_BACK = { "minecraft:milk_bucket": "minecraft:bucket" };

const timers = new Map();
const keyOf = (block) => `foodcraft:pot@${block.dimension.id}:${block.x},${block.y},${block.z}`;
const state = (block, name) => block.permutation.getState(name);

function setPot(block, changes) {
  let p = block.permutation;
  for (const [name, value] of Object.entries(changes)) p = p.withState(`foodcraft:${name}`, value);
  block.setPermutation(p);
}

function contents(block) {
  const raw = world.getDynamicProperty(keyOf(block));
  return typeof raw === "string" ? JSON.parse(raw) : [];
}

function setContents(block, list) {
  world.setDynamicProperty(keyOf(block), list.length ? JSON.stringify(list) : undefined);
}

// true if `list` is a sub-multiset of `needs`
function fitsInto(list, needs) {
  const left = [...needs];
  for (const id of list) {
    const i = left.indexOf(id);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

const canStillMake = (list) => Object.values(RECIPES).some((r) => fitsInto(list, r.needs));
const recipeFor = (list) => Object.keys(RECIPES).find((d) => RECIPES[d].needs.length === list.length && fitsInto(list, RECIPES[d].needs));

function campfireLit(block) {
  const below = block.below();
  if (!below || (below.typeId !== "minecraft:campfire" && below.typeId !== "minecraft:soul_campfire")) return false;
  return below.permutation.getState("extinguished") === false;
}

function startCooking(block) {
  const key = keyOf(block);
  if (timers.has(key)) return;
  const { dimension } = block;
  const at = { x: block.x, y: block.y, z: block.z };
  timers.set(key, system.runTimeout(() => {
    timers.delete(key);
    const pot = dimension.getBlock(at);
    if (!pot || pot.typeId !== POT_ID || state(pot, "pot") !== "cooking") return;
    if (!campfireLit(pot)) return; // paused; onTick starts a new timer when the fire is lit again
    setPot(pot, { pot: "done", filled: 0, portions: PORTIONS });
    setContents(pot, []);
    try {
      dimension.playSound("random.orb", pot.center());
    } catch {}
  }, COOK_TICKS));
}

function cancelCooking(block) {
  const key = keyOf(block);
  if (timers.has(key)) system.clearRun(timers.get(key));
  timers.delete(key);
}

function tryStart(block, player) {
  const dish = recipeFor(contents(block));
  if (!dish) return;
  if (!campfireLit(block)) {
    player?.onScreenDisplay.setActionBar("The pot needs a lit campfire under it");
    return;
  }
  setPot(block, { pot: "cooking", dish });
  startCooking(block);
}

export const cookingPotComponent = {
  onPlayerInteract({ block, player }) {
    if (!player) return;
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
    const pot = state(block, "pot");
    const creative = player.getGameMode() === GameMode.Creative;

    if (pot === "cooking") {
      player.onScreenDisplay.setActionBar("Still cooking…");
      return;
    }

    if (pot === "done") {
      if (held?.typeId !== "minecraft:bowl") {
        player.onScreenDisplay.setActionBar("Take the food out with a bowl");
        return;
      }
      const dish = state(block, "dish");
      const left = state(block, "portions") - 1;
      setPot(block, left > 0 ? { portions: left } : { pot: "empty", dish: "none", portions: 0 });
      takeOne(player, equippable, held);
      giveOrDrop(player, block, new ItemStack(RECIPES[dish].item, 1));
      return;
    }

    if (pot === "empty") {
      if (held?.typeId !== "minecraft:water_bucket") {
        player.onScreenDisplay.setActionBar("Fill the pot with water first");
        return;
      }
      setPot(block, { pot: "water" });
      if (!creative) equippable.setEquipment(EquipmentSlot.Mainhand, new ItemStack("minecraft:bucket", 1));
      block.dimension.playSound("bucket.empty_water", block.center());
      return;
    }

    // pot === "water"
    const list = contents(block);
    if (!held) {
      const last = list.pop();
      if (!last) return;
      setContents(block, list);
      setPot(block, { filled: list.length });
      if (!GIVES_BACK[last]) giveOrDrop(player, block, new ItemStack(last, 1)); // no free milk buckets
      return;
    }
    if (list.length >= 4 || !canStillMake([...list, held.typeId])) {
      player.onScreenDisplay.setActionBar("That doesn't go in the pot");
      return;
    }
    list.push(held.typeId);
    setContents(block, list);
    setPot(block, { filled: list.length });
    const back = GIVES_BACK[held.typeId];
    if (back && !creative) equippable.setEquipment(EquipmentSlot.Mainhand, new ItemStack(back, 1));
    else takeOne(player, equippable, held);
    block.dimension.playSound("bucket.fill_water", block.center());
    tryStart(block, player);
  },

  onTick({ block }) {
    const pot = state(block, "pot");
    if (pot === "water") {
      if (recipeFor(contents(block)) && campfireLit(block)) tryStart(block); // campfire lit after the last ingredient
      return;
    }
    if (pot !== "cooking") return;
    if (campfireLit(block)) startCooking(block); // no-op while a timer runs; restarts after a world reload
    const c = block.center();
    block.dimension.spawnParticle("minecraft:basic_smoke_particle", { x: c.x, y: c.y + 0.3, z: c.z });
  },

  onPlayerBreak({ block, brokenBlockPermutation }) {
    cancelCooking(block);
    const list = contents(block);
    setContents(block, []);
    if (brokenBlockPermutation.getState("foodcraft:pot") === "done") return; // spec: cooked portions are lost
    for (const id of list) if (!GIVES_BACK[id]) block.dimension.spawnItem(new ItemStack(id, 1), block.center());
  },
};
```

Register it in `main.js`: add `import { cookingPotComponent } from "./pot.js";` and

```js
event.blockComponentRegistry.registerCustomComponent("foodcraft:cooking_pot", cookingPotComponent);
```

- [ ] **Step 3: Bucket check.** In game, right-click the pot with a water bucket and with a milk bucket.
  - **The pot takes them:** done.
  - **The bucket empties into the world instead (water placed next to the pot), or the player drinks the milk:** the item's own use wins over the block. Stop and report to the parent, with what happened for each bucket. The fix (for example a water bottle instead of a bucket, or sneak-click) changes spec 2.5 and is decided with the kids.
- [ ] **Step 4: Checklist lines**

```
## v2: Cooking pot (Task 7)
- [ ] Pot recipe: iron U with a bucket in the middle
- [ ] Empty pot + water bucket: water shows, bucket comes back empty
- [ ] Empty pot + anything else: "Fill the pot with water first"
- [ ] Ingredients go in one at a time and show as bits on the water
- [ ] Wrong ingredient: "That doesn't go in the pot", nothing taken
- [ ] Empty hand takes the last ingredient back out
- [ ] Fish soup, bolognese, mac and cheese, rice porridge: each starts cooking on its last ingredient (smoke), done after 10 s
- [ ] Milk bucket goes in and the empty bucket comes back
- [ ] No campfire: "The pot needs a lit campfire under it"; light one later and it starts by itself
- [ ] Put out the campfire mid-cook: cooking pauses; relight: it finishes
- [ ] While cooking: "Still cooking…"
- [ ] Done: three bowls take three portions, then the pot is empty (no water)
- [ ] Done + no bowl: "Take the food out with a bowl"
- [ ] Break the pot with ingredients in: they drop (no milk bucket); break while done: no food drops
- [ ] Save & Quit mid-cook, re-enter: finishes within 10 s
- [ ] Creative: ingredients and buckets not used up
```

- [ ] **Step 5: Deploy and verify in game**
- [ ] **Step 6: Commit** "v2: cooking pot".

---

### Task 8: The oven bakes more than pizza (tuna pizza first)

Build order step 5 (part 1). The oven gets a dish table. All v2 oven dishes go into the table now; the raw items for lasagna, buns, brownies and waffles appear in Tasks 10 and 11, so until then those rows are simply never used.

**Files:**
- Modify: `packs/foodcraft_bp/scripts/oven.js`, `packs/foodcraft_bp/blocks/pizza_oven.json`, `art/models/pizza_oven_open.bbmodel`, `packs/foodcraft_rp/models/blocks/pizza_oven.geo.json`, `packs/foodcraft_rp/textures/blocks/foodcraft_pizza_oven.png`
- Generated: `node tools/make_content.mjs 8`

- [ ] **Step 1: `oven.js`, dish table**

Replace the constants `RAW_PREFIX`, `BAKED_PREFIX` and `PIZZAS` with:

```js
// value of foodcraft:dish -> raw item in, baked item out (spec 2.6).
const DISHES = {
  margherita: { raw: "foodcraft:raw_pizza_margherita", baked: "foodcraft:pizza_margherita", count: 1 },
  pepperoni: { raw: "foodcraft:raw_pizza_pepperoni", baked: "foodcraft:pizza_pepperoni", count: 1 },
  prosciutto: { raw: "foodcraft:raw_pizza_prosciutto", baked: "foodcraft:pizza_prosciutto", count: 1 },
  hawaii: { raw: "foodcraft:raw_pizza_hawaii", baked: "foodcraft:pizza_hawaii", count: 1 },
  tuna: { raw: "foodcraft:raw_pizza_tuna", baked: "foodcraft:pizza_tuna", count: 1 },
  lasagna: { raw: "foodcraft:raw_lasagna", baked: "foodcraft:lasagna", count: 1 },
  cinnamon_buns: { raw: "foodcraft:raw_cinnamon_buns", baked: "foodcraft:cinnamon_bun", count: 3 },
  brownies: { raw: "foodcraft:raw_brownies", baked: "foodcraft:brownie", count: 4 },
  waffles: { raw: "foodcraft:batter", baked: "foodcraft:waffle", count: 3 },
};
const DISH_BY_RAW = new Map(Object.entries(DISHES).map(([dish, d]) => [d.raw, dish]));
const baked = (dish) => new ItemStack(DISHES[dish].baked, DISHES[dish].count);
```

Then make these changes:
- **`heldRawPizza`:** rename it to `heldRaw`. Its body becomes `const dish = held && DISH_BY_RAW.get(held.typeId); return dish ? { equippable, held, pizza: dish } : undefined;`.
- **Take-out:** `new ItemStack(BAKED_PREFIX + pizza, 1)` becomes `baked(pizza)`.
- **`onPlayerBreak`:** the raw drop becomes `new ItemStack(DISHES[pizza].raw, 1)`, and the baked drop becomes `baked(pizza)`.
- **Action bar:** "Put a raw pizza in the oven" becomes "Put something raw in the oven". Update the v1 checklist line as well.

`food.js` is unchanged. Its `raw_pizza_` prefix already covers raw tuna pizza.

- [ ] **Step 2: `pizza_oven.json`**

Rename the state `foodcraft:pizza` to `foodcraft:dish` everywhere (block JSON states and every `bone_visibility` and permutation condition, and `"foodcraft:pizza"` in `oven.js`). Set its values to `["none", "margherita", "pepperoni", "prosciutto", "hawaii", "tuna", "lasagna", "cinnamon_buns", "brownies", "waffles"]`. Add these lines to `bone_visibility`, in the same pattern as the v1 lines:

```
"pizza_tuna": "q.block_state('foodcraft:stage') == 'done' && q.block_state('foodcraft:dish') == 'tuna'",
"lasagna": "... == 'lasagna'",
"cinnamon_buns": "... == 'cinnamon_buns'",
"brownies": "... == 'brownies'",
"waffles": "... == 'waffles'"
```

- [ ] **Step 3: Model**

Open `art/models/pizza_oven_open.bbmodel` in Blockbench and add five bones:
- **`pizza_tuna`:** duplicate `pizza_margherita`, and paint the toppings pink and grey on a free texture area.
- **`lasagna`:** a 6×2×5 orange-brown block on the oven floor.
- **`cinnamon_buns`:** three 2×1×2 brown cubes.
- **`brownies`:** a 5×1×4 dark brown slab.
- **`waffles`:** a 5×1×5 golden slab.

Then export the model:

```
node tools/bbmodel_to_geo.mjs art/models/pizza_oven_open.bbmodel packs/foodcraft_rp/models/blocks/pizza_oven.geo.json
```

Check that the geo has the five new bone names and keeps all v1 bones. This step can be a kid session; until it is done, the new dishes bake fine but the done oven shows no food.

- [ ] **Step 4:** Run `node tools/make_content.mjs 8`.
- [ ] **Step 5: Checklist lines**

```
## v2: Oven extended (Task 8)
- [ ] All four v1 pizzas still bake in a newly placed oven
- [ ] Raw tuna pizza: dough + sauce + mozzarella + tuna fillet; eating it gives nausea
- [ ] Tuna pizza bakes in 10 s, done oven shows it, take-out gives tuna pizza
- [ ] Right-click empty oven with dirt: "Put something raw in the oven"
```

- [ ] **Step 6: Deploy and verify in game**
- [ ] **Step 7: Commit** "v2: oven dish table and tuna pizza".

---

### Task 9: Fish dishes

Build order step 5 (part 2). Only table entries; everything is generated.

- [ ] **Step 1:** Run `node tools/make_content.mjs 9`.
- [ ] **Step 2: Checklist lines**

```
## v2: Fish dishes (Task 9)
- [ ] Fish fillet + egg + flour -> 2 raw fish cakes -> furnace -> fish cakes
- [ ] Cooked fish fillet + fries + paper -> fish and chips
- [ ] Tuna fillet + rice + dried kelp -> 3 sushi
- [ ] Each dish eats and fills less than a baked pizza
```

- [ ] **Step 3: Deploy and verify in game**
- [ ] **Step 4: Commit** "v2: fish cakes, fish and chips, sushi".

---

### Task 10: Pasta and taco

Build order step 6.

- [ ] **Step 1:** Run `node tools/make_content.mjs 10`.
- [ ] **Step 2: Checklist lines**

```
## v2: Pasta and taco (Task 10)
- [ ] Raw pasta + minced meat + tomato sauce + mozzarella -> raw lasagna -> pizza oven -> lasagna (oven shows it)
- [ ] Corn -> corn flour -> furnace -> tortilla
- [ ] Tortilla + cooked minced meat + lettuce + tomato + mozzarella -> taco
```

- [ ] **Step 3: Deploy and verify in game**
- [ ] **Step 4: Commit** "v2: lasagna and taco".

---

### Task 11: Baking and sweets

Build order step 7.

- [ ] **Step 1:** Run `node tools/make_content.mjs 11`.
- [ ] **Step 2: Checklist lines**

```
## v2: Baking (Task 11)
- [ ] Pizza dough + sugar + cinnamon stick -> raw cinnamon buns -> oven -> 3 cinnamon buns
- [ ] Flour + cocoa beans + egg + sugar -> raw brownies -> oven -> 4 brownies
- [ ] Flour, egg, sugar over a milk bucket -> batter, empty bucket returned
- [ ] Batter -> furnace -> pancakes; batter -> pizza oven -> 3 waffles
- [ ] 3 sweet berries + sugar + glass bottle -> jam; eating jam gives the bottle back
- [ ] Breaking an oven while baking buns drops the raw buns; while done drops 3 buns
```

- [ ] **Step 3: Deploy and verify in game**
- [ ] **Step 4: Commit** "v2: cinnamon buns, brownies, pancakes, waffles, jam".

---

### Task 12: Polish

Build order step 8. These are kid sessions.

- [ ] **Step 1: Names.** Read every v2 line in `nb_NO.lang` with the kids and change names in `tools/content_v2.mjs` (not in the lang file). Then run `node tools/make_content.mjs 12`.
- [ ] **Step 2: Textures.** The kids redraw the placeholders in Blockbench, starting with the 13 fish. Save each one over the PNG with the same name.
- [ ] **Step 3: Sounds.** Add `foodcraft.board.chop` and `foodcraft.pot.bubble` to `sounds/sound_definitions.json`, in the same way as the v1 ding: a CC0 or self-recorded `.wav`, with credit in `art/README.md`. Switch the `playSound` calls in `board.js` (`hit.wood`) and `pot.js` (`random.orb`) to them inside `try`.
- [ ] **Step 4: Export and Realm.** Bump the manifest versions, run `tools/export_mcaddon.ps1` (or `tools/push.sh`), upload to the Realm, and on a console catch a fish, chop it, cook fish soup and eat it.
- [ ] **Step 5: Commit** "v2: polish".
