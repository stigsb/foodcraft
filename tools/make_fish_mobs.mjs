#!/usr/bin/env node
// Swimming fish: one entity per species in scripts/fish_data.js, spawning in the biomes of its water zones.
// Writes per species: BP entity, spawn rule, loot table; RP client entity, geometry and texture (texture only
// if missing, so hand-drawn skins are kept). Shared: animations and render controller. Plus lang lines.
// The bucket items come from tools/content_v2.mjs (step 12); scripts/fish_mobs.js releases them.
// Usage: node tools/make_fish_mobs.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePng, hex, shade } from "./png.mjs";
import { FISH, ZONES } from "../packs/foodcraft_bp/scripts/fish_data.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BP = path.join(ROOT, "packs/foodcraft_bp");
const RP = path.join(ROOT, "packs/foodcraft_rp");
const writeJson = (file, obj) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
};

// --- biome filters ------------------------------------------------------------------------------
// Spawn rules can only test biome tags, not biome ids. For each species, find tag tests that match
// exactly the biomes of its zones (checked against every vanilla biome), greedily, one all_of per group.
const TAGS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/data/biome_tags.json"), "utf8"));
delete TAGS["//"];
const ALL = Object.keys(TAGS);
const has = (b, lit) => TAGS[b].includes(lit.tag) === lit.is;

function biomeFilter(wanted) {
  const want = new Set(wanted);
  const others = ALL.filter((b) => !want.has(b));
  const groups = [];
  let uncovered = [...want];
  while (uncovered.length) {
    const seed = uncovered[0];
    const lits = [];
    let bad = others, good = uncovered;
    while (bad.length) {
      // Candidate tests that the seed biome passes; pick the one that drops the most unwanted biomes,
      // breaking ties by keeping the most still-uncovered wanted biomes.
      const cands = [...new Set(ALL.flatMap((b) => TAGS[b]))].flatMap((tag) => [{ tag, is: true }, { tag, is: false }]).filter((l) => has(seed, l));
      let best, bestScore = -1;
      for (const l of cands) {
        const dropped = bad.filter((b) => !has(b, l)).length;
        if (!dropped) continue;
        const score = dropped * 1000 + good.filter((b) => has(b, l)).length;
        if (score > bestScore) [best, bestScore] = [l, score];
      }
      if (!best) throw new Error(`cannot separate ${seed} from ${bad.join(" ")}`);
      lits.push(best);
      bad = bad.filter((b) => has(b, best));
      good = good.filter((b) => has(b, best));
    }
    groups.push(lits);
    uncovered = uncovered.filter((b) => !lits.every((l) => has(b, l)));
  }
  // verify
  for (const b of ALL) {
    const hit = groups.some((g) => g.every((l) => has(b, l)));
    if (hit !== want.has(b)) throw new Error(`biome filter wrong for ${b}`);
  }
  const test = (l) => ({ test: "has_biome_tag", operator: l.is ? "==" : "!=", value: l.tag });
  return { any_of: groups.map((g) => ({ all_of: g.map(test) })) };
}

// --- body shapes --------------------------------------------------------------------------------
// Pixel units; the fish faces -Z (as vanilla cod). Roles: main, accent (belly), fin, head (gets eyes), dark.
const C = (o, s, role) => ({ o, s, role });
function shapeOf(id, size) {
  const dims = { 1: { w: 2, h: 3, L: 5, head: 2, tail: 3 }, 2: { w: 2, h: 4, L: 7, head: 2, tail: 4 }, 3: { w: 3, h: 6, L: 10, head: 3, tail: 5 } }[size];
  let { w, h, L, head, tail } = dims;
  if (id === "piranha") [h, L] = [4, 4];
  if (id === "catfish") h = 4;
  const x0 = -w / 2, zb = -L / 2;
  const body = [C([x0, 0, zb], [w, h, L], "main"), C([x0, h > 3 ? 0.5 : 0, zb - head], [w, h > 3 ? h - 1 : h, head], "head")];
  const fins = [];
  let tailfin = [C([0, 0, L / 2], [0, h, tail], "fin")];

  if (id === "halibut") {
    // flatfish: wide and flat, eyes on top, horizontal tail
    body.length = 0;
    body.push(C([-4, 0, -5], [8, 2, 10], "main"), C([-3, 0, -7], [6, 2, 2], "head"));
    tailfin = [C([-2.5, 1, 5], [5, 0, 3], "fin")];
  } else {
    fins.push(C([0, h, -L / 2 + 1], [0, size === 3 ? 2 : 1, Math.max(2, L - 3)], "fin")); // dorsal fin
    fins.push(C([0, -1, 0], [0, 1, 2], "fin")); // belly fin
  }
  if (id === "swordfish") {
    body.push(C([-0.5, h / 2 - 0.5, zb - head - 6], [1, 1, 6], "dark")); // bill
    fins[0] = C([0, h, -L / 2 + 1], [0, 4, 3], "fin"); // tall sail
  }
  if (id === "catfish") {
    body.push(C([w / 2, 1, zb - head], [3, 0, 1], "dark"), C([-w / 2 - 3, 1, zb - head], [3, 0, 1], "dark")); // whiskers
  }
  return { body: [...body, ...fins], tailfin, tailPivot: [0, h / 2, L / 2], height: h };
}

// --- geometry + texture (box UV) ----------------------------------------------------------------
function buildModel(id, f) {
  const shape = shapeOf(id, f.size);
  const bones = { body: shape.body, tailfin: shape.tailfin };
  const W = 64;
  let x = 0, y = 0, rowH = 0;
  const placed = [];
  for (const [bone, cubes] of Object.entries(bones)) {
    for (const c of cubes) {
      const [w, h, d] = c.s.map(Math.ceil), nw = 2 * (w + d), nh = d + h;
      if (x + nw > W) { x = 0; y += rowH; rowH = 0; }
      placed.push({ bone, c, u: x, v: y, w, h, d });
      x += nw;
      rowH = Math.max(rowH, nh);
    }
  }
  const H = Math.max(16, 2 ** Math.ceil(Math.log2(y + rowH)));
  const geo = {
    format_version: "1.21.0",
    "minecraft:geometry": [{
      description: { identifier: `geometry.foodcraft_${id}`, texture_width: W, texture_height: H, visible_bounds_width: 2, visible_bounds_height: 1.5, visible_bounds_offset: [0, 0.5, 0] },
      bones: [
        { name: "body", pivot: [0, shape.height / 2, 0], cubes: placed.filter((p) => p.bone === "body").map((p) => ({ origin: p.c.o, size: p.c.s, uv: [p.u, p.v] })) },
        { name: "tailfin", parent: "body", pivot: shape.tailPivot, cubes: placed.filter((p) => p.bone === "tailfin").map((p) => ({ origin: p.c.o, size: p.c.s, uv: [p.u, p.v] })) },
      ],
    }],
  };
  writeJson(path.join(RP, "models/entity", `foodcraft_${id}.geo.json`), geo);

  const png = path.join(RP, "textures/entity/fish", `foodcraft_${id}.png`);
  if (fs.existsSync(png)) return;
  const main = hex(f.main), accent = hex(f.accent), eye = hex("#111111");
  const colour = { main, head: main, accent, fin: shade(main, 0.75), dark: shade(main, 0.5) };
  const px = Array.from({ length: H }, () => Array.from({ length: W }, () => [0, 0, 0, 0]));
  const rect = (x0, y0, w, h, fn) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px[y0 + j][x0 + i] = fn(i, j); };
  const flat = id === "halibut";
  for (const { c, u, v, w, h, d } of placed) {
    const base = colour[c.role];
    const speckle = (i, j, col) => ((i * 7 + j * 3) % 5 === 0 ? shade(col, 0.88) : col);
    // sides: back on top, belly colour on the lowest third (not on the flatfish or the fins)
    const side = (i, j) => (!flat && (c.role === "main" || c.role === "head") && j >= Math.ceil(h * 0.6) ? accent : speckle(i, j, base));
    rect(u + d, v, w, d, (i, j) => {
      if (flat && c.role === "head" && j === 0 && (i === 1 || i === w - 2)) return eye; // flatfish: eyes on top
      return speckle(i, j, shade(base, 1.08));
    }); // top
    rect(u + d + w, v, w, d, () => (flat ? accent : c.role === "fin" || c.role === "dark" ? base : accent)); // bottom
    for (const [fx, fw] of [[u, d], [u + d + w, d]]) {
      // the two sides; the head gets an eye near the top
      rect(fx, v + d, fw, h, (i, j) => (c.role === "head" && !flat && j === 1 && i === Math.floor(fw / 2) ? eye : side(i, j)));
    }
    rect(u + d, v + d, w, h, side); // front
    rect(u + 2 * d + w, v + d, w, h, side); // back
  }
  writePng(png, px);
}

// --- per species files --------------------------------------------------------------------------
const HEALTH = { 1: 3, 2: 5, 3: 8 };
const HERD = { 1: [3, 6], 2: [2, 4], 3: [1, 2] };
const WEIGHT = { 1: 20, 2: 14, 3: 8 };
const SCALE = { 1: 0.9, 2: 1, 3: 1.25 };

function entity(id, f) {
  const size = f.size, box = { 1: [0.4, 0.3], 2: [0.6, 0.4], 3: [0.9, 0.6] }[size];
  return {
    format_version: "1.21.0",
    "minecraft:entity": {
      description: { identifier: `foodcraft:${id}`, is_spawnable: true, is_summonable: true, is_experimental: false, spawn_category: "water_ambient" },
      component_groups: { "foodcraft:caught": { "minecraft:instant_despawn": {} } },
      components: {
        "minecraft:type_family": { family: ["aquatic", "fish", "foodcraft_fish", id] },
        "minecraft:health": { value: HEALTH[size], max: HEALTH[size] },
        "minecraft:scale": { value: SCALE[size] },
        "minecraft:collision_box": { width: box[0], height: box[1] },
        "minecraft:loot": { table: `loot_tables/entities/foodcraft_${id}.json` },
        "minecraft:experience_reward": { on_death: "query.last_hit_by_player ? Math.Random(1,3) : 0" },
        "minecraft:breathable": { breathes_air: false, breathes_water: true, suffocate_time: 0, total_supply: 15 },
        "minecraft:physics": { has_gravity: false },
        "minecraft:pushable": { is_pushable: true, is_pushable_by_piston: true },
        "minecraft:movement": { value: 0.1 },
        "minecraft:underwater_movement": { value: size === 3 ? 0.13 : 0.1 },
        "minecraft:movement.sway": { sway_amplitude: 0 },
        "minecraft:navigation.generic": { can_breach: false, can_walk: false, can_path_over_water: false, can_sink: false, can_swim: true, is_amphibious: false },
        "minecraft:despawn": { despawn_from_distance: { min_distance: 32, max_distance: 40 } },
        "minecraft:conditional_bandwidth_optimization": {},
        "minecraft:nameable": {},
        "minecraft:is_hidden_when_invisible": {},
        "minecraft:hurt_on_condition": { damage_conditions: [{ cause: "lava", damage_per_tick: 4, filters: { test: "in_lava", subject: "self", operator: "==", value: true } }] },
        "minecraft:behavior.avoid_mob_type": {
          priority: 1,
          entity_types: [{ filters: { any_of: [{ test: "is_family", subject: "other", value: "player" }, { test: "is_family", subject: "other", value: "axolotl" }] }, max_dist: 6, walk_speed_multiplier: 1.5, sprint_speed_multiplier: 2 }],
        },
        "minecraft:behavior.random_swim": { priority: 3, interval: 0, xz_dist: 16, y_dist: 4, speed_multiplier: 1 },
        "minecraft:behavior.swim_wander": { priority: 4, interval: 0.1, look_ahead: 2 },
        "minecraft:behavior.swim_idle": { priority: 5 },
        "minecraft:flocking": {
          in_water: true, match_variants: false, use_center_of_mass: true, low_flock_limit: 2, high_flock_limit: 6, loner_chance: 0.1,
          influence_radius: 3, breach_influence: 7, separation_weight: 1.75, separation_threshold: 0.95, cohesion_weight: 2, cohesion_threshold: 1.95,
          innner_cohesion_threshold: 1.25, goal_weight: 2, min_height: 1.5, max_height: 6, block_distance: 2, block_weight: 0.85,
        },
        // A water bucket catches the fish: the bucket becomes "bucket of <fish>" and the fish disappears.
        "minecraft:interact": {
          interactions: [{
            on_interact: { filters: { all_of: [{ test: "is_family", subject: "other", value: "player" }, { test: "has_equipment", domain: "hand", subject: "other", value: "water_bucket" }] }, event: "foodcraft:caught", target: "self" },
            transform_to_item: `foodcraft:${id}_bucket`,
            play_sounds: "bucket.fill_fish",
            interact_text: "action.interact.catch",
          }],
        },
      },
      events: { "foodcraft:caught": { add: { component_groups: ["foodcraft:caught"] } } },
    },
  };
}

function spawnRule(id, f) {
  const biomes = ZONES.filter((z) => z.fish.includes(id)).flatMap((z) => z.biomes);
  const [min, max] = HERD[f.size];
  return {
    format_version: "1.8.0",
    "minecraft:spawn_rules": {
      description: { identifier: `foodcraft:${id}`, population_control: "water_animal" },
      conditions: [{
        "minecraft:spawns_underwater": {},
        "minecraft:distance_filter": { min: 12, max: 32 },
        "minecraft:weight": { default: WEIGHT[f.size] },
        "minecraft:density_limit": { surface: 6 },
        "minecraft:herd": { min_size: min, max_size: max },
        "minecraft:biome_filter": biomeFilter(biomes),
      }],
    },
  };
}

const loot = (id) => ({
  pools: [
    { rolls: 1, entries: [{ type: "item", name: `foodcraft:${id}`, weight: 1, functions: [{ function: "furnace_smelt", conditions: [{ condition: "entity_properties", entity: "this", properties: { on_fire: true } }] }] }] },
    { rolls: 1, conditions: [{ condition: "random_chance", chance: 0.05 }], entries: [{ type: "item", name: "minecraft:bone_meal", weight: 1 }] },
  ],
});

const clientEntity = (id, f) => ({
  format_version: "1.10.0",
  "minecraft:client_entity": {
    description: {
      identifier: `foodcraft:${id}`,
      materials: { default: "entity_alphatest" },
      textures: { default: `textures/entity/fish/foodcraft_${id}` },
      geometry: { default: `geometry.foodcraft_${id}` },
      animations: { swim: "animation.foodcraft_fish.swim", flop: "animation.foodcraft_fish.flop" },
      scripts: { animate: [{ swim: "query.is_in_water" }, { flop: "!query.is_in_water" }] },
      render_controllers: ["controller.render.foodcraft_fish"],
      spawn_egg: { base_color: f.main, overlay_color: f.accent },
    },
  },
});

// --- write everything ---------------------------------------------------------------------------
writeJson(path.join(RP, "animations/foodcraft_fish.animation.json"), {
  format_version: "1.8.0",
  animations: {
    "animation.foodcraft_fish.swim": {
      loop: true,
      bones: {
        body: { rotation: [0, "math.sin(query.life_time * 540) * 3", 0] },
        tailfin: { rotation: [0, "math.sin(query.life_time * 540) * -25", 0] },
      },
    },
    "animation.foodcraft_fish.flop": {
      loop: true,
      bones: {
        body: { rotation: [0, 0, 90], position: [0, "math.abs(math.sin(query.life_time * 400)) * 3", 0] },
        tailfin: { rotation: [0, "math.sin(query.life_time * 900) * 30", 0] },
      },
    },
  },
});
writeJson(path.join(RP, "render_controllers/foodcraft_fish.render_controllers.json"), {
  format_version: "1.8.0",
  render_controllers: { "controller.render.foodcraft_fish": { geometry: "Geometry.default", materials: [{ "*": "Material.default" }], textures: ["Texture.default"] } },
});

const lang = { en_US: [], nb_NO: [] };
for (const [id, f] of Object.entries(FISH)) {
  writeJson(path.join(BP, "entities", `${id}.json`), entity(id, f));
  writeJson(path.join(BP, "spawn_rules", `${id}.json`), spawnRule(id, f));
  writeJson(path.join(BP, "loot_tables/entities", `foodcraft_${id}.json`), loot(id));
  writeJson(path.join(RP, "entity", `foodcraft_${id}.entity.json`), clientEntity(id, f));
  buildModel(id, f);
  lang.en_US.push([`entity.foodcraft:${id}.name`, f.en], [`item.spawn_egg.entity.foodcraft:${id}.name`, `${f.en} Spawn Egg`]);
  lang.nb_NO.push([`entity.foodcraft:${id}.name`, f.nb], [`item.spawn_egg.entity.foodcraft:${id}.name`, `Fremkallingsegg for ${f.nb.toLowerCase()}`]);
}

for (const [code, entries] of Object.entries(lang)) {
  const file = path.join(RP, "texts", `${code}.lang`);
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
console.log(`fish mobs: ${Object.keys(FISH).length} species written`);
