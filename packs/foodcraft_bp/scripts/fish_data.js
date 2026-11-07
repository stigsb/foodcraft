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
