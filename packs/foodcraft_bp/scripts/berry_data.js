// Berry bushes and jams. No @minecraft imports, so the Node generators (tools/make_berries.mjs,
// tools/content_v2.mjs, tools/art_berries.mjs) can read this file too.
//
// Bush: foodcraft:<id>_bush. States growth 0 (sprout) / 1 (bush) and fruit 0 (leaves) / 1 (flowers) / 2 (ripe).
// Picking a ripe bush gives `count` berries and it ripens again. Wild bushes are placed ripe by world generation
// in `biomes` (vanilla biome ids, turned into a tag filter by tools/biome_filter.mjs).
// plantable: the berry item plants a new bush on grass, dirt or farmland.

export const BERRIES = {
  strawberry: {
    en: "Strawberries", nb: "Jordbær", bushEn: "Strawberry Bush", bushNb: "Jordbærplante",
    jam: { en: "Strawberry Jam", nb: "Jordbærsyltetøy" },
    biomes: ["forest", "forest_hills", "flower_forest"], // oak forest
    scatter: 22, patch: 5, count: [1, 3], plantable: true, ripenChance: 0.2,
  },
  blueberry: {
    en: "Blueberries", nb: "Blåbær", bushEn: "Blueberry Bush", bushNb: "Blåbærlyng",
    jam: { en: "Blueberry Jam", nb: "Blåbærsyltetøy" },
    biomes: ["taiga", "taiga_hills", "taiga_mutated", "cold_taiga", "cold_taiga_hills", "cold_taiga_mutated",
      "mega_taiga", "mega_taiga_hills", "redwood_taiga_mutated", "redwood_taiga_hills_mutated"],
    scatter: 30, patch: 6, count: [2, 4], plantable: true, ripenChance: 0.2,
  },
  cloudberry: {
    en: "Cloudberries", nb: "Molter", bushEn: "Cloudberry Plant", bushNb: "Molteplante",
    jam: { en: "Cloudberry Jam", nb: "Moltesyltetøy" },
    biomes: ["meadow", "grove", "snowy_slopes", "jagged_peaks", "frozen_peaks", "stony_peaks", "extreme_hills",
      "extreme_hills_edge", "extreme_hills_mutated", "extreme_hills_plus_trees", "extreme_hills_plus_trees_mutated"],
    scatter: 25, patch: 5, count: [1, 2], plantable: true, ripenChance: 0.15,
  },
  raspberry: {
    en: "Raspberries", nb: "Bringebær", bushEn: "Raspberry Bush", bushNb: "Bringebærbusk",
    jam: { en: "Raspberry Jam", nb: "Bringebærsyltetøy" },
    biomes: ["plains", "sunflower_plains", "forest", "forest_hills", "flower_forest", "birch_forest", "birch_forest_hills",
      "birch_forest_mutated", "birch_forest_hills_mutated", "roofed_forest", "roofed_forest_mutated", "dappled_forest"],
    scatter: 18, patch: 4, count: [1, 3], plantable: true, ripenChance: 0.2,
  },
  // Very rare and strong: only wild, only in cherry groves high in the mountains, and slow to ripen again.
  heart_berry: {
    en: "Heart Berry", nb: "Hjertebær", bushEn: "Heart Berry Bush", bushNb: "Hjertebærbusk",
    jam: { id: "jam_of_restoration", en: "Jam of Restoration", nb: "Jam of Restoration" },
    biomes: ["cherry_grove"],
    scatter: 4, patch: 1, count: [1, 1], plantable: false, ripenChance: 0.03,
  },
};

// Jams that don't come from the bushes above: vanilla sweet berries and glow berries.
export const OTHER_JAMS = {
  jam: { berry: "minecraft:sweet_berries", en: "Sweet Berry Jam", nb: "Søtbærsyltetøy" },
  glow_berry_jam: { berry: "minecraft:glow_berries", en: "Glow Berry Jam", nb: "Glødebærsyltetøy" },
};

export const jamId = (berry) => BERRIES[berry].jam.id ?? `${berry}_jam`;

// Every jam: id, berry item, names. Pancakes with jam: `pancakes_with_<jam id>`.
export const JAMS = [
  ...Object.entries(OTHER_JAMS).map(([id, j]) => ({ id, ...j })),
  ...Object.entries(BERRIES).map(([berry, b]) => ({ id: jamId(berry), berry: `foodcraft:${berry}`, en: b.jam.en, nb: b.jam.nb })),
];

// Effects from eating (scripts/food.js). ticks: [min, max]; 20 ticks = 1 second.
export const EAT_EFFECTS = {
  "foodcraft:heart_berry": { effect: "regeneration", ticks: [60, 100], amplifier: 2 }, // Regeneration III: the only way to get it
  "foodcraft:jam_of_restoration": { effect: "regeneration", ticks: [300, 300], amplifier: 1 },
  "foodcraft:pancakes_with_jam_of_restoration": { effect: "regeneration", ticks: [300, 300], amplifier: 1 },
  "foodcraft:glow_berry_jam": { effect: "illumination", ticks: [1200, 1200] },
  "foodcraft:pancakes_with_glow_berry_jam": { effect: "illumination", ticks: [1200, 1200] },
};
