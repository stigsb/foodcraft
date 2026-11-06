# Pizza Night (Foodcraft v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full v1 loop (wild plants, crops, ingredients, raw and baked pizzas, pizza oven) as a Minecraft Bedrock add-on that Ravn and Kasper can build one playable step at a time.

**Architecture:** Two packs in the repo (`packs/foodcraft_bp`, `packs/foodcraft_rp`) deployed by a copy script into the Windows development pack folders. Items, recipes, blocks, loot tables and features are JSON. One JavaScript script module (`@minecraft/server` 2.11.0) registers four block custom components (`foodcraft:crop`, `foodcraft:tomato`, `foodcraft:pineapple`, `foodcraft:pizza_oven`) and the raw-pizza nausea handler. Placeholder 16x16 textures are generated from the concept SVGs so every task is playable before the kids redraw art in Blockbench.

**Tech Stack:** Minecraft Bedrock 1.26.60 (Windows GDK build), `@minecraft/server` 2.11.0, block/item/recipe `format_version` 1.26.50, plain JavaScript (no build step), Node (placeholder texture tool), PowerShell (deploy and export scripts).

**Spec:** `docs/superpowers/specs/2026-11-06-pizza-night-design.md`

## Spec conflicts

None block the spec as written. Two points are narrower than the spec text:

- **4.2 "Oven broken while baking/done drops the pizza":** the block custom component hook is `onPlayerBreak`, which fires only for player breaks (Task 5). An oven removed by explosion, piston or `/setblock` drops the oven (via its loot table) but not the pizza.
- **2.1 "Each crop has 4 growth stages":** tomato and pineapple are different (decided 2026-11-06, Task 8). They grow in 3 stages and then ripen fruit in more stages: the tomato grows two blocks tall and ripens flowers, small green, green, orange, red; the pineapple grows a leaf rosette and ripens a flower spike, small green, green, golden. Using a ripe plant picks the fruit (2–3 tomatoes or 1 pineapple) and the plant ripens again. Breaking a ripe plant still gives the spec harvest. The spec text is not updated yet.
- **2.3 "Eating raw pizza gives Nausea":** `minecraft:food` has no effect field in the current format (doc confirms `remove_effects` is deprecated and there is no add-effect field). The effect is applied from script in `world.afterEvents.itemCompleteUse` (Task 4). Same player-visible result.

## Doc sources used

All checked 2026-11-06.

| Topic | Source | What it settled |
|---|---|---|
| Current stable script API | `npm view @minecraft/server dist-tags` | `latest` = `2.11.0`; `2.12.0` is beta for game 1.26.63, so 2.11.0 is the stable module in 1.26.60 |
| Current game version | github.com/Mojang/bedrock-samples `main` manifests | `min_engine_version: [1, 26, 60]`; vanilla items, blocks and recipes on `main` use `format_version "1.26.50"` |
| Manifest format | learn.microsoft.com/minecraft/creator/documents/scripting/introduction | `format_version: 2`, script module `{type: "script", language: "javascript", entry: "scripts/main.js"}`, dependency `{module_name: "@minecraft/server", version: "..."}`; `/reload` hot-reloads scripts |
| Windows dev pack paths | learn.microsoft.com/minecraft/creator/documents/gdkpcprojectfolder (and gettingstarted) | From 1.21.120 (GDK): `%appdata%\Minecraft Bedrock\users\shared\games\com.mojang\development_behavior_packs` and `...\development_resource_packs`; logs at `%appdata%\Minecraft Bedrock\logs\`; Preview uses `Minecraft Bedrock Preview` |
| Custom Components V2 | learn.microsoft.com/.../documents/update1.21.90, `.../documents/scriptingv2.0.0overview`, `.../blockcomponents/minecraftblock_custom_components` | Available without experiments since 1.21.90 with `@minecraft/server` >= 2.0.0. Custom components are listed directly under `components` (`"foodcraft:crop": {}`); `minecraft:custom_components` is deprecated. Registration: `system.beforeEvents.startup.subscribe(e => e.blockComponentRegistry.registerCustomComponent(id, {...}))` |
| Block custom component hooks | learn.microsoft.com/.../scriptapi/minecraft/server/blockcustomcomponent | `onPlayerInteract(BlockComponentPlayerInteractEvent: block, dimension, face, faceLocation?, player?)`, `onRandomTick(BlockComponentRandomTickEvent: block, dimension)`, `onTick(BlockComponentTickEvent)`, `onPlayerBreak(BlockComponentPlayerBreakEvent: brokenBlockPermutation, player?)`, `onPlace`, `beforeOnPlayerPlace`. Second arg is `CustomComponentParameters` |
| `minecraft:tick` | `.../blockcomponents/minecraftblock_tick` | `interval_range: [min, max]`, `looping`. A custom component with `onTick` on a block without `minecraft:tick` is a content error |
| Block states and permutations | microsoft/minecraft-samples `casual_creator/gray_wave/.../fabricator.block.json`; wiki.bedrock.dev/blocks/block-states (states syntax) | `description.states: {"ns:name": [values]}`, `permutations: [{condition: "q.block_state('ns:name') == 'x'", components: {...}}]`, `traits.minecraft:placement_direction` with `minecraft:cardinal_direction` |
| Block geometry and materials | `.../blockcomponents/minecraftblock_geometry`, `minecraftblock_material_instances` | Built-in `minecraft:geometry.full_block` and `minecraft:geometry.cross`; from 1.21.80 geometry and material_instances must both be present; `render_method` values; `bone_visibility` supports Molang (1.20.10+) |
| `minecraft:placement_filter` | `.../blockcomponents/minecraftblock_placement_filter` | `conditions: [{allowed_faces: [...], block_filter: ["minecraft:farmland"]}]` |
| `minecraft:block_placer` | `.../itemcomponents/minecraft_block_placer` | `block`, `use_on: [block descriptors]` (empty = anywhere), `replace_block_item`. Requires item format_version >= 1.21.50 |
| `minecraft:food`, `display_name` | `.../itemcomponents/minecraft_food`, `minecraft_display_name`; bedrock-samples `items/apple.json` | `nutrition`, `saturation_modifier`, `can_always_eat`, `using_converts_to`; needs `minecraft:use_modifiers`; `display_name.value` may be a lang key |
| Lang keys for blocks | learn.microsoft.com/.../documents/addcustomdieblock, advancedcustomblocks | `tile.demo:die.name=Die` in `texts/en_US.lang`; `terrain_texture.json` and `item_texture.json` formats; `blocks.json` only needed for sounds |
| Recipes returning buckets | bedrock-samples `recipes/cake.json`, `mushroom_stew.json`; learn `.../recipedefinitions/minecraftrecipe_shaped` | `result` may be an array: `[{item: "minecraft:cake"}, {item: "minecraft:bucket", count: 3, data: 0}]` (shaped). Shapeless uses `ingredients` with optional `count`; both use `unlock` |
| Vanilla item/block ids | `@minecraft/vanilla-data` 1.26.60 (`MinecraftItemTypes`, `MinecraftBlockTypes`, `MinecraftEffectTypes`) | `minecraft:water_bucket`, `minecraft:milk_bucket`, `minecraft:bucket`, `minecraft:bowl`, `minecraft:porkchop`, `minecraft:cooked_porkchop`, `minecraft:wheat`, `minecraft:bone_meal`, `minecraft:brick_block`, `minecraft:furnace`, `minecraft:stone`, `minecraft:farmland`, `minecraft:grass_block`, `minecraft:dirt`, `minecraft:nausea` |
| Loot tables | learn `.../loottabledefinitions/itemmodtables`; minecraft-samples `example_feature_set/loot_tables/blocks/apple_block.json`; `.../blockcomponents/minecraftblock_loot` | `pools[].entries[] {type: "item", name, weight, functions: [{function: "set_count", count: {min, max}}]}`; block references `"minecraft:loot": "loot_tables/blocks/x.json"` |
| Features and feature rules | learn `.../featuresreference/examples/featuresintroduction`, `minecraftscatter_feature`, `minecraftsingle_block_feature`; minecraft-samples `example_feature_set` (`scatter_flowers_feature_rules.json`, `red_flower_feature.json`) | Folders `features/`, `feature_rules/`; file name must match the identifier's name part; `minecraft:feature_rules` with `conditions.placement_pass: "surface_pass"`, `minecraft:biome_filter: [{test: "has_biome_tag", operator: "==", value: "plains"}]`, `distribution {iterations, x, y: "query.heightmap(variable.worldx, variable.worldz)", z}`; `scatter_feature` with `project_input_to_floor`; `single_block_feature` with `may_attach_to.bottom`, `may_replace`, `enforce_placement_rules`, `enforce_survivability_rules` |
| Biome tags | bedrock-samples `behavior_pack/biomes/{plains,forest,meadow,jungle}.biome.json` | Tags `plains`, `forest`, `meadow`, `jungle`; all four also carry `overworld` |
| Script API classes | learn `.../scriptapi/minecraft/server/{block,blockpermutation,dimension,player,entity,container,entityequippablecomponent,screendisplay,system,itemstack,gamemode,itemcompleteuseafterevent}` | `Block.setPermutation`, `BlockPermutation.withState/getState`, `Dimension.spawnItem/playSound/spawnParticle/getBlock`, `Player.getGameMode()` -> `GameMode.Creative`, `Player.onScreenDisplay.setActionBar`, `Entity.addEffect(id, ticks, {showParticles})`, `Container.addItem` returns leftover or `undefined`, `EntityEquippableComponent.getEquipment(EquipmentSlot.Mainhand)`, `system.runTimeout(cb, ticks)` / `clearRun`, `world.afterEvents.itemCompleteUse` (`itemStack`, `source`) |

## Global Constraints

- Namespace for every identifier: `foodcraft:` (spec 3).
- Game: Minecraft Bedrock 1.26.60 or newer on Windows; both manifests use `min_engine_version: [1, 26, 60]`.
- `format_version` for items, blocks and recipes: `"1.26.50"`. Features and feature rules: `"1.21.10"` / `"1.13.0"` as in the official samples.
- Script dependency: `@minecraft/server` version `"2.11.0"`. Plain JavaScript ES modules under `packs/foodcraft_bp/scripts/`. No TypeScript, no bundler.
- Textures are 16x16 PNG (spec 2.5). Exception: the tomato and pineapple plant model textures are 32x32 (Task 8). Placeholders come from `tools/render_placeholders.mjs`; the kids replace files in place with the same names.
- Item lang keys: `item.foodcraft.<name>.name`. Block lang keys: `tile.foodcraft:<name>.name`. English in `en_US.lang`; Norwegian in `nb_NO.lang` (Task 10).
- Every task ends with: deploy, `/reload` (or re-enter the world for JSON changes), zero errors in the Content Log (Settings > Creator > Content Log, enable "Content Log GUI" and "Content Log File"), and the task's checklist lines ticked in `docs/test-checklist.md`.
- Test world: flat, creative, cheats on, both packs active, named `Foodcraft Test`. Wild plants (Task 9) need a new non-flat world.
- Commit after each task. No co-author lines.

## File structure

```
packs/
  foodcraft_bp/
    manifest.json
    items/            one file per item (21 items)
    recipes/          one file per recipe (15 recipes)
    blocks/           pizza_oven.json, 2 crops, tomato_crop + tomato_crop_top, pineapple_crop, 4 wild plants
    loot_tables/blocks/
    features/         scatter + single-block feature per wild plant
    feature_rules/    one per wild plant
    scripts/
      main.js         imports the three modules below
      food.js         raw pizza nausea
      oven.js         foodcraft:pizza_oven component
      crop.js         foodcraft:crop component
      fruit_plant.js  foodcraft:tomato and foodcraft:pineapple components
  foodcraft_rp/
    manifest.json
    blocks.json       block sounds
    texts/            en_US.lang, nb_NO.lang, languages.json
    textures/
      item_texture.json
      terrain_texture.json
      items/*.png
      blocks/*.png
    models/blocks/pizza_oven.geo.json   (Task 6, Blockbench)
    models/blocks/tomato_crop_{lower,upper}.geo.json, pineapple_crop.geo.json   (Task 8, Blockbench)
    sounds/sound_definitions.json       (Task 10)
    sounds/foodcraft/ding.ogg            (Task 10)
tools/
  render_placeholders.mjs  concept SVG -> 16x16 PNGs
  deploy.ps1               repo packs -> Windows development pack folders
  export_mcaddon.ps1       packs -> dist/foodcraft.mcaddon
docs/test-checklist.md     one line per item, recipe, oven edge case
```

---

### Task 1: Placeholder texture tool

Claude does this task; it is tooling, not a kid session.

**Files:**
- Create: `tools/render_placeholders.mjs`
- Create: `packs/foodcraft_rp/textures/items/*.png`, `packs/foodcraft_rp/textures/blocks/*.png` (generated)

**Interfaces:**
- Consumes: `docs/superpowers/specs/images/{ingredients,pizzas,crops,oven}.svg`. Each tile is a background `<rect fill="#3b3b46">` of size 96/128/160 holding 16x16 pixel rects of size 6/8/10, with a `<text>` label under it.
- Produces: PNG files named below. Later tasks reference these names in `item_texture.json` / `terrain_texture.json`.

| SVG label | Output file |
|---|---|
| ingredients: `tomato`, `garlic`, `oregano`, `pineapple`, `tomato seeds`, `oregano seeds`, `flour`, `dough`, `tomato sauce`, `mozzarella`, `pepperoni`, `ham` | `textures/items/foodcraft_<label with spaces as _>.png` (`dough` -> `foodcraft_pizza_dough.png`) |
| pizzas: `raw margherita` ... `raw hawaii` | `textures/items/foodcraft_raw_pizza_<name>.png` |
| pizzas: `margherita` ... `hawaii` | `textures/items/foodcraft_pizza_<name>.png` |
| crops: `tomato 0` ... `pineapple 3` | `textures/blocks/foodcraft_<plant>_crop_<n>.png` |
| oven: `empty`, `baking`, `done` | `textures/blocks/foodcraft_oven_front_<state>.png` |
| derived copies | `textures/items/foodcraft_pineapple_crown.png` (= pineapple), `textures/blocks/foodcraft_wild_<plant>.png` (= `<plant>_crop_3`), `textures/blocks/foodcraft_oven_side.png` and `foodcraft_oven_top.png` (= oven front empty) |

- [ ] **Step 1: Write the tool**

Python is not installed on the dev machine, so the tool is a Node script, `tools/render_placeholders.mjs` (uses `node:zlib` for deflate and CRC, no npm packages). It reads every `<rect x y width height fill/>` and `<text>` in each SVG, finds the `#3b3b46` tile backgrounds (96/128/160 square), takes the label whose text sits within 40 px under the tile, maps each 6/8/10 px rect inside the tile to one pixel of a 16x16 RGBA image (everything else transparent), writes it to the path from the table above, and then makes the derived copies.

- [ ] **Step 2: Run it and check the output**

Run: `node tools/render_placeholders.mjs`
Expected: `wrote 46 textures` (12 ingredients + 8 pizzas + 16 crop stages + 3 oven fronts + 7 copies).

Run: `node -e "const fs=require('fs');for(const d of ['items','blocks']){const p='packs/foodcraft_rp/textures/'+d;for(const f of fs.readdirSync(p).sort()){const b=fs.readFileSync(p+'/'+f);console.log(d+'/'+f,b.readUInt32BE(16),b.readUInt32BE(20))}}"`
Expected: 46 lines, every one ending in `16 16`.

Open `packs/foodcraft_rp/textures/items/foodcraft_tomato.png` with the Read tool: a red tomato with a dark outline on a transparent background.

- [ ] **Step 3: Commit**

```bash
git add tools/render_placeholders.mjs packs/foodcraft_rp/textures
git commit -m "Add placeholder texture tool and generated textures"
```

---

### Task 2: Hello pizza (packs load, one edible tomato)

Build order step 1. Kid session: Ravn and Kasper type the JSON with Claude, deploy, and eat a tomato.

**Files:**
- Create: `packs/foodcraft_bp/manifest.json`
- Create: `packs/foodcraft_rp/manifest.json`
- Create: `packs/foodcraft_bp/items/tomato.json`
- Create: `packs/foodcraft_rp/textures/item_texture.json`
- Create: `packs/foodcraft_rp/texts/en_US.lang`, `packs/foodcraft_rp/texts/languages.json`
- Create: `tools/deploy.ps1`
- Create: `docs/test-checklist.md`

**Interfaces:**
- Produces: pack UUIDs (fixed below, reused by every later task), the item file pattern every later item copies, and `tools/deploy.ps1` which every later task runs.

- [ ] **Step 1: Behavior pack manifest**

`packs/foodcraft_bp/manifest.json`:

```json
{
  "format_version": 2,
  "header": {
    "name": "Foodcraft Behavior Pack",
    "description": "Pizza Night: crops, ingredients and a pizza oven",
    "uuid": "7d9decc8-dc05-4900-9ee1-9ab1d2d07740",
    "version": [0, 1, 0],
    "min_engine_version": [1, 26, 60]
  },
  "modules": [
    {
      "description": "Foodcraft data",
      "type": "data",
      "uuid": "b1a3afbc-9ffe-4882-a249-c29badf31a8f",
      "version": [0, 1, 0]
    }
  ],
  "dependencies": [
    {
      "uuid": "21c9e746-cd73-41fd-a163-83955769e6c2",
      "version": [0, 1, 0]
    }
  ]
}
```

- [ ] **Step 2: Resource pack manifest**

`packs/foodcraft_rp/manifest.json`:

```json
{
  "format_version": 2,
  "header": {
    "name": "Foodcraft Resource Pack",
    "description": "Pizza Night textures, models, names and sounds",
    "uuid": "21c9e746-cd73-41fd-a163-83955769e6c2",
    "version": [0, 1, 0],
    "min_engine_version": [1, 26, 60]
  },
  "modules": [
    {
      "description": "Foodcraft resources",
      "type": "resources",
      "uuid": "6bb33493-8a0c-4438-9f00-7f4fca009c54",
      "version": [0, 1, 0]
    }
  ]
}
```

- [ ] **Step 3: The tomato item**

`packs/foodcraft_bp/items/tomato.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "foodcraft:tomato",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "foodcraft_tomato" } },
      "minecraft:display_name": { "value": "item.foodcraft.tomato.name" },
      "minecraft:food": { "nutrition": 2, "saturation_modifier": 0.3 },
      "minecraft:use_animation": { "value": "eat" },
      "minecraft:use_modifiers": { "start_using": "always", "use_duration": 1.6, "movement_modifier": 0.35 },
      "minecraft:tags": { "tags": ["minecraft:is_food"] }
    }
  }
}
```

- [ ] **Step 4: Texture atlas entry and names**

`packs/foodcraft_rp/textures/item_texture.json`:

```json
{
  "resource_pack_name": "foodcraft_rp",
  "texture_name": "atlas.items",
  "texture_data": {
    "foodcraft_tomato": { "textures": "textures/items/foodcraft_tomato" }
  }
}
```

`packs/foodcraft_rp/texts/languages.json`:

```json
["en_US", "nb_NO"]
```

`packs/foodcraft_rp/texts/en_US.lang`:

```
item.foodcraft.tomato.name=Tomato
```

Also create `packs/foodcraft_rp/texts/nb_NO.lang` containing the single line `item.foodcraft.tomato.name=Tomat` so `languages.json` does not point at a missing file. Task 10 fills it in.

- [ ] **Step 5: Deploy script**

`tools/deploy.ps1`:

```powershell
# Copies the packs from the repo into the Minecraft development pack folders (GDK build, 1.21.120+).
$com = Join-Path $env:APPDATA "Minecraft Bedrock\users\shared\games\com.mojang"
$repo = Split-Path $PSScriptRoot -Parent
foreach ($pair in @(@("foodcraft_bp", "development_behavior_packs"), @("foodcraft_rp", "development_resource_packs"))) {
    $src = Join-Path $repo "packs\$($pair[0])"
    $dst = Join-Path $com "$($pair[1])\$($pair[0])"
    robocopy $src $dst /MIR /NFL /NDL /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $src" }
    Write-Host "Deployed $src -> $dst"
}
```

- [ ] **Step 6: Test checklist file**

`docs/test-checklist.md`:

```markdown
# Pizza Night test checklist

Tick a line only after seeing it work in the test world with an empty Content Log.

## Items
- [ ] Tomato: `/give @s foodcraft:tomato`, name "Tomato", eats, hunger goes up
```

- [ ] **Step 7: Deploy and verify in game**

1. In PowerShell: `powershell -ExecutionPolicy Bypass -File tools\deploy.ps1`
2. Settings > Creator: turn on "Content Log GUI" and "Content Log File". Also turn on "Enable GameTest Framework"? No. Leave experiments off.
3. Create world "Foodcraft Test": Flat, Creative, cheats on. Under Behavior Packs > Available activate "Foodcraft Behavior Pack" (the resource pack is pulled in by the dependency; confirm it shows under Resource Packs > Active).
4. Enter the world. Content Log: no red lines.
5. `/give @s foodcraft:tomato` gives an item named "Tomato" with the red placeholder texture.
6. `/gamemode s`, take damage or sprint until hunger drops, hold use on the tomato: hunger refills by 1 shank.
7. Tick the Tomato line in `docs/test-checklist.md`.

If `/give` says the item is unknown: the behavior pack did not load; check the Content Log file at `%appdata%\Minecraft Bedrock\logs\`.

- [ ] **Step 8: Commit**

```bash
git add packs tools/deploy.ps1 docs/test-checklist.md
git commit -m "Hello pizza: packs load with one edible tomato"
```

---

### Task 3: Produce and ingredient items with recipes

Build order step 2. Kid session (can be split in two: items first, recipes second).

**Files:**
- Create: `packs/foodcraft_bp/items/{garlic,oregano,pineapple,tomato_seeds,oregano_seeds,pineapple_crown,flour,pizza_dough,tomato_sauce,mozzarella,pepperoni,ham}.json`
- Create: `packs/foodcraft_bp/recipes/{flour,pizza_dough,tomato_sauce,mozzarella,pepperoni,ham}.json`
- Modify: `packs/foodcraft_rp/textures/item_texture.json`, `packs/foodcraft_rp/texts/en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Produces item ids used by Task 4 recipes: `foodcraft:pizza_dough`, `foodcraft:tomato_sauce`, `foodcraft:mozzarella`, `foodcraft:pepperoni`, `foodcraft:ham`, `foodcraft:pineapple`, `foodcraft:oregano`. Seed ids used by Tasks 7 and 8: `foodcraft:tomato_seeds`, `foodcraft:garlic`, `foodcraft:oregano_seeds`, `foodcraft:pineapple_crown`.

- [ ] **Step 1: Non-food items**

Every item in this task uses the same shape. Full file for `tomato_seeds.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "foodcraft:tomato_seeds",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "foodcraft_tomato_seeds" } },
      "minecraft:display_name": { "value": "item.foodcraft.tomato_seeds.name" }
    }
  }
}
```

Create these files with the same content, changing only the identifier, icon texture and display name key (all three use the item name):

| File | identifier | icon texture | lang key |
|---|---|---|---|
| `oregano_seeds.json` | `foodcraft:oregano_seeds` | `foodcraft_oregano_seeds` | `item.foodcraft.oregano_seeds.name` |
| `pineapple_crown.json` | `foodcraft:pineapple_crown` | `foodcraft_pineapple_crown` | `item.foodcraft.pineapple_crown.name` |
| `flour.json` | `foodcraft:flour` | `foodcraft_flour` | `item.foodcraft.flour.name` |
| `pizza_dough.json` | `foodcraft:pizza_dough` | `foodcraft_pizza_dough` | `item.foodcraft.pizza_dough.name` |
| `tomato_sauce.json` | `foodcraft:tomato_sauce` | `foodcraft_tomato_sauce` | `item.foodcraft.tomato_sauce.name` |
| `mozzarella.json` | `foodcraft:mozzarella` | `foodcraft_mozzarella` | `item.foodcraft.mozzarella.name` |

Tasks 7 and 8 add `minecraft:block_placer` to the seed items; do not add it now (the crop blocks do not exist yet and the Content Log would report the missing block).

- [ ] **Step 2: Food items**

Same file shape as `tomato.json` from Task 2 (with `minecraft:food`, `use_animation`, `use_modifiers`, `is_food` tag). Full file for `garlic.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "foodcraft:garlic",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "foodcraft_garlic" } },
      "minecraft:display_name": { "value": "item.foodcraft.garlic.name" },
      "minecraft:food": { "nutrition": 1, "saturation_modifier": 0.3 },
      "minecraft:use_animation": { "value": "eat" },
      "minecraft:use_modifiers": { "start_using": "always", "use_duration": 1.6, "movement_modifier": 0.35 },
      "minecraft:tags": { "tags": ["minecraft:is_food"] }
    }
  }
}
```

| File | identifier | icon | lang key | nutrition | saturation_modifier |
|---|---|---|---|---|---|
| `oregano.json` | `foodcraft:oregano` | `foodcraft_oregano` | `item.foodcraft.oregano.name` | 1 | 0.3 |
| `pineapple.json` | `foodcraft:pineapple` | `foodcraft_pineapple` | `item.foodcraft.pineapple.name` | 3 | 0.3 |
| `pepperoni.json` | `foodcraft:pepperoni` | `foodcraft_pepperoni` | `item.foodcraft.pepperoni.name` | 3 | 0.6 |
| `ham.json` | `foodcraft:ham` | `foodcraft_ham` | `item.foodcraft.ham.name` | 4 | 0.6 |

- [ ] **Step 3: Recipes**

`recipes/flour.json` (shapeless, 1 wheat):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "foodcraft:flour" },
    "tags": ["crafting_table"],
    "ingredients": [{ "item": "minecraft:wheat" }],
    "unlock": [{ "item": "minecraft:wheat" }],
    "result": { "item": "foodcraft:flour" }
  }
}
```

`recipes/tomato_sauce.json` (shapeless, 2 tomato + garlic + oregano + bowl):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "foodcraft:tomato_sauce" },
    "tags": ["crafting_table"],
    "ingredients": [
      { "item": "foodcraft:tomato", "count": 2 },
      { "item": "foodcraft:garlic" },
      { "item": "foodcraft:oregano" },
      { "item": "minecraft:bowl" }
    ],
    "unlock": [{ "item": "foodcraft:tomato" }],
    "result": { "item": "foodcraft:tomato_sauce" }
  }
}
```

`recipes/pepperoni.json` (shapeless, raw porkchop + oregano):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "foodcraft:pepperoni" },
    "tags": ["crafting_table"],
    "ingredients": [{ "item": "minecraft:porkchop" }, { "item": "foodcraft:oregano" }],
    "unlock": [{ "item": "minecraft:porkchop" }],
    "result": { "item": "foodcraft:pepperoni" }
  }
}
```

`recipes/ham.json` (shapeless, cooked porkchop gives 2):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "foodcraft:ham" },
    "tags": ["crafting_table"],
    "ingredients": [{ "item": "minecraft:cooked_porkchop" }],
    "unlock": [{ "item": "minecraft:cooked_porkchop" }],
    "result": { "item": "foodcraft:ham", "count": 2 }
  }
}
```

`recipes/pizza_dough.json` (shaped so the result can be an array; the empty bucket comes back like vanilla cake):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shaped": {
    "description": { "identifier": "foodcraft:pizza_dough" },
    "tags": ["crafting_table"],
    "pattern": ["FFF", " W "],
    "key": {
      "F": { "item": "foodcraft:flour" },
      "W": { "item": "minecraft:water_bucket" }
    },
    "unlock": [{ "item": "foodcraft:flour" }],
    "result": [
      { "item": "foodcraft:pizza_dough" },
      { "item": "minecraft:bucket", "count": 1, "data": 0 }
    ]
  }
}
```

`recipes/mozzarella.json` (shaped 1x1, bucket returned):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shaped": {
    "description": { "identifier": "foodcraft:mozzarella" },
    "tags": ["crafting_table"],
    "pattern": ["M"],
    "key": {
      "M": { "item": "minecraft:milk_bucket" }
    },
    "unlock": [{ "item": "minecraft:milk_bucket" }],
    "result": [
      { "item": "foodcraft:mozzarella" },
      { "item": "minecraft:bucket", "count": 1, "data": 0 }
    ]
  }
}
```

If the Content Log reports an unknown item for `minecraft:milk_bucket`, replace that key with `{ "item": "minecraft:bucket", "data": 1 }` (the form vanilla `cake.json` uses). If it reports `minecraft:water_bucket`, stop and report; do not guess a data value.

- [ ] **Step 4: Atlas entries and names**

Add to `item_texture.json` `texture_data` (one entry per new item, same pattern as `foodcraft_tomato`):
`foodcraft_garlic`, `foodcraft_oregano`, `foodcraft_pineapple`, `foodcraft_tomato_seeds`, `foodcraft_oregano_seeds`, `foodcraft_pineapple_crown`, `foodcraft_flour`, `foodcraft_pizza_dough`, `foodcraft_tomato_sauce`, `foodcraft_mozzarella`, `foodcraft_pepperoni`, `foodcraft_ham`, each mapping to `textures/items/<same name>`.

Append to `en_US.lang`:

```
item.foodcraft.garlic.name=Garlic
item.foodcraft.oregano.name=Oregano
item.foodcraft.pineapple.name=Pineapple
item.foodcraft.tomato_seeds.name=Tomato Seeds
item.foodcraft.oregano_seeds.name=Oregano Seeds
item.foodcraft.pineapple_crown.name=Pineapple Crown
item.foodcraft.flour.name=Flour
item.foodcraft.pizza_dough.name=Pizza Dough
item.foodcraft.tomato_sauce.name=Tomato Sauce
item.foodcraft.mozzarella.name=Mozzarella
item.foodcraft.pepperoni.name=Pepperoni
item.foodcraft.ham.name=Ham
```

- [ ] **Step 5: Checklist lines**

Add under `## Items` in `docs/test-checklist.md` one `/give` line per new item (12 lines, same form as the tomato line), and a new section:

```markdown
## Recipes
- [ ] Flour: 1 wheat -> 1 flour
- [ ] Pizza dough: 3 flour over a water bucket -> dough, empty bucket stays in the grid output
- [ ] Tomato sauce: 2 tomato + garlic + oregano + bowl -> sauce
- [ ] Mozzarella: milk bucket -> mozzarella, empty bucket returned
- [ ] Pepperoni: raw porkchop + oregano -> pepperoni
- [ ] Ham: cooked porkchop -> 2 ham
```

- [ ] **Step 6: Deploy and verify in game**

1. `tools\deploy.ps1`, re-enter the world (item and recipe JSON needs a world reload, `/reload` is for scripts).
2. Content Log clean.
3. `/give @s foodcraft:<each item>` shows the right name and placeholder texture (12 items).
4. `/give @s minecraft:wheat 3`, `/give @s minecraft:water_bucket`, `/give @s minecraft:milk_bucket`, `/give @s minecraft:bowl`, `/give @s minecraft:porkchop`, `/give @s minecraft:cooked_porkchop`, `/give @s foodcraft:tomato 2`, place a crafting table and craft all six recipes. Both bucket recipes leave an empty bucket.
5. Tick the lines.

- [ ] **Step 7: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add produce and ingredient items with recipes"
```

---

### Task 4: Pizzas, script module and the nausea joke

Build order step 3. Kid session. First script file; Claude writes `food.js` with them.

**Files:**
- Create: `packs/foodcraft_bp/items/raw_pizza_{margherita,pepperoni,prosciutto,hawaii}.json`
- Create: `packs/foodcraft_bp/items/pizza_{margherita,pepperoni,prosciutto,hawaii}.json`
- Create: `packs/foodcraft_bp/recipes/raw_pizza_{margherita,pepperoni,prosciutto,hawaii}.json`
- Create: `packs/foodcraft_bp/scripts/main.js`, `packs/foodcraft_bp/scripts/food.js`
- Modify: `packs/foodcraft_bp/manifest.json`, `item_texture.json`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Produces: item ids `foodcraft:raw_pizza_<name>` and `foodcraft:pizza_<name>` for `margherita|pepperoni|prosciutto|hawaii`. Task 5's oven derives the pizza type from the raw id by stripping `foodcraft:raw_pizza_`.
- Produces: `scripts/main.js` as the single entry; later tasks add one `import` line each.

- [ ] **Step 1: Raw pizza items**

`items/raw_pizza_margherita.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "foodcraft:raw_pizza_margherita",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "foodcraft_raw_pizza_margherita" } },
      "minecraft:display_name": { "value": "item.foodcraft.raw_pizza_margherita.name" },
      "minecraft:max_stack_size": 16,
      "minecraft:food": { "nutrition": 3, "saturation_modifier": 0.3, "can_always_eat": true },
      "minecraft:use_animation": { "value": "eat" },
      "minecraft:use_modifiers": { "start_using": "always", "use_duration": 1.6, "movement_modifier": 0.35 },
      "minecraft:tags": { "tags": ["minecraft:is_food"] }
    }
  }
}
```

Repeat for `pepperoni`, `prosciutto`, `hawaii` (identifier, icon and lang key all use `raw_pizza_<name>`).

- [ ] **Step 2: Baked pizza items**

Same shape with the baked values. `items/pizza_margherita.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "foodcraft:pizza_margherita",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "foodcraft_pizza_margherita" } },
      "minecraft:display_name": { "value": "item.foodcraft.pizza_margherita.name" },
      "minecraft:max_stack_size": 16,
      "minecraft:food": { "nutrition": 12, "saturation_modifier": 0.8 },
      "minecraft:use_animation": { "value": "eat" },
      "minecraft:use_modifiers": { "start_using": "always", "use_duration": 1.6, "movement_modifier": 0.35 },
      "minecraft:tags": { "tags": ["minecraft:is_food"] }
    }
  }
}
```

Repeat for `pepperoni`, `prosciutto`, `hawaii`. Nutrition 12 with saturation modifier 0.8 gives 19.2 saturation, above the vanilla maximum (golden carrot 6 / 14.4).

- [ ] **Step 3: Raw pizza recipes**

`recipes/raw_pizza_margherita.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "foodcraft:raw_pizza_margherita" },
    "tags": ["crafting_table"],
    "ingredients": [
      { "item": "foodcraft:pizza_dough" },
      { "item": "foodcraft:tomato_sauce" },
      { "item": "foodcraft:mozzarella" },
      { "item": "foodcraft:oregano" }
    ],
    "unlock": [{ "item": "foodcraft:pizza_dough" }],
    "result": { "item": "foodcraft:raw_pizza_margherita" }
  }
}
```

The other three replace the fourth ingredient:

| File | identifier | ingredients after dough + sauce + mozzarella |
|---|---|---|
| `raw_pizza_pepperoni.json` | `foodcraft:raw_pizza_pepperoni` | `foodcraft:pepperoni` |
| `raw_pizza_prosciutto.json` | `foodcraft:raw_pizza_prosciutto` | `foodcraft:ham` |
| `raw_pizza_hawaii.json` | `foodcraft:raw_pizza_hawaii` | `foodcraft:ham`, `foodcraft:pineapple` |

- [ ] **Step 4: Script module in the manifest**

Replace `packs/foodcraft_bp/manifest.json` `modules` and `dependencies` with:

```json
  "modules": [
    {
      "description": "Foodcraft data",
      "type": "data",
      "uuid": "b1a3afbc-9ffe-4882-a249-c29badf31a8f",
      "version": [0, 1, 0]
    },
    {
      "description": "Foodcraft scripts",
      "type": "script",
      "language": "javascript",
      "uuid": "c9db88ff-e049-4f1c-b4d4-fdab77690e4a",
      "version": [0, 1, 0],
      "entry": "scripts/main.js"
    }
  ],
  "dependencies": [
    {
      "uuid": "21c9e746-cd73-41fd-a163-83955769e6c2",
      "version": [0, 1, 0]
    },
    {
      "module_name": "@minecraft/server",
      "version": "2.11.0"
    }
  ]
```

- [ ] **Step 5: Scripts**

`scripts/food.js`:

```js
import { world } from "@minecraft/server";

const RAW_PIZZA_PREFIX = "foodcraft:raw_pizza_";
const NAUSEA_TICKS = 200; // 10 seconds

// The joke from the spec: raw pizza is edible but makes you queasy.
world.afterEvents.itemCompleteUse.subscribe((event) => {
  if (!event.itemStack.typeId.startsWith(RAW_PIZZA_PREFIX)) return;
  event.source.addEffect("minecraft:nausea", NAUSEA_TICKS, { showParticles: false });
});
```

`scripts/main.js`:

```js
import "./food.js";
```

- [ ] **Step 6: Atlas, names, checklist**

Add eight `item_texture.json` entries: `foodcraft_raw_pizza_<name>` and `foodcraft_pizza_<name>` -> `textures/items/<same>`.

Append to `en_US.lang`:

```
item.foodcraft.raw_pizza_margherita.name=Raw Pizza Margherita
item.foodcraft.raw_pizza_pepperoni.name=Raw Pizza Pepperoni
item.foodcraft.raw_pizza_prosciutto.name=Raw Pizza Prosciutto
item.foodcraft.raw_pizza_hawaii.name=Raw Pizza Hawaii
item.foodcraft.pizza_margherita.name=Pizza Margherita
item.foodcraft.pizza_pepperoni.name=Pizza Pepperoni
item.foodcraft.pizza_prosciutto.name=Pizza Prosciutto
item.foodcraft.pizza_hawaii.name=Pizza Hawaii
```

Checklist: eight `/give` item lines, four recipe lines (`Raw pizza <name>: dough + sauce + mozzarella + <topping>`), and a new section:

```markdown
## Pizzas
- [ ] Eating a raw pizza (any kind) gives Nausea for 10 s (screen wobbles, effect icon shows)
- [ ] Eating a baked pizza fills the hunger bar from empty to full with saturation to spare
```

- [ ] **Step 7: Deploy and verify in game**

1. Deploy, re-enter the world (manifest changed).
2. Content Log clean. If it says the `@minecraft/server` version `2.11.0` is not available, the game is older than 1.26.60: update Minecraft, do not change the version.
3. `/give @s foodcraft:raw_pizza_margherita` and eat it: Nausea appears for 10 seconds.
4. `/gamemode s`, empty hunger (`/effect @s hunger 30 255` then wait), eat `foodcraft:pizza_hawaii`: bar fills completely.
5. Craft all four raw pizzas at a crafting table.
6. Edit `food.js` to a 2-second nausea, run `/reload`, eat again, confirm the shorter effect, then restore 200 ticks and `/reload` again. This teaches the kids the script loop.
7. Tick the lines.

- [ ] **Step 8: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add raw and baked pizzas with the raw pizza nausea script"
```

---

### Task 5: Pizza oven block and behaviour (placeholder cube)

Build order step 4. Two kid sessions: (a) block JSON + recipe, playable as a decorative block; (b) `oven.js` with all edge cases from spec 4.2. Claude writes most of `oven.js`.

**Files:**
- Create: `packs/foodcraft_bp/blocks/pizza_oven.json`
- Create: `packs/foodcraft_bp/recipes/pizza_oven.json`
- Create: `packs/foodcraft_bp/scripts/oven.js`
- Create: `packs/foodcraft_rp/textures/terrain_texture.json`
- Create: `packs/foodcraft_rp/blocks.json`
- Modify: `scripts/main.js`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Block `foodcraft:pizza_oven` with states `foodcraft:stage` in `["empty", "baking", "done"]` and `foodcraft:pizza` in `["none", "margherita", "pepperoni", "prosciutto", "hawaii"]`, plus `minecraft:cardinal_direction` from the placement trait.
- Custom component id `foodcraft:pizza_oven` registered in `oven.js`. Task 6 swaps only the geometry and material instances; states and script stay.

- [ ] **Step 1: Block JSON**

`blocks/pizza_oven.json`. The front face is the model's `north` face; the placement trait plus `minecraft:transformation` turns it toward the player (same pattern as the official `fabricator.block.json` sample).

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:pizza_oven",
      "menu_category": { "category": "construction" },
      "traits": {
        "minecraft:placement_direction": { "enabled_states": ["minecraft:cardinal_direction"] }
      },
      "states": {
        "foodcraft:stage": ["empty", "baking", "done"],
        "foodcraft:pizza": ["none", "margherita", "pepperoni", "prosciutto", "hawaii"]
      }
    },
    "components": {
      "minecraft:geometry": "minecraft:geometry.full_block",
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_oven_side", "render_method": "opaque" },
        "up": { "texture": "foodcraft_oven_top", "render_method": "opaque" },
        "north": { "texture": "foodcraft_oven_front_empty", "render_method": "opaque" }
      },
      "minecraft:collision_box": true,
      "minecraft:selection_box": true,
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 3.5 },
      "minecraft:destructible_by_explosion": { "explosion_resistance": 6 },
      "minecraft:map_color": "#8a4a2e",
      "minecraft:tick": { "interval_range": [10, 10], "looping": true },
      "foodcraft:pizza_oven": {}
    },
    "permutations": [
      {
        "condition": "q.block_state('minecraft:cardinal_direction') == 'north'",
        "components": { "minecraft:transformation": { "rotation": [0, 180, 0] } }
      },
      {
        "condition": "q.block_state('minecraft:cardinal_direction') == 'south'",
        "components": { "minecraft:transformation": { "rotation": [0, 0, 0] } }
      },
      {
        "condition": "q.block_state('minecraft:cardinal_direction') == 'east'",
        "components": { "minecraft:transformation": { "rotation": [0, 90, 0] } }
      },
      {
        "condition": "q.block_state('minecraft:cardinal_direction') == 'west'",
        "components": { "minecraft:transformation": { "rotation": [0, 270, 0] } }
      },
      {
        "condition": "q.block_state('foodcraft:stage') == 'baking'",
        "components": {
          "minecraft:light_emission": 10,
          "minecraft:material_instances": {
            "*": { "texture": "foodcraft_oven_side", "render_method": "opaque" },
            "up": { "texture": "foodcraft_oven_top", "render_method": "opaque" },
            "north": { "texture": "foodcraft_oven_front_baking", "render_method": "opaque" }
          }
        }
      },
      {
        "condition": "q.block_state('foodcraft:stage') == 'done'",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "foodcraft_oven_side", "render_method": "opaque" },
            "up": { "texture": "foodcraft_oven_top", "render_method": "opaque" },
            "north": { "texture": "foodcraft_oven_front_done", "render_method": "opaque" }
          }
        }
      }
    ]
  }
}
```

- [ ] **Step 2: Recipe, textures, names**

`recipes/pizza_oven.json` (bricks around a furnace, stone along the bottom):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shaped": {
    "description": { "identifier": "foodcraft:pizza_oven" },
    "tags": ["crafting_table"],
    "pattern": ["BBB", "BFB", "SSS"],
    "key": {
      "B": { "item": "minecraft:brick_block" },
      "F": { "item": "minecraft:furnace" },
      "S": { "item": "minecraft:stone" }
    },
    "unlock": [{ "item": "minecraft:furnace" }],
    "result": { "item": "foodcraft:pizza_oven" }
  }
}
```

`packs/foodcraft_rp/textures/terrain_texture.json`:

```json
{
  "resource_pack_name": "foodcraft_rp",
  "texture_name": "atlas.terrain",
  "padding": 8,
  "num_mip_levels": 4,
  "texture_data": {
    "foodcraft_oven_side": { "textures": "textures/blocks/foodcraft_oven_side" },
    "foodcraft_oven_top": { "textures": "textures/blocks/foodcraft_oven_top" },
    "foodcraft_oven_front_empty": { "textures": "textures/blocks/foodcraft_oven_front_empty" },
    "foodcraft_oven_front_baking": { "textures": "textures/blocks/foodcraft_oven_front_baking" },
    "foodcraft_oven_front_done": { "textures": "textures/blocks/foodcraft_oven_front_done" }
  }
}
```

`packs/foodcraft_rp/blocks.json`:

```json
{
  "format_version": "1.26.50",
  "foodcraft:pizza_oven": { "sound": "stone" }
}
```

Append to `en_US.lang`: `tile.foodcraft:pizza_oven.name=Pizza Oven`

- [ ] **Step 3: Deploy the decorative oven (session a ends here)**

Deploy, re-enter. Content Log clean. `/give @s foodcraft:pizza_oven`, place it facing you from four sides: the front (texture with the oven mouth) faces the player each time. If it faces away, swap the `north` and `south` rotation values in the two permutations. Craft one from 6 bricks blocks, a furnace and 3 stone. Add checklist lines:

```markdown
## Oven
- [ ] Oven recipe: BBB / BFB / SSS (brick block, furnace, stone) -> pizza oven
- [ ] Placed oven faces the player
```

Commit: `git commit -am "Add pizza oven block and recipe"` (after `git add packs`).

- [ ] **Step 4: Oven script**

`scripts/oven.js`:

```js
import { system, ItemStack, GameMode, EquipmentSlot, EntityComponentTypes, Direction } from "@minecraft/server";

const OVEN_ID = "foodcraft:pizza_oven";
const RAW_PREFIX = "foodcraft:raw_pizza_";
const BAKED_PREFIX = "foodcraft:pizza_";
const PIZZAS = ["margherita", "pepperoni", "prosciutto", "hawaii"];
const BAKE_TICKS = 200; // 10 seconds
const DING_SOUND = "random.orb"; // Task 10 swaps this for the custom ding

// Bake timers by block position. Lost on world close; onTick restarts them (spec 4.2).
const timers = new Map();

function keyOf(block) {
  return `${block.dimension.id}:${block.x},${block.y},${block.z}`;
}

function stageOf(block) {
  return block.permutation.getState("foodcraft:stage");
}

function pizzaOf(block) {
  return block.permutation.getState("foodcraft:pizza");
}

function setOven(block, stage, pizza) {
  block.setPermutation(block.permutation.withState("foodcraft:stage", stage).withState("foodcraft:pizza", pizza));
}

function faceOffset(face) {
  switch (face) {
    case Direction.North: return { x: 0, y: 0, z: -1 };
    case Direction.South: return { x: 0, y: 0, z: 1 };
    case Direction.East: return { x: 1, y: 0, z: 0 };
    case Direction.West: return { x: -1, y: 0, z: 0 };
    case Direction.Up: return { x: 0, y: 1, z: 0 };
    default: return { x: 0, y: -1, z: 0 };
  }
}

function dropAt(block, itemStack, offset = { x: 0, y: 1, z: 0 }) {
  const c = block.center();
  block.dimension.spawnItem(itemStack, { x: c.x + offset.x, y: c.y + offset.y, z: c.z + offset.z });
}

function startBakeTimer(block) {
  const key = keyOf(block);
  if (timers.has(key)) return;
  const dimension = block.dimension;
  const location = { x: block.x, y: block.y, z: block.z };
  const runId = system.runTimeout(() => {
    timers.delete(key);
    const oven = dimension.getBlock(location);
    if (!oven || oven.typeId !== OVEN_ID || stageOf(oven) !== "baking") return;
    setOven(oven, "done", pizzaOf(oven));
    dimension.playSound(DING_SOUND, oven.center());
  }, BAKE_TICKS);
  timers.set(key, runId);
}

function cancelBakeTimer(block) {
  const key = keyOf(block);
  const runId = timers.get(key);
  if (runId !== undefined) {
    system.clearRun(runId);
    timers.delete(key);
  }
}

function heldRawPizza(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!held || !held.typeId.startsWith(RAW_PREFIX)) return undefined;
  const pizza = held.typeId.slice(RAW_PREFIX.length);
  return PIZZAS.includes(pizza) ? { equippable, held, pizza } : undefined;
}

function takeOneFromHand(player, equippable, held) {
  if (player.getGameMode() === GameMode.Creative) return;
  if (held.amount > 1) {
    held.amount -= 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  } else {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}

function giveOrDrop(player, block, face, itemStack) {
  const inventory = player.getComponent(EntityComponentTypes.Inventory);
  const leftover = inventory?.container ? inventory.container.addItem(itemStack) : itemStack;
  if (leftover) dropAt(block, leftover, faceOffset(face)); // inventory full: drop in front of the oven
}

export const pizzaOvenComponent = {
  onPlayerInteract(event) {
    const { block, player, face } = event;
    if (!player) return;
    const stage = stageOf(block);

    if (stage === "baking") {
      player.onScreenDisplay.setActionBar("Still baking…");
      return;
    }
    if (stage === "done") {
      const pizza = pizzaOf(block);
      setOven(block, "empty", "none"); // state change first: a second click sees "empty"
      giveOrDrop(player, block, face, new ItemStack(BAKED_PREFIX + pizza, 1));
      return;
    }
    const hand = heldRawPizza(player);
    if (!hand) {
      player.onScreenDisplay.setActionBar("Put a raw pizza in the oven");
      return;
    }
    takeOneFromHand(player, hand.equippable, hand.held);
    setOven(block, "baking", hand.pizza);
    startBakeTimer(block);
  },

  onTick(event) {
    const { block } = event;
    if (stageOf(block) !== "baking") return;
    startBakeTimer(block); // no-op while a timer runs; restarts the bake after a world reload
    const c = block.center();
    block.dimension.spawnParticle("minecraft:basic_smoke_particle", { x: c.x, y: c.y + 0.6, z: c.z });
  },

  onPlayerBreak(event) {
    const { block, brokenBlockPermutation } = event;
    cancelBakeTimer(block);
    const stage = brokenBlockPermutation.getState("foodcraft:stage");
    const pizza = brokenBlockPermutation.getState("foodcraft:pizza");
    if (stage === "baking") dropAt(block, new ItemStack(RAW_PREFIX + pizza, 1));
    if (stage === "done") dropAt(block, new ItemStack(BAKED_PREFIX + pizza, 1));
  },
};
```

`scripts/main.js` becomes:

```js
import { system } from "@minecraft/server";
import "./food.js";
import { pizzaOvenComponent } from "./oven.js";

system.beforeEvents.startup.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("foodcraft:pizza_oven", pizzaOvenComponent);
});
```

- [ ] **Step 5: Checklist lines for spec 4.2**

Append under `## Oven`:

```markdown
- [ ] Right-click empty oven with raw pizza: pizza taken, oven glows (light 10) and smokes
- [ ] After 10 s: ding sound, front texture shows a pizza
- [ ] Right-click done oven: get the matching baked pizza, oven empty again
- [ ] Right-click empty oven with anything else: action bar "Put a raw pizza in the oven", nothing consumed
- [ ] Right-click while baking: action bar "Still baking…"
- [ ] Break oven while baking: drops oven + raw pizza
- [ ] Break oven while done: drops oven + baked pizza
- [ ] Start baking, Save & Quit, re-enter: oven still baking, finishes within 10 s of entering
- [ ] Two players click a done oven at once (second account or split screen): only one baked pizza comes out
- [ ] Creative mode: raw pizza stack does not shrink
- [ ] Survival mode: raw pizza stack shrinks by one
- [ ] Fill inventory (`/give @s dirt 64` until full), take out a baked pizza: it drops in front of the oven
- [ ] Pizza left in a done oven for 5 minutes is still there
```

- [ ] **Step 6: Deploy and verify in game**

1. Deploy, re-enter (block JSON and manifest-registered component changed). Content Log clean: a wrong hook name or a missing `minecraft:tick` shows here as a component error.
2. Run every line of the `## Oven` list above, in survival for the consumption lines. `/gamerule sendcommandfeedback` is not needed; `/gamemode s` and `/gamemode c` switch modes.
3. If right-clicking the oven with a raw pizza starts eating instead of baking, report it; the fix would change the raw pizza item (not the oven) and is a plan change.
4. Tick the lines.

- [ ] **Step 7: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add pizza oven baking script with all edge cases"
```

---

### Task 6: Oven model in Blockbench

Build order step 4, art half. Kid session in Blockbench. The block keeps every state and script from Task 5.

**Files:**
- Create: `packs/foodcraft_rp/models/blocks/pizza_oven.geo.json` (exported from Blockbench)
- Create: `packs/foodcraft_rp/textures/blocks/foodcraft_pizza_oven.png` (the model's texture sheet, painted in Blockbench)
- Modify: `packs/foodcraft_bp/blocks/pizza_oven.json`, `terrain_texture.json`

**Interfaces:**
- Geometry identifier `geometry.foodcraft_pizza_oven`, bones named exactly: `body`, `flame`, `pizza_margherita`, `pizza_pepperoni`, `pizza_prosciutto`, `pizza_hawaii`. Bone visibility is driven by the block states from Task 5.

- [ ] **Step 1: Model in Blockbench**

1. A draft is ready: File > Open Model > `art/models/pizza_oven_open.bbmodel` (identifier `geometry.foodcraft_pizza_oven`, texture `art/textures/blocks/pizza_oven.png`, 64x64). It has a brick body with a stepped dome and chimney (`body`), an open mouth on the north face (-Z), logs and flames inside the mouth (`flame`), and four flat pizza discs (`pizza_<name>`), one bone each, at the same spot on the oven floor. The bricks and top come from `pizza_oven_side.png` and `pizza_oven_top.png`; the pizzas use the pizza item textures. Click the eye icons to see the pizzas.
2. Change what you like. Keep the six bone names exactly as they are.
3. Paint the texture in Blockbench's paint tab if you want. Save the texture as `foodcraft_pizza_oven.png` into `packs/foodcraft_rp/textures/blocks/` (and over `art/textures/blocks/pizza_oven.png`).
4. File > Export > Export Bedrock Geometry to `packs/foodcraft_rp/models/blocks/pizza_oven.geo.json`.

- [ ] **Step 2: Point the block at the model**

In `blocks/pizza_oven.json` replace the base `minecraft:geometry` and `minecraft:material_instances` with:

```json
      "minecraft:geometry": {
        "identifier": "geometry.foodcraft_pizza_oven",
        "bone_visibility": {
          "flame": "q.block_state('foodcraft:stage') == 'baking'",
          "pizza_margherita": "q.block_state('foodcraft:stage') == 'done' && q.block_state('foodcraft:pizza') == 'margherita'",
          "pizza_pepperoni": "q.block_state('foodcraft:stage') == 'done' && q.block_state('foodcraft:pizza') == 'pepperoni'",
          "pizza_prosciutto": "q.block_state('foodcraft:stage') == 'done' && q.block_state('foodcraft:pizza') == 'prosciutto'",
          "pizza_hawaii": "q.block_state('foodcraft:stage') == 'done' && q.block_state('foodcraft:pizza') == 'hawaii'"
        }
      },
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_pizza_oven", "render_method": "alpha_test" }
      },
```

Delete the `baking` and `done` permutations' `minecraft:material_instances` blocks (keep the `baking` permutation with only `minecraft:light_emission: 10`; delete the `done` permutation entirely). Keep the four rotation permutations.

Add to `terrain_texture.json`: `"foodcraft_pizza_oven": { "textures": "textures/blocks/foodcraft_pizza_oven" }`.

- [ ] **Step 3: Deploy and verify in game**

Deploy, re-enter. Content Log clean (a bone name typo shows as a bone_visibility warning). Place the oven: model shows, mouth faces the player. Bake each of the four pizzas: flame visible while baking, the right pizza disc visible when done, nothing inside when empty. Add and tick:

```markdown
- [ ] Oven model: flame shows while baking, correct pizza shows when done, empty when empty (all four pizzas)
```

- [ ] **Step 4: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add Blockbench pizza oven model with state-driven bones"
```

---

### Task 7: Crops (seeds, growth, bone meal, harvest)

Build order step 5, first half. Two kid sessions: (a) oregano crop end to end, (b) garlic by copying. Tomato and pineapple ripen fruit after growing, so they get their own task (Task 8).

**Files:**
- Create: `packs/foodcraft_bp/blocks/{oregano,garlic}_crop.json`
- Create: `packs/foodcraft_bp/loot_tables/blocks/{oregano,garlic}_crop_seed.json` and `..._crop_mature.json`
- Create: `packs/foodcraft_bp/scripts/crop.js`
- Modify: `items/{oregano_seeds,garlic}.json`, `scripts/main.js`, `terrain_texture.json`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Blocks `foodcraft:<plant>_crop` with state `foodcraft:growth` in `[0, 1, 2, 3]`.
- Custom component id `foodcraft:crop` registered in `crop.js`; no parameters.
- Task 9 wild plants drop the seed items set up here.

- [ ] **Step 1: Oregano crop block**

`blocks/oregano_crop.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:oregano_crop",
      "menu_category": { "category": "none" },
      "states": { "foodcraft:growth": [0, 1, 2, 3] }
    },
    "components": {
      "minecraft:geometry": "minecraft:geometry.cross",
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_oregano_crop_0", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-7, 0, -7], "size": [14, 10, 14] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [{ "allowed_faces": ["up"], "block_filter": ["minecraft:farmland"] }]
      },
      "minecraft:loot": "loot_tables/blocks/oregano_crop_seed.json",
      "foodcraft:crop": {}
    },
    "permutations": [
      {
        "condition": "q.block_state('foodcraft:growth') == 1",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "foodcraft_oregano_crop_1", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
          }
        }
      },
      {
        "condition": "q.block_state('foodcraft:growth') == 2",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "foodcraft_oregano_crop_2", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
          }
        }
      },
      {
        "condition": "q.block_state('foodcraft:growth') == 3",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "foodcraft_oregano_crop_3", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
          },
          "minecraft:loot": "loot_tables/blocks/oregano_crop_mature.json"
        }
      }
    ]
  }
}
```

- [ ] **Step 2: Oregano loot tables**

`loot_tables/blocks/oregano_crop_seed.json` (immature: one seed):

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [{ "type": "item", "name": "foodcraft:oregano_seeds", "weight": 1 }]
    }
  ]
}
```

`loot_tables/blocks/oregano_crop_mature.json` (1–2 oregano + 1–2 seeds):

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "foodcraft:oregano",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 1, "max": 2 } }]
        }
      ]
    },
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "foodcraft:oregano_seeds",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 1, "max": 2 } }]
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Oregano seeds place the crop**

Add to `items/oregano_seeds.json` `components`:

```json
      "minecraft:block_placer": {
        "block": "foodcraft:oregano_crop",
        "use_on": ["minecraft:farmland"]
      }
```

- [ ] **Step 4: Crop script**

`scripts/crop.js`:

```js
import { GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

const GROWTH = "foodcraft:growth";
const MAX_GROWTH = 3;
const GROW_CHANCE = 0.34; // per random tick, roughly vanilla wheat pace
const BONE_MEAL = "minecraft:bone_meal";

function growthOf(block) {
  return block.permutation.getState(GROWTH);
}

function setGrowth(block, growth) {
  block.setPermutation(block.permutation.withState(GROWTH, Math.min(growth, MAX_GROWTH)));
}

// Takes one bone meal from the player's hand (none in creative). Returns false if the hand holds no bone meal.
export function useBoneMeal(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!held || held.typeId !== BONE_MEAL) return false;
  if (player.getGameMode() !== GameMode.Creative) {
    if (held.amount > 1) {
      held.amount -= 1;
      equippable.setEquipment(EquipmentSlot.Mainhand, held);
    } else {
      equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    }
  }
  return true;
}

export function boneMealEffects(block) {
  const c = block.center();
  block.dimension.spawnParticle("minecraft:crop_growth_emitter", c);
  block.dimension.playSound("item.bone_meal.use", c);
}

export const cropComponent = {
  onRandomTick(event) {
    const { block } = event;
    const growth = growthOf(block);
    if (growth >= MAX_GROWTH || Math.random() >= GROW_CHANCE) return;
    setGrowth(block, growth + 1);
  },

  onPlayerInteract(event) {
    const { block, player } = event;
    if (!player) return;
    const growth = growthOf(block);
    if (growth >= MAX_GROWTH || !useBoneMeal(player)) return;
    setGrowth(block, growth + 1 + Math.floor(Math.random() * 2)); // +1 or +2 stages
    boneMealEffects(block);
  },
};
```

`useBoneMeal` and `boneMealEffects` are exported because the fruit plant script (Task 8) uses them too.

In `scripts/main.js` add `import { cropComponent } from "./crop.js";` and inside the startup subscriber:

```js
  event.blockComponentRegistry.registerCustomComponent("foodcraft:crop", cropComponent);
```

- [ ] **Step 5: Textures and names for oregano**

Add to `terrain_texture.json`: `foodcraft_oregano_crop_0` … `foodcraft_oregano_crop_3` -> `textures/blocks/<same>`.
Append to `en_US.lang`: `tile.foodcraft:oregano_crop.name=Oregano Crop`.

- [ ] **Step 6: Deploy and verify the oregano crop (session a ends here)**

1. Deploy, re-enter. Content Log clean.
2. `/give @s foodcraft:oregano_seeds 8`, `/give @s minecraft:bone_meal 16`. Till dirt with a hoe. Seeds plant on farmland only; on grass nothing happens.
3. `/gamerule randomtickspeed 300`: crops visibly change texture through stages within a minute. Set back to `/gamerule randomtickspeed 1`. If no crop ever changes stage at 300, random ticks are not reaching the component: stop and report (that would be a plan change, not something to patch around).
4. Bone meal a stage-0 crop: jumps one or two stages, green particles, one bone meal used in survival, none in creative.
5. Break a stage-0/1/2 crop: one oregano seed only. Break a stage-3 crop: 1–2 oregano and 1–2 seeds.
6. Break the farmland under a crop: the crop pops off as a seed (placement_filter survivability).

Checklist section:

```markdown
## Crops
- [ ] Oregano seeds plant only on farmland
- [ ] Oregano crop grows through 4 stages on random ticks (randomtickspeed 300)
- [ ] Bone meal advances oregano crop and is consumed in survival
- [ ] Immature oregano crop drops 1 seed; mature drops 1–2 oregano + 1–2 seeds
- [ ] Crop pops off when its farmland is broken
```

Commit: `git add packs docs/test-checklist.md && git commit -m "Add oregano crop with growth, bone meal and harvest"`.

- [ ] **Step 7: Garlic crop (session b)**

Copy the three oregano files and change only the values below. The block JSON changes identifier, the four texture names and the two loot paths. Lang line `tile.foodcraft:garlic_crop.name=Garlic Crop`. Add the four `terrain_texture.json` entries `foodcraft_garlic_crop_<n>`.

| Plant | Block id | Seed item (gets `block_placer` with `use_on: ["minecraft:farmland"]`) | Immature loot | Mature loot |
|---|---|---|---|---|
| garlic | `foodcraft:garlic_crop` | `foodcraft:garlic` (planted directly, like potatoes) | 1 `foodcraft:garlic` | `foodcraft:garlic` count 2–4 (one pool) |

`loot_tables/blocks/garlic_crop_mature.json` in full, since it has one pool:

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "foodcraft:garlic",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 2, "max": 4 } }]
        }
      ]
    }
  ]
}
```

- [ ] **Step 8: Deploy and verify the garlic crop**

Deploy, re-enter, Content Log clean. Repeat the five checklist lines for garlic (add 5 lines). Garlic plants from the garlic item itself. Tick them.

- [ ] **Step 9: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add garlic crop"
```

---

### Task 8: Fruit plants: tomato and pineapple (grow, ripen, picked again and again)

Build order step 5, second half. Three kid sessions: (a) the models in Blockbench, (b) tomato blocks and script, (c) pineapple by reusing the tomato script.

Both plants grow first and then ripen fruit, more slowly. Using a ripe plant picks the fruit and leaves the plant standing; it flowers and ripens again. Breaking the plant gives its seed item (and the fruit if it was ripe).

- **Tomato:** grows fast to two blocks tall, then flowers and ripens: small green, green, orange, red. Picking gives 2–3 tomatoes.
- **Pineapple:** one block. A spiky leaf rosette grows slowly (small, medium, full), then a red flower spike rises from the middle and turns into a pineapple: small green, green, golden. Picking gives 1 pineapple and leaves a cut stalk.

**Files:**
- Create: `packs/foodcraft_rp/models/blocks/tomato_crop_lower.geo.json`, `tomato_crop_upper.geo.json`, `pineapple_crop.geo.json` (exported from Blockbench)
- Create: `packs/foodcraft_rp/textures/blocks/foodcraft_tomato_plant.png`, `foodcraft_pineapple_plant.png` (copies of `art/textures/blocks/tomato_plant.png` and `pineapple_plant.png`, 32x32)
- Create: `packs/foodcraft_bp/blocks/tomato_crop.json`, `tomato_crop_top.json`, `pineapple_crop.json`
- Create: `packs/foodcraft_bp/loot_tables/blocks/{tomato,pineapple}_crop_seed.json`, `{tomato,pineapple}_crop_mature.json`, `packs/foodcraft_bp/loot_tables/empty.json`
- Create: `packs/foodcraft_bp/scripts/fruit_plant.js`
- Modify: `items/tomato_seeds.json`, `items/pineapple_crown.json`, `scripts/main.js`, `terrain_texture.json`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Both plants have the same two states, and the script writes them:
  - `foodcraft:growth` in `[0, 1, 2]`: young, half-grown, full plant.
  - `foodcraft:fruit`, used only at growth 2. 0 is picked; 1 is flowers; the highest value is ripe. Reaching growth 2 sets fruit to 1, so fruit 0 at growth 2 only happens after picking.
    - Tomato: `[0, 1, 2, 3, 4, 5]` = picked, flowers, small green, green, orange, red.
    - Pineapple: `[0, 1, 2, 3, 4]` = picked, flower spike, small green, green, golden.
- Blocks: `foodcraft:tomato_crop` (lower, on farmland) and `foodcraft:tomato_crop_top` (upper, from growth 1; the script writes the states to both halves); `foodcraft:pineapple_crop` (one block).
- `scripts/fruit_plant.js` exports `fruitPlant(options)`, which returns a custom component. `main.js` registers it twice: `foodcraft:tomato` (on both tomato blocks) and `foodcraft:pineapple`.
- Geometry and bones (`art/README.md` has the table of which bone shows when):
  - `geometry.foodcraft_tomato_crop_lower` and `geometry.foodcraft_tomato_crop_upper`: `sprout`, `stake`, `foliage`, `flowers`, `tomatoes_small`, `tomatoes_green`, `tomatoes_turning`, `tomatoes_red`, `tomatoes_picked`.
  - `geometry.foodcraft_pineapple_crop`: `rosette_small`, `rosette_medium`, `rosette`, `stalk`, `flower`, `fruit_small`, `fruit_green`, `fruit_ripe`, `fruit_picked`.
- Task 9's wild tomato and wild pineapple drop `foodcraft:tomato_seeds` and `foodcraft:pineapple_crown`, which plant these crops.

- [ ] **Step 1: Models in Blockbench (session a)**

The draft models are in `art/models/` and already have every bone and their textures.

1. Blockbench: File > Open Model > `art/models/tomato_crop_lower.bbmodel`. The ripe plant shows; click the eye icons in the outliner to see the other stages.
2. Paint the texture if you want (Paint tab). Keep the bone names exactly as they are: the block JSON refers to them.
3. File > Export > Export Bedrock Geometry to `packs/foodcraft_rp/models/blocks/tomato_crop_lower.geo.json`. Save the texture over `art/textures/blocks/tomato_plant.png` if you painted it.
4. Same for `art/models/tomato_crop_upper.bbmodel` -> `tomato_crop_upper.geo.json` and `art/models/pineapple_crop.bbmodel` -> `pineapple_crop.geo.json` (texture `art/textures/blocks/pineapple_plant.png`).
5. Copy `art/textures/blocks/tomato_plant.png` to `packs/foodcraft_rp/textures/blocks/foodcraft_tomato_plant.png` and `art/textures/blocks/pineapple_plant.png` to `packs/foodcraft_rp/textures/blocks/foodcraft_pineapple_plant.png`.

Check: each exported `.geo.json` contains its `"identifier"` from the Interfaces list and the nine bone names.

- [ ] **Step 2: Tomato lower block (session b)**

`blocks/tomato_crop.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:tomato_crop",
      "menu_category": { "category": "none" },
      "states": {
        "foodcraft:growth": [0, 1, 2],
        "foodcraft:fruit": [0, 1, 2, 3, 4, 5]
      }
    },
    "components": {
      "minecraft:geometry": {
        "identifier": "geometry.foodcraft_tomato_crop_lower",
        "bone_visibility": {
          "sprout": "q.block_state('foodcraft:growth') == 0",
          "stake": "q.block_state('foodcraft:growth') >= 1",
          "foliage": "q.block_state('foodcraft:growth') >= 1",
          "flowers": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 1",
          "tomatoes_small": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 2",
          "tomatoes_green": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 3",
          "tomatoes_turning": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 4",
          "tomatoes_red": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 5",
          "tomatoes_picked": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 0"
        }
      },
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_tomato_plant", "render_method": "alpha_test", "ambient_occlusion": 0 }
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-6, 0, -6], "size": [12, 16, 12] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [{ "allowed_faces": ["up"], "block_filter": ["minecraft:farmland"] }]
      },
      "minecraft:loot": "loot_tables/blocks/tomato_crop_seed.json",
      "foodcraft:tomato": {}
    },
    "permutations": [
      {
        "condition": "q.block_state('foodcraft:growth') == 0",
        "components": {
          "minecraft:selection_box": { "origin": [-5, 0, -5], "size": [10, 7, 10] }
        }
      },
      {
        "condition": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 5",
        "components": {
          "minecraft:loot": "loot_tables/blocks/tomato_crop_mature.json"
        }
      }
    ]
  }
}
```

`render_method` is `alpha_test` (not `_single_sided`) so the leaf planes show from both sides.

- [ ] **Step 3: Tomato top block**

`blocks/tomato_crop_top.json`. Only the script places it. Its placement filter makes it pop off when the lower half is gone, and it drops nothing itself (the lower half carries the loot).

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:tomato_crop_top",
      "menu_category": { "category": "none" },
      "states": {
        "foodcraft:growth": [0, 1, 2],
        "foodcraft:fruit": [0, 1, 2, 3, 4, 5]
      }
    },
    "components": {
      "minecraft:geometry": {
        "identifier": "geometry.foodcraft_tomato_crop_upper",
        "bone_visibility": {
          "sprout": "q.block_state('foodcraft:growth') == 1",
          "stake": "q.block_state('foodcraft:growth') >= 1",
          "foliage": "q.block_state('foodcraft:growth') == 2",
          "flowers": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 1",
          "tomatoes_small": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 2",
          "tomatoes_green": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 3",
          "tomatoes_turning": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 4",
          "tomatoes_red": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 5",
          "tomatoes_picked": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 0"
        }
      },
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_tomato_plant", "render_method": "alpha_test", "ambient_occlusion": 0 }
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-6, 0, -6], "size": [12, 13, 12] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [{ "allowed_faces": ["up"], "block_filter": ["foodcraft:tomato_crop"] }]
      },
      "minecraft:loot": "loot_tables/empty.json",
      "foodcraft:tomato": {}
    }
  }
}
```

- [ ] **Step 4: Tomato loot tables and seeds**

`loot_tables/blocks/tomato_crop_seed.json` (anything but red: one seed):

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [{ "type": "item", "name": "foodcraft:tomato_seeds", "weight": 1 }]
    }
  ]
}
```

`loot_tables/blocks/tomato_crop_mature.json` (red plant broken: 2–3 tomatoes + 1–2 seeds):

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "foodcraft:tomato",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 2, "max": 3 } }]
        }
      ]
    },
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "foodcraft:tomato_seeds",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 1, "max": 2 } }]
        }
      ]
    }
  ]
}
```

`loot_tables/empty.json`:

```json
{ "pools": [] }
```

Add to `items/tomato_seeds.json` `components`:

```json
      "minecraft:block_placer": {
        "block": "foodcraft:tomato_crop",
        "use_on": ["minecraft:farmland"]
      }
```

- [ ] **Step 5: Fruit plant script**

`scripts/fruit_plant.js`:

```js
import { BlockPermutation, ItemStack } from "@minecraft/server";
import { useBoneMeal, boneMealEffects } from "./crop.js";

const GROWTH = "foodcraft:growth";
const FRUIT = "foodcraft:fruit";
const FULL = 2; // growth of the full plant

// Builds the custom component for one fruit plant.
// lower:  block id of the plant (the one on farmland)
// top:    block id of the upper half for a two-block plant, or undefined
// produce, count: item and [min, max] given when the ripe fruit is picked
// ripe:   fruit value of ripe fruit
// growChance, ripenChance: chance per random tick to grow / to ripen one stage
// pickSound: sound played when picking
export function fruitPlant({ lower, top, produce, count, ripe, growChance, ripenChance, pickSound }) {
  // The lower block carries the states that count.
  const lowerOf = (block) => (top && block.typeId === top ? block.below() : block);

  const read = (plant) => ({
    growth: plant.permutation.getState(GROWTH),
    fruit: plant.permutation.getState(FRUIT),
  });

  // A two-block plant needs air above (or its own top half) to grow.
  const roomAbove = (plant) => {
    if (!top) return true;
    const above = plant.above();
    return !!above && (above.isAir || above.typeId === top);
  };

  // Writes the states to the plant, and to the top half from growth 1.
  const write = (plant, growth, fruit) => {
    const states = { [GROWTH]: growth, [FRUIT]: fruit };
    plant.setPermutation(BlockPermutation.resolve(lower, states));
    if (top && growth >= 1 && roomAbove(plant)) {
      plant.above().setPermutation(BlockPermutation.resolve(top, states));
    }
  };

  // The next stage, or undefined when the fruit is ripe.
  const next = ({ growth, fruit }) => {
    if (growth < FULL) return { growth: growth + 1, fruit: growth + 1 === FULL ? 1 : 0 };
    if (fruit < ripe) return { growth, fruit: fruit + 1 };
    return undefined;
  };

  return {
    onRandomTick(event) {
      const plant = event.block;
      if (plant.typeId !== lower) return; // a top half never ticks the plant
      const now = read(plant);
      if (top && now.growth >= 1 && plant.above()?.isAir) write(plant, now.growth, now.fruit); // top half was lost: put it back
      const step = next(now);
      if (!step || !roomAbove(plant)) return;
      const chance = now.growth < FULL ? growChance : ripenChance;
      if (Math.random() >= chance) return;
      write(plant, step.growth, step.fruit);
    },

    onPlayerInteract(event) {
      const { block, player } = event;
      if (!player) return;
      const plant = lowerOf(block);
      if (plant?.typeId !== lower) return;
      const now = read(plant);

      // Ripe: pick the fruit, the plant stays.
      if (now.growth === FULL && now.fruit === ripe) {
        const [min, max] = count;
        const amount = min + Math.floor(Math.random() * (max - min + 1));
        block.dimension.spawnItem(new ItemStack(produce, amount), block.center());
        block.dimension.playSound(pickSound, block.center());
        write(plant, FULL, 0);
        return;
      }

      // Otherwise bone meal moves it one stage on.
      const step = next(now);
      if (!step || !roomAbove(plant) || !useBoneMeal(player)) return;
      write(plant, step.growth, step.fruit);
      boneMealEffects(block);
    },

    onPlayerBreak(event) {
      // Breaking a top half breaks the lower half too, so its loot drops.
      // (Breaking the lower half makes the top half pop off by its placement filter.)
      if (!top || event.brokenBlockPermutation.type.id !== top) return;
      const below = event.block.below();
      if (below?.typeId !== lower) return;
      const { x, y, z } = below.location;
      event.dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
    },
  };
}
```

In `scripts/main.js` add `import { fruitPlant } from "./fruit_plant.js";` and inside the startup subscriber:

```js
  event.blockComponentRegistry.registerCustomComponent(
    "foodcraft:tomato",
    fruitPlant({
      lower: "foodcraft:tomato_crop",
      top: "foodcraft:tomato_crop_top",
      produce: "foodcraft:tomato",
      count: [2, 3],
      ripe: 5,
      growChance: 0.5, // the plant grows fast...
      ripenChance: 0.2, // ...and the tomatoes ripen slowly
      pickSound: "block.sweet_berry_bush.pick",
    })
  );
```

Change `growChance` and `ripenChance` to tune the pace. At `randomtickspeed 1` a block gets a random tick about once a minute, so the tomato is full grown after about 4 minutes and red about 20 minutes later.

- [ ] **Step 6: Tomato texture and names**

Add to `terrain_texture.json`: `"foodcraft_tomato_plant": { "textures": "textures/blocks/foodcraft_tomato_plant" }`.
Append to `en_US.lang`:

```
tile.foodcraft:tomato_crop.name=Tomato Plant
tile.foodcraft:tomato_crop_top.name=Tomato Plant
```

Task 1's `foodcraft_tomato_crop_0` … `_3` textures are not used by the crop; `foodcraft_tomato_crop_3` stays as the source of the wild tomato texture.

- [ ] **Step 7: Deploy and verify the tomato (session b ends here)**

1. Deploy, re-enter. Content Log clean. A bone name that does not match the model shows here as a `bone_visibility` warning.
2. `/give @s foodcraft:tomato_seeds 8`, `/give @s minecraft:bone_meal 32`. Seeds plant on farmland only.
3. `/gamerule randomtickspeed 300`. The sprout grows a stake and a top half within seconds, then flowers, then small green, green, orange and red tomatoes, with the ripening visibly slower than the growing. Set back to `/gamerule randomtickspeed 1`.
4. Put a block of dirt right above a sprout: it stays a sprout. Remove the dirt: it grows again.
5. Bone meal a sprout: one stage per bone meal, all the way to red; one bone meal used in survival, none in creative; nothing used on a red plant.
6. Use (right-click) a red plant on either half: 2–3 tomatoes pop out, pick sound, the plant shows empty calyxes. With randomtickspeed 300 it flowers and ripens again.
7. Break the lower half of a red plant: the whole plant goes, 2–3 tomatoes + 1–2 seeds. Break the top half of another plant: the whole plant goes, 1 seed. Break the farmland under a plant: the whole plant pops off as 1 seed. (In creative, breaking the top half still drops the lower half's loot; that is expected.)

If `runCommand` in step 7 errors in the Content Log, check `Dimension.runCommand` in the `@minecraft/server` 2.11.0 docs and report; do not work around it.

Checklist:

```markdown
## Tomato plant
- [ ] Tomato seeds plant only on farmland
- [ ] Tomato plant grows two blocks tall, then flowers and ripens small green, green, orange, red (randomtickspeed 300)
- [ ] Tomato plant does not grow tall when the block above is taken
- [ ] Bone meal moves the tomato plant one stage and is consumed in survival
- [ ] Using a red plant gives 2–3 tomatoes, leaves empty calyxes, and the plant ripens again
- [ ] Breaking either half removes the whole plant; red drops 2–3 tomatoes + 1–2 seeds, otherwise 1 seed
- [ ] Tomato plant pops off when its farmland is broken
```

- [ ] **Step 8: Commit the tomato**

```bash
git add packs docs/test-checklist.md
git commit -m "Add two-block tomato plant that ripens and can be picked"
```

- [ ] **Step 9: Pineapple block (session c)**

`blocks/pineapple_crop.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:pineapple_crop",
      "menu_category": { "category": "none" },
      "states": {
        "foodcraft:growth": [0, 1, 2],
        "foodcraft:fruit": [0, 1, 2, 3, 4]
      }
    },
    "components": {
      "minecraft:geometry": {
        "identifier": "geometry.foodcraft_pineapple_crop",
        "bone_visibility": {
          "rosette_small": "q.block_state('foodcraft:growth') == 0",
          "rosette_medium": "q.block_state('foodcraft:growth') == 1",
          "rosette": "q.block_state('foodcraft:growth') == 2",
          "stalk": "q.block_state('foodcraft:growth') == 2",
          "flower": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 1",
          "fruit_small": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 2",
          "fruit_green": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 3",
          "fruit_ripe": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 4",
          "fruit_picked": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 0"
        }
      },
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_pineapple_plant", "render_method": "alpha_test", "ambient_occlusion": 0 }
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-7, 0, -7], "size": [14, 16, 14] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [{ "allowed_faces": ["up"], "block_filter": ["minecraft:farmland"] }]
      },
      "minecraft:loot": "loot_tables/blocks/pineapple_crop_seed.json",
      "foodcraft:pineapple": {}
    },
    "permutations": [
      {
        "condition": "q.block_state('foodcraft:growth') == 0",
        "components": {
          "minecraft:selection_box": { "origin": [-4, 0, -4], "size": [8, 5, 8] }
        }
      },
      {
        "condition": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 4",
        "components": {
          "minecraft:loot": "loot_tables/blocks/pineapple_crop_mature.json"
        }
      }
    ]
  }
}
```

Loot tables: `pineapple_crop_seed.json` is `tomato_crop_seed.json` with `foodcraft:pineapple_crown`. `pineapple_crop_mature.json` (golden plant broken) has two pools without `set_count`: `foodcraft:pineapple` and `foodcraft:pineapple_crown`, one of each.

Add to `items/pineapple_crown.json` `components`:

```json
      "minecraft:block_placer": {
        "block": "foodcraft:pineapple_crop",
        "use_on": ["minecraft:farmland"]
      }
```

Register the component in `scripts/main.js`, next to the tomato. No `top`: the pineapple is one block.

```js
  event.blockComponentRegistry.registerCustomComponent(
    "foodcraft:pineapple",
    fruitPlant({
      lower: "foodcraft:pineapple_crop",
      produce: "foodcraft:pineapple",
      count: [1, 1],
      ripe: 4,
      growChance: 0.25, // pineapples are slow at everything
      ripenChance: 0.15,
      pickSound: "block.sweet_berry_bush.pick",
    })
  );
```

Add to `terrain_texture.json`: `"foodcraft_pineapple_plant": { "textures": "textures/blocks/foodcraft_pineapple_plant" }`. Append to `en_US.lang`: `tile.foodcraft:pineapple_crop.name=Pineapple Plant`. Task 1's `foodcraft_pineapple_crop_3` stays as the source of the wild pineapple texture.

- [ ] **Step 10: Deploy and verify the pineapple**

1. Deploy, re-enter. Content Log clean.
2. `/give @s foodcraft:pineapple_crown 4`. Plants on farmland only.
3. `/gamerule randomtickspeed 300`: small, medium and full rosette, then a red flower spike, small green, green and golden pineapple. Set back to `/gamerule randomtickspeed 1`.
4. Bone meal moves one stage; nothing used on a golden plant.
5. Use a golden plant: 1 pineapple, pick sound, a cut stalk stays. It flowers and ripens again.
6. Break a golden plant: 1 pineapple + 1 crown. Break any other stage: 1 crown. Break the farmland under it: it pops off as 1 crown.

Checklist:

```markdown
## Pineapple plant
- [ ] Pineapple crown plants only on farmland
- [ ] Pineapple grows small, medium, full rosette, then flower spike, small green, green, golden (randomtickspeed 300)
- [ ] Bone meal moves the pineapple one stage and is consumed in survival
- [ ] Using a golden plant gives 1 pineapple, leaves a cut stalk, and the plant ripens again
- [ ] Breaking a golden plant drops 1 pineapple + 1 crown, otherwise 1 crown
- [ ] Pineapple plant pops off when its farmland is broken
```

- [ ] **Step 11: Commit the pineapple**

```bash
git add packs docs/test-checklist.md
git commit -m "Add pineapple plant that ripens and can be picked"
```

---

### Task 9: Wild plants with per-biome spawning

Build order step 6. Kid session. Tested in a new, non-flat world.

**Files:**
- Create: `packs/foodcraft_bp/blocks/wild_{tomato,garlic,oregano,pineapple}.json`
- Create: `packs/foodcraft_bp/loot_tables/blocks/wild_{tomato,garlic,oregano,pineapple}.json`
- Create: `packs/foodcraft_bp/features/wild_{plant}_block.json` and `features/wild_{plant}_patch.json` (4 plants, 8 files)
- Create: `packs/foodcraft_bp/feature_rules/wild_{plant}_rule.json` (4 files)
- Modify: `terrain_texture.json`, `en_US.lang`, `blocks.json`, `docs/test-checklist.md`

**Interfaces:**
- Blocks `foodcraft:wild_<plant>`; feature ids `foodcraft:wild_<plant>_block`, `foodcraft:wild_<plant>_patch`; rule ids `foodcraft:wild_<plant>_rule`. File names must equal the part after the colon.

- [ ] **Step 1: Wild tomato block**

`blocks/wild_tomato.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "foodcraft:wild_tomato",
      "menu_category": { "category": "nature" }
    },
    "components": {
      "minecraft:geometry": "minecraft:geometry.cross",
      "minecraft:material_instances": {
        "*": { "texture": "foodcraft_wild_tomato", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-7, 0, -7], "size": [14, 12, 14] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [
          {
            "allowed_faces": ["up"],
            "block_filter": ["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:moss_block", "minecraft:farmland"]
          }
        ]
      },
      "minecraft:loot": "loot_tables/blocks/wild_tomato.json"
    }
  }
}
```

`loot_tables/blocks/wild_tomato.json`:

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "foodcraft:tomato_seeds",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 1, "max": 2 } }]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Wild tomato features and rule**

`features/wild_tomato_block.json`:

```json
{
  "format_version": "1.21.10",
  "minecraft:single_block_feature": {
    "description": { "identifier": "foodcraft:wild_tomato_block" },
    "places_block": "foodcraft:wild_tomato",
    "enforce_placement_rules": true,
    "enforce_survivability_rules": true,
    "may_replace": ["minecraft:air"],
    "may_attach_to": { "bottom": ["minecraft:grass_block"] }
  }
}
```

`features/wild_tomato_patch.json`:

```json
{
  "format_version": "1.21.10",
  "minecraft:scatter_feature": {
    "description": { "identifier": "foodcraft:wild_tomato_patch" },
    "places_feature": "foodcraft:wild_tomato_block",
    "project_input_to_floor": true,
    "distribution": {
      "iterations": 4,
      "x": { "distribution": "uniform", "extent": [0, 15] },
      "y": 0,
      "z": { "distribution": "uniform", "extent": [0, 15] }
    }
  }
}
```

`feature_rules/wild_tomato_rule.json`:

```json
{
  "format_version": "1.13.0",
  "minecraft:feature_rules": {
    "description": {
      "identifier": "foodcraft:wild_tomato_rule",
      "places_feature": "foodcraft:wild_tomato_patch"
    },
    "conditions": {
      "placement_pass": "surface_pass",
      "minecraft:biome_filter": [
        { "test": "has_biome_tag", "operator": "==", "value": "overworld" },
        { "test": "has_biome_tag", "operator": "==", "value": "plains" }
      ]
    },
    "distribution": {
      "iterations": 1,
      "scatter_chance": 35.0,
      "coordinate_eval_order": "zxy",
      "x": 0,
      "y": "query.heightmap(variable.worldx, variable.worldz)",
      "z": 0
    }
  }
}
```

- [ ] **Step 3: The other three wild plants**

Copy the five tomato files per plant; change identifiers, texture, loot item, and the biome filter:

| Plant | Loot item (count 1–2 unless noted) | Biome filter after the `overworld` test |
|---|---|---|
| garlic | `foodcraft:garlic` | `{ "test": "has_biome_tag", "operator": "==", "value": "forest" }` |
| oregano | `foodcraft:oregano_seeds` | `{ "any_of": [ { "test": "has_biome_tag", "operator": "==", "value": "meadow" }, { "test": "has_biome_tag", "operator": "==", "value": "plains" } ] }` |
| pineapple | `foodcraft:pineapple_crown`, fixed count 1 (no `set_count`) | `{ "test": "has_biome_tag", "operator": "==", "value": "jungle" }` |

Add `terrain_texture.json` entries `foodcraft_wild_<plant>` -> `textures/blocks/<same>`, lang lines `tile.foodcraft:wild_<plant>.name=Wild <Plant>`, and in `blocks.json` give each wild block and each crop block `{ "sound": "grass" }`.

- [ ] **Step 4: Deploy and verify in a new world**

1. Deploy. Create a new world "Foodcraft Wild": Infinite (not flat), Creative, cheats on, both packs active. Features only generate in new chunks.
2. Content Log clean. A wrong file name vs identifier shows here.
3. `/locate biome plains`, `/tp` there, fly around: wild tomatoes appear in small patches on grass. Same for `forest` (garlic), `meadow` (oregano), `jungle` (pineapple).
4. Break a wild tomato: 1–2 tomato seeds. Break a wild pineapple: 1 crown.
5. `/give @s foodcraft:wild_tomato` and place it on grass and on stone: grass works, stone does not.

Checklist:

```markdown
## Wild plants (new world)
- [ ] Wild tomato spawns in plains, drops 1–2 tomato seeds
- [ ] Wild garlic spawns in forest, drops 1–2 garlic
- [ ] Wild oregano spawns in meadow and plains, drops 1–2 oregano seeds
- [ ] Wild pineapple spawns in jungle, drops 1 pineapple crown
- [ ] Wild plants only place on grass/dirt type blocks
```

If a plant is too rare or too common, change `scatter_chance` in its rule (percent per chunk) and `iterations` in its patch; re-test in another new world.

- [ ] **Step 5: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add wild plants with per-biome feature rules"
```

---

### Task 10: Polish (Norwegian names, ding sound, .mcaddon, Realm test)

Build order step 7. Kid session for names and sound; Stig handles the Realm upload.

**Files:**
- Modify: `packs/foodcraft_rp/texts/nb_NO.lang`
- Create: `packs/foodcraft_rp/sounds/sound_definitions.json`, `packs/foodcraft_rp/sounds/foodcraft/ding.ogg`
- Modify: `packs/foodcraft_bp/scripts/oven.js` (`DING_SOUND`)
- Create: `tools/export_mcaddon.ps1`
- Modify: `docs/test-checklist.md`

- [ ] **Step 1: Norwegian names**

`nb_NO.lang` gets one line per key in `en_US.lang` (same keys, Norwegian values):

```
item.foodcraft.tomato.name=Tomat
item.foodcraft.garlic.name=Hvitløk
item.foodcraft.oregano.name=Oregano
item.foodcraft.pineapple.name=Ananas
item.foodcraft.tomato_seeds.name=Tomatfrø
item.foodcraft.oregano_seeds.name=Oreganofrø
item.foodcraft.pineapple_crown.name=Ananaskrone
item.foodcraft.flour.name=Mel
item.foodcraft.pizza_dough.name=Pizzadeig
item.foodcraft.tomato_sauce.name=Tomatsaus
item.foodcraft.mozzarella.name=Mozzarella
item.foodcraft.pepperoni.name=Pepperoni
item.foodcraft.ham.name=Skinke
item.foodcraft.raw_pizza_margherita.name=Rå pizza margherita
item.foodcraft.raw_pizza_pepperoni.name=Rå pizza pepperoni
item.foodcraft.raw_pizza_prosciutto.name=Rå pizza prosciutto
item.foodcraft.raw_pizza_hawaii.name=Rå pizza Hawaii
item.foodcraft.pizza_margherita.name=Pizza margherita
item.foodcraft.pizza_pepperoni.name=Pizza pepperoni
item.foodcraft.pizza_prosciutto.name=Pizza prosciutto
item.foodcraft.pizza_hawaii.name=Pizza Hawaii
tile.foodcraft:pizza_oven.name=Pizzaovn
tile.foodcraft:tomato_crop.name=Tomatplante
tile.foodcraft:tomato_crop_top.name=Tomatplante
tile.foodcraft:garlic_crop.name=Hvitløkplante
tile.foodcraft:oregano_crop.name=Oreganoplante
tile.foodcraft:pineapple_crop.name=Ananasplante
tile.foodcraft:wild_tomato.name=Vill tomat
tile.foodcraft:wild_garlic.name=Vill hvitløk
tile.foodcraft:wild_oregano.name=Vill oregano
tile.foodcraft:wild_pineapple.name=Vill ananas
```

Save the file as UTF-8. Verify `en_US.lang` has exactly the same 31 keys: `grep -c = packs/foodcraft_rp/texts/en_US.lang` and the same for `nb_NO.lang` both print 31.

- [ ] **Step 2: Oven ding sound**

1. Record or pick a short "ding" (under 1 s), export as OGG Vorbis mono to `packs/foodcraft_rp/sounds/foodcraft/ding.ogg` (Audacity: File > Export > OGG).
2. `packs/foodcraft_rp/sounds/sound_definitions.json`:

```json
{
  "format_version": "1.26.60",
  "sound_definitions": {
    "foodcraft.oven.ding": {
      "category": "block",
      "sounds": [{ "name": "sounds/foodcraft/ding", "volume": 1.0 }]
    }
  }
}
```

3. In `scripts/oven.js` change `const DING_SOUND = "random.orb";` to `const DING_SOUND = "foodcraft.oven.ding";`.

- [ ] **Step 3: Export script**

`tools/export_mcaddon.ps1`:

```powershell
# Bundles both packs into dist/foodcraft.mcaddon (a zip with the two pack folders at its root).
$repo = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $repo "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$zip = Join-Path $dist "foodcraft.zip"
$out = Join-Path $dist "foodcraft.mcaddon"
Remove-Item -Force -ErrorAction SilentlyContinue $zip, $out
Compress-Archive -Path (Join-Path $repo "packs\foodcraft_bp"), (Join-Path $repo "packs\foodcraft_rp") -DestinationPath $zip
Rename-Item $zip $out
Write-Host "Wrote $out"
```

Add `dist/` to `.gitignore`.

- [ ] **Step 4: Deploy and verify**

1. Deploy, re-enter. Content Log clean.
2. Settings > General > Language > Norsk bokmål: hover items and blocks, names are Norwegian. Switch back to English.
3. Bake a pizza: the custom ding plays when it finishes.
4. Run `tools\export_mcaddon.ps1`; double-click `dist\foodcraft.mcaddon`: Minecraft imports both packs ("Import complete"). On a second Windows account or PC, create a world with the imported packs and run the Hello pizza line.
5. Realm: upload "Foodcraft Test" to the Realm (Play > Edit world > Realms > Upload). On a console (Xbox/PlayStation/Switch) join the Realm, `/give @s foodcraft:pizza_oven`, bake one pizza, eat it.

Checklist:

```markdown
## Polish
- [ ] Norwegian names show with language set to Norsk bokmål (31 keys)
- [ ] Custom ding sound plays when a pizza finishes
- [ ] dist/foodcraft.mcaddon imports cleanly on another Windows install
- [ ] Realm: console player can craft, bake and eat a pizza
```

- [ ] **Step 5: Commit**

```bash
git add packs tools/export_mcaddon.ps1 .gitignore docs/test-checklist.md
git commit -m "Polish: Norwegian names, oven ding, mcaddon export"
```

---

## Self-review

- Spec 2.1 crops and wild plants: Tasks 7, 8 and 9 (4 stages, farmland only, bone meal, seed-only immature drop, per-biome spawn, seed drops). Tomato and pineapple differ on purpose: see Spec conflicts.
- Spec 2.2 ingredients and 2.3 pizzas: Tasks 3 and 4 (all recipes, bucket return, nausea, hunger above vanilla).
- Spec 2.4 oven recipe and states, 4.1 flow, 4.2 edge cases: Task 5 (every table row has a checklist line), model in Task 6.
- Spec 2.5 art rules: placeholders from Task 1; kids redraw in place (same file names, 16x16).
- Spec 3 architecture: one script module, block_placer with `use_on` farmland, feature rules, loot tables, `en_US`/`nb_NO`, sounds, Blockbench model.
- Spec 5 build order: Tasks 2–10 map to steps 1–7 in order (Tasks 7 and 8 are both step 5); each ends playable.
- Spec 6 testing: Content Log check and `docs/test-checklist.md` lines in every task; wild plants tested in a new world.
- Names used across tasks are consistent: `foodcraft:raw_pizza_<name>` / `foodcraft:pizza_<name>` (Tasks 4, 5), `foodcraft:stage` / `foodcraft:pizza` (Tasks 5, 6), `foodcraft:growth` (Tasks 7, 8), `foodcraft:fruit` and the tomato and pineapple bone names (Task 8, `art/README.md`), seed item ids (Tasks 3, 7, 8, 9), texture names (Task 1 vs atlas entries in Tasks 2–9).
