// Foodcraft v2 content table. node tools/make_content.mjs <task> writes every entry with step <= task.
import { FISH } from "../packs/foodcraft_bp/scripts/fish_data.js";
import { browned } from "./icons.mjs";
import { BERRIES, JAMS } from "../packs/foodcraft_bp/scripts/berry_data.js";

const COOKED_FOOD = { 1: [5, 0.6], 2: [6, 0.8], 3: [7, 0.8] };

// food: [nutrition, saturation_modifier]. returns: item handed back after eating (stack 1 for bowls).
export const ITEMS = [
  ...Object.entries(FISH).flatMap(([id, f]) => [
    { step: 2, id, en: f.en, nb: f.nb, food: [2, 0.1], icon: { shape: "fish", main: f.main, accent: f.accent, size: f.size } },
    { step: 2, id: `cooked_${id}`, en: `Cooked ${f.en}`, nb: `Stekt ${f.nb.toLowerCase()}`, food: COOKED_FOOD[f.size],
      icon: { shape: "fish", main: browned(f.main), accent: browned(f.accent), size: f.size } },
  ]),
  // Step 12: swimming fish (tools/make_fish_mobs.mjs). A water bucket used on a fish catches it in a bucket.
  ...Object.entries(FISH).map(([id, f]) => ({
    step: 12, id: `${id}_bucket`, en: `Bucket of ${f.en}`, nb: `Bøtte med ${f.nb.toLowerCase()}`, stack: 1, component: "fish_bucket",
    icon: { shape: "fish_bucket", main: f.main, accent: f.accent },
  })),
  { step: 4, id: "scallop", en: "Scallop", nb: "Kamskjell", food: [1, 0.1], icon: { shape: "shell", main: "#e8b9a0", accent: "#c98a6e" } },
  { step: 4, id: "grilled_scallop", en: "Grilled Scallop", nb: "Grillet kamskjell", food: [4, 0.6], icon: { shape: "shell", main: "#e0a060", accent: "#a86a3a" } },

  { step: 5, id: "knife", en: "Knife", nb: "Kniv", durability: 128, damage: 5, icon: { shape: "knife", main: "#6b4a2a" } },
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
  // Step 13: berries, jams and pancakes with jam (scripts/berry_data.js; pixel art in tools/art_berries.mjs).
  // "jam" is the sweet berry jam from step 11. Restoration and glow berry jam work even when you are full.
  ...JAMS.map((j) => ({ step: j.id === "jam" ? 11 : 13, id: j.id, en: j.en, nb: j.nb, food: [4, 0.3], returns: "minecraft:glass_bottle",
    alwaysEat: j.id === "jam_of_restoration" || j.id === "glow_berry_jam", icon: { shape: "bottle", main: "#c02840" } })),
  ...JAMS.map((j) => ({ step: 13, id: `pancakes_with_${j.id}`, en: `Pancakes with ${j.en}`,
    nb: `Pannekaker med ${j.id === "jam_of_restoration" ? j.nb : j.nb.toLowerCase()}`,
    food: [8, 0.7], alwaysEat: j.id === "jam_of_restoration" || j.id === "glow_berry_jam", icon: { shape: "stack", main: "#e0b060", accent: "#c03048" } })),
  ...Object.entries(BERRIES).map(([id, b]) => ({ step: 13, id, en: b.en, nb: b.nb, food: [2, id === "heart_berry" ? 0.6 : 0.2], alwaysEat: id === "heart_berry",
    places: b.plantable ? `${id}_bush` : undefined, placesOn: ["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:farmland"],
    icon: { shape: "seeds", main: "#c02840" } })),
  // Step 14: pepperoni sausage (2 raw porkchops + oregano), sliced on the cutting board into 6 slices = one pepperoni pizza.
  { step: 14, id: "pepperoni_sausage", en: "Pepperoni Sausage", nb: "Pepperonipølse", food: [4, 0.6], icon: { shape: "stick", main: "#9a3324", accent: "#c04a38" } },
  { step: 14, id: "pepperoni_slices", en: "Pepperoni Slices", nb: "Pepperoniskiver", food: [1, 0.3], icon: { shape: "seeds", main: "#b83a2a" } },
];

// Names for hand-written blocks (lang only).
export const BLOCK_NAMES = [
  { step: 4, id: "scallop_bed", en: "Scallop Bed", nb: "Kamskjellbanke" },
  { step: 5, id: "cutting_board", en: "Cutting Board", nb: "Skjærebrett" },
  { step: 6, id: "corn_crop_top", en: "Corn", nb: "Mais" }, // upper half of the two-block corn plant
  ...Object.entries(BERRIES).map(([id, b]) => ({ step: 13, id: `${id}_bush`, en: b.bushEn, nb: b.bushNb })),
  ...[["corn", "Corn", "Mais"], ["lettuce", "Lettuce", "Salat"], ["rice", "Rice", "Ris"], ["cinnamon", "Cinnamon", "Kanel"]].flatMap(([id, en, nb]) => [
    { step: 6, id: `${id}_crop`, en, nb },
    { step: 6, id: `wild_${id}`, en: `Wild ${en}`, nb: `Vill ${nb.toLowerCase()}` },
  ]),
];

// Crop and wild plant textures (cross geometry). accent = the produce colour shown at stage 3.
const CROPS = { corn: ["#6a9a38", "#f0c830"], lettuce: ["#78b848", "#b8e888"], rice: ["#8aa858", "#f4f0e4"], cinnamon: ["#5a7a30", "#9a5a2a"] };
export const BLOCK_TEXTURES = Object.entries(CROPS).flatMap(([id, [main, accent]]) => [
  ...[0, 1, 2, 3].map((n) => ({ step: 6, name: `foodcraft_${id}_crop_${n}`, icon: { shape: `crop${n}`, main, accent } })),
  { step: 6, name: `foodcraft_wild_${id}`, icon: { shape: "crop3", main, accent } },
]);
// Corn is two blocks tall from stage 2. Its textures are drawn by tools/art_corn.mjs; these icons are only fallbacks.
BLOCK_TEXTURES.push(...[2, 3].map((n) => ({ step: 6, name: `foodcraft_corn_crop_top_${n}`, icon: { shape: `crop${n}`, main: CROPS.corn[0], accent: CROPS.corn[1] } })));

const FOOD_COOKING = ["furnace", "smoker", "campfire", "soul_campfire"];

export const RECIPES = [
  ...Object.keys(FISH).map((id) => ({ step: 2, type: "furnace", id: `cooked_${id}`, input: id, output: `cooked_${id}`, tags: FOOD_COOKING })),
  { step: 4, type: "furnace", id: "grilled_scallop", input: "scallop", output: "grilled_scallop", tags: FOOD_COOKING },

  { step: 5, type: "shaped", id: "knife", pattern: ["I", "S"], key: { I: "minecraft:iron_ingot", S: "minecraft:stick" }, result: "knife" },
  { step: 5, type: "shaped", id: "cutting_board", pattern: ["SSS"], key: { S: { tag: "minecraft:wooden_slabs" } }, result: "cutting_board" },
  { step: 5, type: "furnace", id: "cooked_fish_fillet", input: "fish_fillet", output: "cooked_fish_fillet", tags: FOOD_COOKING },
  { step: 5, type: "furnace", id: "cooked_minced_meat", input: "minced_meat", output: "cooked_minced_meat", tags: FOOD_COOKING },
  { step: 5, type: "furnace", id: "fries", input: "raw_fries", output: "fries", tags: FOOD_COOKING },


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
  // Jam: 3 berries + sugar + glass bottle. Pancakes with jam: jam on top of pancakes, the bottle comes back.
  ...JAMS.map((j) => ({ step: j.id === "jam" ? 11 : 13, type: "shapeless", id: j.id, ingredients: [j.berry, j.berry, j.berry, "minecraft:sugar", "minecraft:glass_bottle"], result: j.id })),
  ...JAMS.map((j) => ({ step: 13, type: "shaped", id: `pancakes_with_${j.id}`, pattern: ["J", "P"], key: { J: j.id, P: "pancakes" },
    result: `pancakes_with_${j.id}`, extra: [{ item: "minecraft:glass_bottle", count: 1, data: 0 }] })),
  { step: 14, type: "shapeless", id: "pepperoni_sausage", ingredients: ["minecraft:porkchop", "minecraft:porkchop", "oregano"], result: "pepperoni_sausage" },
];
