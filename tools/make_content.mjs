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
