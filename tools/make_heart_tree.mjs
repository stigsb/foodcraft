#!/usr/bin/env node
// Heart tree: blocks (log, seed log, blossom leaves, sapling, heart flower plant), loot tables, wild generation in
// cherry groves and atlas entries. Textures are drawn by tools/art_heart_tree.mjs; the tree is built by
// scripts/heart_tree.js. Re-runnable. Usage: node tools/make_heart_tree.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { biomeFilter } from "./biome_filter.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BP = path.join(ROOT, "packs/foodcraft_bp");
const RP = path.join(ROOT, "packs/foodcraft_rp");
const write = (rel, obj) => {
  const file = path.join(rel.startsWith("RP:") ? RP : BP, rel.replace(/^(RP|BP):/, ""));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
};
const SOIL = ["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:moss_block", "minecraft:farmland"];
const HEIGHTS = [1, 2, 4, 8, 16]; // growth 0-4: pixels tall
const block = (id, category, states, components, permutations) => ({
  format_version: "1.26.50",
  "minecraft:block": {
    description: { identifier: `foodcraft:${id}`, menu_category: { category }, ...(states ? { states } : {}) },
    components,
    ...(permutations ? { permutations } : {}),
  },
});
const loot = (item) => ({ pools: [{ rolls: 1, entries: [{ type: "item", name: item, weight: 1 }] }] });

// --- tree blocks -----------------------------------------------------------------------------------
const wood = (side) => ({
  "minecraft:geometry": "minecraft:geometry.full_block",
  "minecraft:material_instances": {
    "*": { texture: side, render_method: "opaque" },
    up: { texture: "foodcraft_heart_tree_log_top", render_method: "opaque" },
    down: { texture: "foodcraft_heart_tree_log_top", render_method: "opaque" },
  },
  "minecraft:destructible_by_mining": { seconds_to_destroy: 2 },
  "minecraft:destructible_by_explosion": { explosion_resistance: 2 },
});
write("blocks/heart_tree_log.json", block("heart_tree_log", "nature", null, wood("foodcraft_heart_tree_log")));
write("blocks/heart_tree_seed_log.json", block("heart_tree_seed_log", "none", null, {
  ...wood("foodcraft_heart_tree_seed_log"),
  "minecraft:loot": "loot_tables/blocks/heart_seed.json",
  "foodcraft:heart_tree": {},
}));
write("blocks/heart_tree_leaves.json", block("heart_tree_leaves", "nature", null, {
  "minecraft:geometry": "minecraft:geometry.full_block",
  "minecraft:material_instances": { "*": { texture: "foodcraft_heart_tree_leaves", render_method: "alpha_test" } },
  "minecraft:destructible_by_mining": { seconds_to_destroy: 0.3 },
  "minecraft:light_dampening": 1,
  "minecraft:loot": "loot_tables/empty.json",
}));

// --- sapling and heart flower plant: cross plants, one texture per growth stage ----------------------
function plant(id, texture, extra, extraPermutations = []) {
  const stage = (g) => ({
    "minecraft:material_instances": { "*": { texture: `${texture}_${g}`, render_method: "alpha_test_single_sided", ambient_occlusion: 0 } },
    "minecraft:selection_box": { origin: [-5, 0, -5], size: [10, Math.max(2, HEIGHTS[g]), 10] },
  });
  return {
    components: {
      "minecraft:geometry": "minecraft:geometry.cross",
      ...stage(0),
      "minecraft:collision_box": false,
      "minecraft:destructible_by_mining": { seconds_to_destroy: 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": { conditions: [{ allowed_faces: ["up"], block_filter: SOIL }] },
      ...extra,
    },
    permutations: [
      ...[1, 2, 3, 4].map((g) => ({ condition: `q.block_state('foodcraft:growth') == ${g}`, components: stage(g) })),
      ...extraPermutations,
    ],
  };
}
{
  // The sapling gives its seed back when broken; a wild one (placed by world generation) gives nothing.
  // It ticks every 2-4 s so a wild one turns into a tree soon after its chunk loads.
  const p = plant("heart_tree_sapling", "foodcraft_heart_tree_sapling", {
    "minecraft:loot": "loot_tables/blocks/heart_seed.json",
    "minecraft:tick": { interval_range: [40, 80], looping: true },
    "foodcraft:heart_sapling": {},
  }, [{ condition: "q.block_state('foodcraft:wild') == true", components: { "minecraft:loot": "loot_tables/empty.json" } }]);
  write("blocks/heart_tree_sapling.json", block("heart_tree_sapling", "none",
    { "foodcraft:growth": [0, 1, 2, 3, 4], "foodcraft:wild": [false, true] }, p.components, p.permutations));
}
{
  // Broken before it flowers: the seed back. Flowering: a heart flower.
  const p = plant("heart_flower_plant", "foodcraft_heart_flower_plant", {
    "minecraft:loot": "loot_tables/blocks/heart_seed.json",
    "foodcraft:heart_flower": {},
  }, [{ condition: "q.block_state('foodcraft:growth') == 4", components: { "minecraft:loot": "loot_tables/blocks/heart_flower.json" } }]);
  write("blocks/heart_flower_plant.json", block("heart_flower_plant", "none", { "foodcraft:growth": [0, 1, 2, 3, 4] }, p.components, p.permutations));
}
write("loot_tables/blocks/heart_seed.json", loot("foodcraft:heart_seed"));
write("loot_tables/blocks/heart_flower.json", loot("foodcraft:heart_flower"));

// --- wild trees: a rare sapling in cherry groves that the script turns into a tree ------------------
// The script also enforces one tree per area, so two wild saplings close together give one tree.
write("features/heart_tree_block.json", {
  format_version: "1.21.10",
  "minecraft:single_block_feature": {
    description: { identifier: "foodcraft:heart_tree_block" },
    places_block: { name: "foodcraft:heart_tree_sapling", states: { "foodcraft:growth": 4, "foodcraft:wild": true } },
    enforce_placement_rules: true,
    enforce_survivability_rules: true,
    may_replace: ["minecraft:air", "minecraft:short_grass", "minecraft:pink_petals"],
    may_attach_to: { bottom: SOIL.filter((s) => s !== "minecraft:farmland") },
  },
});
write("features/heart_tree_patch.json", {
  format_version: "1.21.10",
  "minecraft:scatter_feature": {
    description: { identifier: "foodcraft:heart_tree_patch" },
    places_feature: "foodcraft:heart_tree_block",
    project_input_to_floor: true,
    distribution: { iterations: 1, x: 0, y: 0, z: 0 },
  },
});
write("feature_rules/heart_tree_rule.json", {
  format_version: "1.13.0",
  "minecraft:feature_rules": {
    description: { identifier: "foodcraft:heart_tree_rule", places_feature: "foodcraft:heart_tree_patch" },
    conditions: { placement_pass: "surface_pass", "minecraft:biome_filter": biomeFilter(["cherry_grove"]) },
    distribution: {
      iterations: 1,
      scatter_chance: 3, // percent of chunks: roughly one try per 33 chunks, the script keeps one tree per area
      coordinate_eval_order: "zxy",
      x: { distribution: "uniform", extent: [0, 15] },
      y: "query.heightmap(variable.worldx, variable.worldz)",
      z: { distribution: "uniform", extent: [0, 15] },
    },
  },
});

// --- atlas -----------------------------------------------------------------------------------------
const atlasFile = path.join(RP, "textures/terrain_texture.json");
const atlas = JSON.parse(fs.readFileSync(atlasFile, "utf8"));
const names = ["log", "log_top", "seed_log", "leaves"].map((n) => `foodcraft_heart_tree_${n}`);
for (let g = 0; g < 5; g++) names.push(`foodcraft_heart_tree_sapling_${g}`, `foodcraft_heart_flower_plant_${g}`);
for (const n of names) {
  if (!fs.existsSync(path.join(RP, "textures/blocks", `${n}.png`))) throw new Error(`missing texture ${n}: run tools/art_heart_tree.mjs`);
  atlas.texture_data[n] ??= { textures: `textures/blocks/${n}` };
}
fs.writeFileSync(atlasFile, JSON.stringify(atlas, null, 2) + "\n");

// Sounds (blocks.json is only used for sounds).
const blocksFile = path.join(RP, "blocks.json");
const blocksJson = JSON.parse(fs.readFileSync(blocksFile, "utf8"));
Object.assign(blocksJson, {
  "foodcraft:heart_tree_log": { sound: "cherry_wood" },
  "foodcraft:heart_tree_seed_log": { sound: "cherry_wood" },
  "foodcraft:heart_tree_leaves": { sound: "cherry_leaves" },
  "foodcraft:heart_tree_sapling": { sound: "grass" },
  "foodcraft:heart_flower_plant": { sound: "grass" },
});
fs.writeFileSync(blocksFile, JSON.stringify(blocksJson, null, 2) + "\n");
console.log(`heart tree: 5 blocks, 2 loot tables, wild generation, ${names.length} atlas entries`);
