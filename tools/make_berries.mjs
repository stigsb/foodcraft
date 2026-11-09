#!/usr/bin/env node
// Berry bushes from packs/foodcraft_bp/scripts/berry_data.js: per berry the bush block, its ripe loot table,
// the world-generation feature, patch and feature rule (biome filter checked by tools/biome_filter.mjs),
// the block sound and the terrain atlas entries. Items, jams, pancakes and recipes come from tools/content_v2.mjs
// (step 13); the pixel art from tools/art_berries.mjs.
// Usage: node tools/make_berries.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { biomeFilter } from "./biome_filter.mjs";
import { BUSHES as BERRIES } from "../packs/foodcraft_bp/scripts/berry_data.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BP = path.join(ROOT, "packs/foodcraft_bp");
const RP = path.join(ROOT, "packs/foodcraft_rp");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, obj) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
};

const SOIL = ["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:moss_block", "minecraft:farmland"];
const MOUNTAIN_SOIL = ["minecraft:stone", "minecraft:snow", "minecraft:gravel", "minecraft:calcite"];
// The four looks of a bush, with the condition that picks each one.
const LOOKS = [
  ["sprout", "q.block_state('foodcraft:growth') == 0"],
  ["leaves", "q.block_state('foodcraft:growth') == 1 && q.block_state('foodcraft:fruit') == 0"],
  ["flowers", "q.block_state('foodcraft:growth') == 1 && q.block_state('foodcraft:fruit') == 1"],
  ["ripe", "q.block_state('foodcraft:growth') == 1 && q.block_state('foodcraft:fruit') == 2"],
];
const material = (berry, look) => ({ "*": { texture: `foodcraft_${berry}_bush_${look}`, render_method: "alpha_test_single_sided", ambient_occlusion: 0 } });

const blocksJson = readJson(path.join(RP, "blocks.json"));
const terrain = readJson(path.join(RP, "textures/terrain_texture.json"));

for (const [berry, b] of Object.entries(BERRIES)) {
  const id = `foodcraft:${berry}_bush`;
  const soil = berry === "cloudberry" ? [...SOIL, ...MOUNTAIN_SOIL] : SOIL;

  writeJson(path.join(BP, "blocks", `${berry}_bush.json`), {
    format_version: "1.26.50",
    "minecraft:block": {
      description: {
        identifier: id,
        menu_category: { category: "nature" },
        states: { "foodcraft:growth": [0, 1], "foodcraft:fruit": [0, 1, 2] },
      },
      components: {
        "minecraft:geometry": "minecraft:geometry.cross",
        "minecraft:material_instances": material(berry, "sprout"),
        "minecraft:collision_box": false,
        "minecraft:selection_box": { origin: [-6, 0, -6], size: [12, 7, 12] },
        "minecraft:destructible_by_mining": { seconds_to_destroy: 0 },
        "minecraft:light_dampening": 0,
        "minecraft:placement_filter": { conditions: [{ allowed_faces: ["up"], block_filter: soil }] },
        "minecraft:loot": b.plantable ? `loot_tables/blocks/${berry}_bush.json` : "loot_tables/empty.json",
        "foodcraft:berry_bush": { berry },
      },
      permutations: [
        ...LOOKS.slice(1).map(([look, condition]) => ({
          condition,
          components: {
            "minecraft:material_instances": material(berry, look),
            "minecraft:selection_box": { origin: [-7, 0, -7], size: [14, 13, 14] },
          },
        })),
        { condition: LOOKS[3][1], components: { "minecraft:loot": `loot_tables/blocks/${berry}_bush_ripe.json` } },
      ],
    },
  });

  writeJson(path.join(BP, "loot_tables/blocks", `${berry}_bush_ripe.json`), {
    pools: [{ rolls: 1, entries: [{ type: "item", name: `foodcraft:${berry}`, weight: 1, functions: [{ function: "set_count", count: { min: b.count[0], max: b.count[1] } }] }] }],
  });

  // A plantable bush that is not ripe gives one berry back, so it can be moved.
  if (b.plantable) {
    writeJson(path.join(BP, "loot_tables/blocks", `${berry}_bush.json`), { pools: [{ rolls: 1, entries: [{ type: "item", name: `foodcraft:${berry}`, weight: 1 }] }] });
  }

  // World generation: ripe bushes in small patches.
  writeJson(path.join(BP, "features", `${berry}_bush_block.json`), {
    format_version: "1.21.10",
    "minecraft:single_block_feature": {
      description: { identifier: `foodcraft:${berry}_bush_block` },
      places_block: { name: id, states: { "foodcraft:growth": 1, "foodcraft:fruit": 2 } },
      enforce_placement_rules: true,
      enforce_survivability_rules: true,
      may_replace: ["minecraft:air", "minecraft:short_grass"],
      may_attach_to: { bottom: soil.filter((s) => s !== "minecraft:farmland") },
    },
  });
  writeJson(path.join(BP, "features", `${berry}_bush_patch.json`), {
    format_version: "1.21.10",
    "minecraft:scatter_feature": {
      description: { identifier: `foodcraft:${berry}_bush_patch` },
      places_feature: `foodcraft:${berry}_bush_block`,
      project_input_to_floor: true,
      distribution: {
        iterations: b.patch,
        x: { distribution: "gaussian", extent: [-3, 3] },
        y: 0,
        z: { distribution: "gaussian", extent: [-3, 3] },
      },
    },
  });
  writeJson(path.join(BP, "feature_rules", `${berry}_bush_rule.json`), {
    format_version: "1.13.0",
    "minecraft:feature_rules": {
      description: { identifier: `foodcraft:${berry}_bush_rule`, places_feature: `foodcraft:${berry}_bush_patch` },
      conditions: { placement_pass: "surface_pass", "minecraft:biome_filter": biomeFilter(b.biomes) },
      distribution: {
        iterations: 1,
        scatter_chance: b.scatter,
        coordinate_eval_order: "zxy",
        x: { distribution: "uniform", extent: [0, 15] },
        y: "query.heightmap(variable.worldx, variable.worldz)",
        z: { distribution: "uniform", extent: [0, 15] },
      },
    },
  });

  blocksJson[id] = { sound: "sweet_berry_bush" };
  for (const [look] of LOOKS) terrain.texture_data[`foodcraft_${berry}_bush_${look}`] = { textures: `textures/blocks/foodcraft_${berry}_bush_${look}` };
}

writeJson(path.join(BP, "loot_tables/empty.json"), { pools: [] });
writeJson(path.join(RP, "blocks.json"), blocksJson);
writeJson(path.join(RP, "textures/terrain_texture.json"), terrain);
console.log(`berry bushes: ${Object.keys(BERRIES).length} written`);
