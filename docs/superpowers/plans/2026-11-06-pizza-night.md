# Pizza Night (Morphood v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full v1 loop (wild plants, crops, ingredients, raw and baked pizzas, pizza oven) as a Minecraft Bedrock add-on that Ravn and Kasper can build one playable step at a time.

**Architecture:** Two packs in the repo (`packs/morphood_bp`, `packs/morphood_rp`) deployed by a copy script into the Windows development pack folders. Items, recipes, blocks, loot tables and features are JSON. One JavaScript script module (`@minecraft/server` 2.11.0) registers two block custom components (`morphood:crop`, `morphood:pizza_oven`) and the raw-pizza nausea handler. Placeholder 16x16 textures are generated from the concept SVGs so every task is playable before the kids redraw art in Blockbench.

**Tech Stack:** Minecraft Bedrock 1.26.60 (Windows GDK build), `@minecraft/server` 2.11.0, block/item/recipe `format_version` 1.26.50, plain JavaScript (no build step), Python 3 (placeholder texture tool), PowerShell (deploy and export scripts).

**Spec:** `docs/superpowers/specs/2026-11-06-pizza-night-design.md`

## Spec conflicts

None block the spec as written. Two points are narrower than the spec text:

- **4.2 "Oven broken while baking/done drops the pizza":** the block custom component hook is `onPlayerBreak`, which fires only for player breaks (Task 5). An oven removed by explosion, piston or `/setblock` drops the oven (via its loot table) but not the pizza.
- **2.3 "Eating raw pizza gives Nausea":** `minecraft:food` has no effect field in the current format (doc confirms `remove_effects` is deprecated and there is no add-effect field). The effect is applied from script in `world.afterEvents.itemCompleteUse` (Task 4). Same player-visible result.

## Doc sources used

All checked 2026-11-06.

| Topic | Source | What it settled |
|---|---|---|
| Current stable script API | `npm view @minecraft/server dist-tags` | `latest` = `2.11.0`; `2.12.0` is beta for game 1.26.63, so 2.11.0 is the stable module in 1.26.60 |
| Current game version | github.com/Mojang/bedrock-samples `main` manifests | `min_engine_version: [1, 26, 60]`; vanilla items, blocks and recipes on `main` use `format_version "1.26.50"` |
| Manifest format | learn.microsoft.com/minecraft/creator/documents/scripting/introduction | `format_version: 2`, script module `{type: "script", language: "javascript", entry: "scripts/main.js"}`, dependency `{module_name: "@minecraft/server", version: "..."}`; `/reload` hot-reloads scripts |
| Windows dev pack paths | learn.microsoft.com/minecraft/creator/documents/gdkpcprojectfolder (and gettingstarted) | From 1.21.120 (GDK): `%appdata%\Minecraft Bedrock\users\shared\games\com.mojang\development_behavior_packs` and `...\development_resource_packs`; logs at `%appdata%\Minecraft Bedrock\logs\`; Preview uses `Minecraft Bedrock Preview` |
| Custom Components V2 | learn.microsoft.com/.../documents/update1.21.90, `.../documents/scriptingv2.0.0overview`, `.../blockcomponents/minecraftblock_custom_components` | Available without experiments since 1.21.90 with `@minecraft/server` >= 2.0.0. Custom components are listed directly under `components` (`"morphood:crop": {}`); `minecraft:custom_components` is deprecated. Registration: `system.beforeEvents.startup.subscribe(e => e.blockComponentRegistry.registerCustomComponent(id, {...}))` |
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

- Namespace for every identifier: `morphood:` (spec 3).
- Game: Minecraft Bedrock 1.26.60 or newer on Windows; both manifests use `min_engine_version: [1, 26, 60]`.
- `format_version` for items, blocks and recipes: `"1.26.50"`. Features and feature rules: `"1.21.10"` / `"1.13.0"` as in the official samples.
- Script dependency: `@minecraft/server` version `"2.11.0"`. Plain JavaScript ES modules under `packs/morphood_bp/scripts/`. No TypeScript, no bundler.
- Textures are 16x16 PNG (spec 2.5). Placeholders come from `tools/render_placeholders.py`; the kids replace files in place with the same names.
- Item lang keys: `item.morphood.<name>.name`. Block lang keys: `tile.morphood:<name>.name`. English in `en_US.lang`; Norwegian in `nb_NO.lang` (Task 9).
- Every task ends with: deploy, `/reload` (or re-enter the world for JSON changes), zero errors in the Content Log (Settings > Creator > Content Log, enable "Content Log GUI" and "Content Log File"), and the task's checklist lines ticked in `docs/test-checklist.md`.
- Test world: flat, creative, cheats on, both packs active, named `Morphood Test`. Wild plants (Task 8) need a new non-flat world.
- Commit after each task. No co-author lines.

## File structure

```
packs/
  morphood_bp/
    manifest.json
    items/            one file per item (21 items)
    recipes/          one file per recipe (15 recipes)
    blocks/           pizza_oven.json, 4 crops, 4 wild plants
    loot_tables/blocks/
    features/         scatter + single-block feature per wild plant
    feature_rules/    one per wild plant
    scripts/
      main.js         imports the three modules below
      food.js         raw pizza nausea
      oven.js         morphood:pizza_oven component
      crop.js         morphood:crop component
  morphood_rp/
    manifest.json
    blocks.json       block sounds
    texts/            en_US.lang, nb_NO.lang, languages.json
    textures/
      item_texture.json
      terrain_texture.json
      items/*.png
      blocks/*.png
    models/blocks/pizza_oven.geo.json   (Task 6, Blockbench)
    sounds/sound_definitions.json       (Task 9)
    sounds/morphood/ding.ogg            (Task 9)
tools/
  render_placeholders.py   concept SVG -> 16x16 PNGs
  deploy.ps1               repo packs -> Windows development pack folders
  export_mcaddon.ps1       packs -> dist/morphood.mcaddon
docs/test-checklist.md     one line per item, recipe, oven edge case
```

---

### Task 1: Placeholder texture tool

Claude does this task; it is tooling, not a kid session.

**Files:**
- Create: `tools/render_placeholders.py`
- Create: `packs/morphood_rp/textures/items/*.png`, `packs/morphood_rp/textures/blocks/*.png` (generated)

**Interfaces:**
- Consumes: `docs/superpowers/specs/images/{ingredients,pizzas,crops,oven}.svg`. Each tile is a background `<rect fill="#3b3b46">` of size 96/128/160 holding 16x16 pixel rects of size 6/8/10, with a `<text>` label under it.
- Produces: PNG files named below. Later tasks reference these names in `item_texture.json` / `terrain_texture.json`.

| SVG label | Output file |
|---|---|
| ingredients: `tomato`, `garlic`, `oregano`, `pineapple`, `tomato seeds`, `oregano seeds`, `flour`, `dough`, `tomato sauce`, `mozzarella`, `pepperoni`, `ham` | `textures/items/morphood_<label with spaces as _>.png` (`dough` -> `morphood_pizza_dough.png`) |
| pizzas: `raw margherita` ... `raw hawaii` | `textures/items/morphood_raw_pizza_<name>.png` |
| pizzas: `margherita` ... `hawaii` | `textures/items/morphood_pizza_<name>.png` |
| crops: `tomato 0` ... `pineapple 3` | `textures/blocks/morphood_<plant>_crop_<n>.png` |
| oven: `empty`, `baking`, `done` | `textures/blocks/morphood_oven_front_<state>.png` |
| derived copies | `textures/items/morphood_pineapple_crown.png` (= pineapple), `textures/blocks/morphood_wild_<plant>.png` (= `<plant>_crop_3`), `textures/blocks/morphood_oven_side.png` and `morphood_oven_top.png` (= oven front empty) |

- [ ] **Step 1: Write the tool**

```python
#!/usr/bin/env python3
"""Render 16x16 placeholder PNGs from the concept SVGs in docs/superpowers/specs/images."""
import re, struct, zlib, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG_DIR = ROOT / "docs/superpowers/specs/images"
RP = ROOT / "packs/morphood_rp/textures"
TILE_SIZES = {96: 6, 128: 8, 160: 10}
TILE_BG = "#3b3b46"

RECT = re.compile(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="(#[0-9a-fA-F]{6})"/>')
TEXT = re.compile(r'<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</text>')


def write_png(path, pixels):
    """pixels: 16 rows of 16 (r, g, b, a) tuples."""
    raw = b"".join(b"\x00" + bytes(c for px in row for c in px) for row in pixels)
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 16, 16, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def hex_rgba(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)


def tiles_of(svg_text):
    """Yield (label, pixels) for every labelled tile in one SVG."""
    rects = [(float(x), float(y), float(w), float(h), f) for x, y, w, h, f in RECT.findall(svg_text)]
    labels = [(float(x), float(y), t.strip()) for x, y, t in TEXT.findall(svg_text)]
    tiles = [(x, y, int(w)) for x, y, w, h, f in rects if f == TILE_BG and int(w) in TILE_SIZES and w == h]
    for tx, ty, size in tiles:
        px = TILE_SIZES[size]
        label = next((t for lx, ly, t in labels if tx <= lx <= tx + size and ty + size < ly < ty + size + 40), None)
        if label is None:
            continue
        pixels = [[(0, 0, 0, 0)] * 16 for _ in range(16)]
        for x, y, w, h, f in rects:
            if w == px and h == px and tx <= x < tx + size and ty <= y < ty + size:
                pixels[int((y - ty) / px)][int((x - tx) / px)] = hex_rgba(f)
        yield label, pixels


def out_path(svg_name, label):
    name = label.replace(" ", "_")
    if svg_name == "ingredients":
        if name == "dough":
            name = "pizza_dough"
        return RP / "items" / f"morphood_{name}.png"
    if svg_name == "pizzas":
        return RP / "items" / (f"morphood_{name.replace('raw_', 'raw_pizza_')}.png" if name.startswith("raw_") else f"morphood_pizza_{name}.png")
    if svg_name == "crops":
        plant, stage = name.rsplit("_", 1)
        return RP / "blocks" / f"morphood_{plant}_crop_{stage}.png"
    if svg_name == "oven":
        return RP / "blocks" / f"morphood_oven_front_{name}.png"
    raise ValueError(svg_name)


def main():
    written = []
    for svg in sorted(SVG_DIR.glob("*.svg")):
        for label, pixels in tiles_of(svg.read_text()):
            path = out_path(svg.stem, label)
            write_png(path, pixels)
            written.append(path)
    copies = {
        RP / "items/morphood_pineapple_crown.png": RP / "items/morphood_pineapple.png",
        RP / "blocks/morphood_oven_side.png": RP / "blocks/morphood_oven_front_empty.png",
        RP / "blocks/morphood_oven_top.png": RP / "blocks/morphood_oven_front_empty.png",
    }
    for plant in ("tomato", "garlic", "oregano", "pineapple"):
        copies[RP / f"blocks/morphood_wild_{plant}.png"] = RP / f"blocks/morphood_{plant}_crop_3.png"
    for dst, src in copies.items():
        shutil.copyfile(src, dst)
        written.append(dst)
    print(f"wrote {len(written)} textures")
    return written


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it and check the output**

Run: `python3 tools/render_placeholders.py`
Expected: `wrote 46 textures` (12 ingredients + 8 pizzas + 16 crop stages + 3 oven fronts + 7 copies).

Run: `python3 -c "import struct,glob; [print(f, struct.unpack('>II', open(f,'rb').read()[16:24])) for f in sorted(glob.glob('packs/morphood_rp/textures/*/*.png'))]"`
Expected: 46 lines, every one ending in `(16, 16)`.

Open `packs/morphood_rp/textures/items/morphood_tomato.png` with the Read tool: a red tomato with a dark outline on a transparent background.

- [ ] **Step 3: Commit**

```bash
git add tools/render_placeholders.py packs/morphood_rp/textures
git commit -m "Add placeholder texture tool and generated textures"
```

---

### Task 2: Hello pizza (packs load, one edible tomato)

Build order step 1. Kid session: Ravn and Kasper type the JSON with Claude, deploy, and eat a tomato.

**Files:**
- Create: `packs/morphood_bp/manifest.json`
- Create: `packs/morphood_rp/manifest.json`
- Create: `packs/morphood_bp/items/tomato.json`
- Create: `packs/morphood_rp/textures/item_texture.json`
- Create: `packs/morphood_rp/texts/en_US.lang`, `packs/morphood_rp/texts/languages.json`
- Create: `tools/deploy.ps1`
- Create: `docs/test-checklist.md`

**Interfaces:**
- Produces: pack UUIDs (fixed below, reused by every later task), the item file pattern every later item copies, and `tools/deploy.ps1` which every later task runs.

- [ ] **Step 1: Behavior pack manifest**

`packs/morphood_bp/manifest.json`:

```json
{
  "format_version": 2,
  "header": {
    "name": "Morphood Behavior Pack",
    "description": "Pizza Night: crops, ingredients and a pizza oven",
    "uuid": "7d9decc8-dc05-4900-9ee1-9ab1d2d07740",
    "version": [0, 1, 0],
    "min_engine_version": [1, 26, 60]
  },
  "modules": [
    {
      "description": "Morphood data",
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

`packs/morphood_rp/manifest.json`:

```json
{
  "format_version": 2,
  "header": {
    "name": "Morphood Resource Pack",
    "description": "Pizza Night textures, models, names and sounds",
    "uuid": "21c9e746-cd73-41fd-a163-83955769e6c2",
    "version": [0, 1, 0],
    "min_engine_version": [1, 26, 60]
  },
  "modules": [
    {
      "description": "Morphood resources",
      "type": "resources",
      "uuid": "6bb33493-8a0c-4438-9f00-7f4fca009c54",
      "version": [0, 1, 0]
    }
  ]
}
```

- [ ] **Step 3: The tomato item**

`packs/morphood_bp/items/tomato.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "morphood:tomato",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "morphood_tomato" } },
      "minecraft:display_name": { "value": "item.morphood.tomato.name" },
      "minecraft:food": { "nutrition": 2, "saturation_modifier": 0.3 },
      "minecraft:use_animation": { "value": "eat" },
      "minecraft:use_modifiers": { "start_using": "always", "use_duration": 1.6, "movement_modifier": 0.35 },
      "minecraft:tags": { "tags": ["minecraft:is_food"] }
    }
  }
}
```

- [ ] **Step 4: Texture atlas entry and names**

`packs/morphood_rp/textures/item_texture.json`:

```json
{
  "resource_pack_name": "morphood_rp",
  "texture_name": "atlas.items",
  "texture_data": {
    "morphood_tomato": { "textures": "textures/items/morphood_tomato" }
  }
}
```

`packs/morphood_rp/texts/languages.json`:

```json
["en_US", "nb_NO"]
```

`packs/morphood_rp/texts/en_US.lang`:

```
item.morphood.tomato.name=Tomato
```

Also create `packs/morphood_rp/texts/nb_NO.lang` containing the single line `item.morphood.tomato.name=Tomat` so `languages.json` does not point at a missing file. Task 9 fills it in.

- [ ] **Step 5: Deploy script**

`tools/deploy.ps1`:

```powershell
# Copies the packs from the repo into the Minecraft development pack folders (GDK build, 1.21.120+).
$com = Join-Path $env:APPDATA "Minecraft Bedrock\users\shared\games\com.mojang"
$repo = Split-Path $PSScriptRoot -Parent
foreach ($pair in @(@("morphood_bp", "development_behavior_packs"), @("morphood_rp", "development_resource_packs"))) {
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
- [ ] Tomato: `/give @s morphood:tomato`, name "Tomato", eats, hunger goes up
```

- [ ] **Step 7: Deploy and verify in game**

1. In PowerShell: `powershell -ExecutionPolicy Bypass -File tools\deploy.ps1`
2. Settings > Creator: turn on "Content Log GUI" and "Content Log File". Also turn on "Enable GameTest Framework"? No. Leave experiments off.
3. Create world "Morphood Test": Flat, Creative, cheats on. Under Behavior Packs > Available activate "Morphood Behavior Pack" (the resource pack is pulled in by the dependency; confirm it shows under Resource Packs > Active).
4. Enter the world. Content Log: no red lines.
5. `/give @s morphood:tomato` gives an item named "Tomato" with the red placeholder texture.
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
- Create: `packs/morphood_bp/items/{garlic,oregano,pineapple,tomato_seeds,oregano_seeds,pineapple_crown,flour,pizza_dough,tomato_sauce,mozzarella,pepperoni,ham}.json`
- Create: `packs/morphood_bp/recipes/{flour,pizza_dough,tomato_sauce,mozzarella,pepperoni,ham}.json`
- Modify: `packs/morphood_rp/textures/item_texture.json`, `packs/morphood_rp/texts/en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Produces item ids used by Task 4 recipes: `morphood:pizza_dough`, `morphood:tomato_sauce`, `morphood:mozzarella`, `morphood:pepperoni`, `morphood:ham`, `morphood:pineapple`, `morphood:oregano`. Seed ids used by Task 7: `morphood:tomato_seeds`, `morphood:garlic`, `morphood:oregano_seeds`, `morphood:pineapple_crown`.

- [ ] **Step 1: Non-food items**

Every item in this task uses the same shape. Full file for `tomato_seeds.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "morphood:tomato_seeds",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "morphood_tomato_seeds" } },
      "minecraft:display_name": { "value": "item.morphood.tomato_seeds.name" }
    }
  }
}
```

Create these files with the same content, changing only the identifier, icon texture and display name key (all three use the item name):

| File | identifier | icon texture | lang key |
|---|---|---|---|
| `oregano_seeds.json` | `morphood:oregano_seeds` | `morphood_oregano_seeds` | `item.morphood.oregano_seeds.name` |
| `pineapple_crown.json` | `morphood:pineapple_crown` | `morphood_pineapple_crown` | `item.morphood.pineapple_crown.name` |
| `flour.json` | `morphood:flour` | `morphood_flour` | `item.morphood.flour.name` |
| `pizza_dough.json` | `morphood:pizza_dough` | `morphood_pizza_dough` | `item.morphood.pizza_dough.name` |
| `tomato_sauce.json` | `morphood:tomato_sauce` | `morphood_tomato_sauce` | `item.morphood.tomato_sauce.name` |
| `mozzarella.json` | `morphood:mozzarella` | `morphood_mozzarella` | `item.morphood.mozzarella.name` |

Task 7 adds `minecraft:block_placer` to the seed items; do not add it now (the crop blocks do not exist yet and the Content Log would report the missing block).

- [ ] **Step 2: Food items**

Same file shape as `tomato.json` from Task 2 (with `minecraft:food`, `use_animation`, `use_modifiers`, `is_food` tag). Full file for `garlic.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "morphood:garlic",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "morphood_garlic" } },
      "minecraft:display_name": { "value": "item.morphood.garlic.name" },
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
| `oregano.json` | `morphood:oregano` | `morphood_oregano` | `item.morphood.oregano.name` | 1 | 0.3 |
| `pineapple.json` | `morphood:pineapple` | `morphood_pineapple` | `item.morphood.pineapple.name` | 3 | 0.3 |
| `pepperoni.json` | `morphood:pepperoni` | `morphood_pepperoni` | `item.morphood.pepperoni.name` | 3 | 0.6 |
| `ham.json` | `morphood:ham` | `morphood_ham` | `item.morphood.ham.name` | 4 | 0.6 |

- [ ] **Step 3: Recipes**

`recipes/flour.json` (shapeless, 1 wheat):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "morphood:flour" },
    "tags": ["crafting_table"],
    "ingredients": [{ "item": "minecraft:wheat" }],
    "unlock": [{ "item": "minecraft:wheat" }],
    "result": { "item": "morphood:flour" }
  }
}
```

`recipes/tomato_sauce.json` (shapeless, 2 tomato + garlic + oregano + bowl):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "morphood:tomato_sauce" },
    "tags": ["crafting_table"],
    "ingredients": [
      { "item": "morphood:tomato", "count": 2 },
      { "item": "morphood:garlic" },
      { "item": "morphood:oregano" },
      { "item": "minecraft:bowl" }
    ],
    "unlock": [{ "item": "morphood:tomato" }],
    "result": { "item": "morphood:tomato_sauce" }
  }
}
```

`recipes/pepperoni.json` (shapeless, raw porkchop + oregano):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "morphood:pepperoni" },
    "tags": ["crafting_table"],
    "ingredients": [{ "item": "minecraft:porkchop" }, { "item": "morphood:oregano" }],
    "unlock": [{ "item": "minecraft:porkchop" }],
    "result": { "item": "morphood:pepperoni" }
  }
}
```

`recipes/ham.json` (shapeless, cooked porkchop gives 2):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "morphood:ham" },
    "tags": ["crafting_table"],
    "ingredients": [{ "item": "minecraft:cooked_porkchop" }],
    "unlock": [{ "item": "minecraft:cooked_porkchop" }],
    "result": { "item": "morphood:ham", "count": 2 }
  }
}
```

`recipes/pizza_dough.json` (shaped so the result can be an array; the empty bucket comes back like vanilla cake):

```json
{
  "format_version": "1.26.50",
  "minecraft:recipe_shaped": {
    "description": { "identifier": "morphood:pizza_dough" },
    "tags": ["crafting_table"],
    "pattern": ["FFF", " W "],
    "key": {
      "F": { "item": "morphood:flour" },
      "W": { "item": "minecraft:water_bucket" }
    },
    "unlock": [{ "item": "morphood:flour" }],
    "result": [
      { "item": "morphood:pizza_dough" },
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
    "description": { "identifier": "morphood:mozzarella" },
    "tags": ["crafting_table"],
    "pattern": ["M"],
    "key": {
      "M": { "item": "minecraft:milk_bucket" }
    },
    "unlock": [{ "item": "minecraft:milk_bucket" }],
    "result": [
      { "item": "morphood:mozzarella" },
      { "item": "minecraft:bucket", "count": 1, "data": 0 }
    ]
  }
}
```

If the Content Log reports an unknown item for `minecraft:milk_bucket`, replace that key with `{ "item": "minecraft:bucket", "data": 1 }` (the form vanilla `cake.json` uses). If it reports `minecraft:water_bucket`, stop and report; do not guess a data value.

- [ ] **Step 4: Atlas entries and names**

Add to `item_texture.json` `texture_data` (one entry per new item, same pattern as `morphood_tomato`):
`morphood_garlic`, `morphood_oregano`, `morphood_pineapple`, `morphood_tomato_seeds`, `morphood_oregano_seeds`, `morphood_pineapple_crown`, `morphood_flour`, `morphood_pizza_dough`, `morphood_tomato_sauce`, `morphood_mozzarella`, `morphood_pepperoni`, `morphood_ham`, each mapping to `textures/items/<same name>`.

Append to `en_US.lang`:

```
item.morphood.garlic.name=Garlic
item.morphood.oregano.name=Oregano
item.morphood.pineapple.name=Pineapple
item.morphood.tomato_seeds.name=Tomato Seeds
item.morphood.oregano_seeds.name=Oregano Seeds
item.morphood.pineapple_crown.name=Pineapple Crown
item.morphood.flour.name=Flour
item.morphood.pizza_dough.name=Pizza Dough
item.morphood.tomato_sauce.name=Tomato Sauce
item.morphood.mozzarella.name=Mozzarella
item.morphood.pepperoni.name=Pepperoni
item.morphood.ham.name=Ham
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
3. `/give @s morphood:<each item>` shows the right name and placeholder texture (12 items).
4. `/give @s minecraft:wheat 3`, `/give @s minecraft:water_bucket`, `/give @s minecraft:milk_bucket`, `/give @s minecraft:bowl`, `/give @s minecraft:porkchop`, `/give @s minecraft:cooked_porkchop`, `/give @s morphood:tomato 2`, place a crafting table and craft all six recipes. Both bucket recipes leave an empty bucket.
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
- Create: `packs/morphood_bp/items/raw_pizza_{margherita,pepperoni,prosciutto,hawaii}.json`
- Create: `packs/morphood_bp/items/pizza_{margherita,pepperoni,prosciutto,hawaii}.json`
- Create: `packs/morphood_bp/recipes/raw_pizza_{margherita,pepperoni,prosciutto,hawaii}.json`
- Create: `packs/morphood_bp/scripts/main.js`, `packs/morphood_bp/scripts/food.js`
- Modify: `packs/morphood_bp/manifest.json`, `item_texture.json`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Produces: item ids `morphood:raw_pizza_<name>` and `morphood:pizza_<name>` for `margherita|pepperoni|prosciutto|hawaii`. Task 5's oven derives the pizza type from the raw id by stripping `morphood:raw_pizza_`.
- Produces: `scripts/main.js` as the single entry; later tasks add one `import` line each.

- [ ] **Step 1: Raw pizza items**

`items/raw_pizza_margherita.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:item": {
    "description": {
      "identifier": "morphood:raw_pizza_margherita",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "morphood_raw_pizza_margherita" } },
      "minecraft:display_name": { "value": "item.morphood.raw_pizza_margherita.name" },
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
      "identifier": "morphood:pizza_margherita",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:icon": { "textures": { "default": "morphood_pizza_margherita" } },
      "minecraft:display_name": { "value": "item.morphood.pizza_margherita.name" },
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
    "description": { "identifier": "morphood:raw_pizza_margherita" },
    "tags": ["crafting_table"],
    "ingredients": [
      { "item": "morphood:pizza_dough" },
      { "item": "morphood:tomato_sauce" },
      { "item": "morphood:mozzarella" },
      { "item": "morphood:oregano" }
    ],
    "unlock": [{ "item": "morphood:pizza_dough" }],
    "result": { "item": "morphood:raw_pizza_margherita" }
  }
}
```

The other three replace the fourth ingredient:

| File | identifier | ingredients after dough + sauce + mozzarella |
|---|---|---|
| `raw_pizza_pepperoni.json` | `morphood:raw_pizza_pepperoni` | `morphood:pepperoni` |
| `raw_pizza_prosciutto.json` | `morphood:raw_pizza_prosciutto` | `morphood:ham` |
| `raw_pizza_hawaii.json` | `morphood:raw_pizza_hawaii` | `morphood:ham`, `morphood:pineapple` |

- [ ] **Step 4: Script module in the manifest**

Replace `packs/morphood_bp/manifest.json` `modules` and `dependencies` with:

```json
  "modules": [
    {
      "description": "Morphood data",
      "type": "data",
      "uuid": "b1a3afbc-9ffe-4882-a249-c29badf31a8f",
      "version": [0, 1, 0]
    },
    {
      "description": "Morphood scripts",
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

const RAW_PIZZA_PREFIX = "morphood:raw_pizza_";
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

Add eight `item_texture.json` entries: `morphood_raw_pizza_<name>` and `morphood_pizza_<name>` -> `textures/items/<same>`.

Append to `en_US.lang`:

```
item.morphood.raw_pizza_margherita.name=Raw Pizza Margherita
item.morphood.raw_pizza_pepperoni.name=Raw Pizza Pepperoni
item.morphood.raw_pizza_prosciutto.name=Raw Pizza Prosciutto
item.morphood.raw_pizza_hawaii.name=Raw Pizza Hawaii
item.morphood.pizza_margherita.name=Pizza Margherita
item.morphood.pizza_pepperoni.name=Pizza Pepperoni
item.morphood.pizza_prosciutto.name=Pizza Prosciutto
item.morphood.pizza_hawaii.name=Pizza Hawaii
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
3. `/give @s morphood:raw_pizza_margherita` and eat it: Nausea appears for 10 seconds.
4. `/gamemode s`, empty hunger (`/effect @s hunger 30 255` then wait), eat `morphood:pizza_hawaii`: bar fills completely.
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
- Create: `packs/morphood_bp/blocks/pizza_oven.json`
- Create: `packs/morphood_bp/recipes/pizza_oven.json`
- Create: `packs/morphood_bp/scripts/oven.js`
- Create: `packs/morphood_rp/textures/terrain_texture.json`
- Create: `packs/morphood_rp/blocks.json`
- Modify: `scripts/main.js`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Block `morphood:pizza_oven` with states `morphood:stage` in `["empty", "baking", "done"]` and `morphood:pizza` in `["none", "margherita", "pepperoni", "prosciutto", "hawaii"]`, plus `minecraft:cardinal_direction` from the placement trait.
- Custom component id `morphood:pizza_oven` registered in `oven.js`. Task 6 swaps only the geometry and material instances; states and script stay.

- [ ] **Step 1: Block JSON**

`blocks/pizza_oven.json`. The front face is the model's `north` face; the placement trait plus `minecraft:transformation` turns it toward the player (same pattern as the official `fabricator.block.json` sample).

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "morphood:pizza_oven",
      "menu_category": { "category": "construction" },
      "traits": {
        "minecraft:placement_direction": { "enabled_states": ["minecraft:cardinal_direction"] }
      },
      "states": {
        "morphood:stage": ["empty", "baking", "done"],
        "morphood:pizza": ["none", "margherita", "pepperoni", "prosciutto", "hawaii"]
      }
    },
    "components": {
      "minecraft:geometry": "minecraft:geometry.full_block",
      "minecraft:material_instances": {
        "*": { "texture": "morphood_oven_side", "render_method": "opaque" },
        "up": { "texture": "morphood_oven_top", "render_method": "opaque" },
        "north": { "texture": "morphood_oven_front_empty", "render_method": "opaque" }
      },
      "minecraft:collision_box": true,
      "minecraft:selection_box": true,
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 3.5 },
      "minecraft:destructible_by_explosion": { "explosion_resistance": 6 },
      "minecraft:map_color": "#8a4a2e",
      "minecraft:tick": { "interval_range": [10, 10], "looping": true },
      "morphood:pizza_oven": {}
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
        "condition": "q.block_state('morphood:stage') == 'baking'",
        "components": {
          "minecraft:light_emission": 10,
          "minecraft:material_instances": {
            "*": { "texture": "morphood_oven_side", "render_method": "opaque" },
            "up": { "texture": "morphood_oven_top", "render_method": "opaque" },
            "north": { "texture": "morphood_oven_front_baking", "render_method": "opaque" }
          }
        }
      },
      {
        "condition": "q.block_state('morphood:stage') == 'done'",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "morphood_oven_side", "render_method": "opaque" },
            "up": { "texture": "morphood_oven_top", "render_method": "opaque" },
            "north": { "texture": "morphood_oven_front_done", "render_method": "opaque" }
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
    "description": { "identifier": "morphood:pizza_oven" },
    "tags": ["crafting_table"],
    "pattern": ["BBB", "BFB", "SSS"],
    "key": {
      "B": { "item": "minecraft:brick_block" },
      "F": { "item": "minecraft:furnace" },
      "S": { "item": "minecraft:stone" }
    },
    "unlock": [{ "item": "minecraft:furnace" }],
    "result": { "item": "morphood:pizza_oven" }
  }
}
```

`packs/morphood_rp/textures/terrain_texture.json`:

```json
{
  "resource_pack_name": "morphood_rp",
  "texture_name": "atlas.terrain",
  "padding": 8,
  "num_mip_levels": 4,
  "texture_data": {
    "morphood_oven_side": { "textures": "textures/blocks/morphood_oven_side" },
    "morphood_oven_top": { "textures": "textures/blocks/morphood_oven_top" },
    "morphood_oven_front_empty": { "textures": "textures/blocks/morphood_oven_front_empty" },
    "morphood_oven_front_baking": { "textures": "textures/blocks/morphood_oven_front_baking" },
    "morphood_oven_front_done": { "textures": "textures/blocks/morphood_oven_front_done" }
  }
}
```

`packs/morphood_rp/blocks.json`:

```json
{
  "format_version": "1.26.50",
  "morphood:pizza_oven": { "sound": "stone" }
}
```

Append to `en_US.lang`: `tile.morphood:pizza_oven.name=Pizza Oven`

- [ ] **Step 3: Deploy the decorative oven (session a ends here)**

Deploy, re-enter. Content Log clean. `/give @s morphood:pizza_oven`, place it facing you from four sides: the front (texture with the oven mouth) faces the player each time. If it faces away, swap the `north` and `south` rotation values in the two permutations. Craft one from 6 bricks blocks, a furnace and 3 stone. Add checklist lines:

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

const OVEN_ID = "morphood:pizza_oven";
const RAW_PREFIX = "morphood:raw_pizza_";
const BAKED_PREFIX = "morphood:pizza_";
const PIZZAS = ["margherita", "pepperoni", "prosciutto", "hawaii"];
const BAKE_TICKS = 200; // 10 seconds
const DING_SOUND = "random.orb"; // Task 9 swaps this for the custom ding

// Bake timers by block position. Lost on world close; onTick restarts them (spec 4.2).
const timers = new Map();

function keyOf(block) {
  return `${block.dimension.id}:${block.x},${block.y},${block.z}`;
}

function stageOf(block) {
  return block.permutation.getState("morphood:stage");
}

function pizzaOf(block) {
  return block.permutation.getState("morphood:pizza");
}

function setOven(block, stage, pizza) {
  block.setPermutation(block.permutation.withState("morphood:stage", stage).withState("morphood:pizza", pizza));
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
    const stage = brokenBlockPermutation.getState("morphood:stage");
    const pizza = brokenBlockPermutation.getState("morphood:pizza");
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
  event.blockComponentRegistry.registerCustomComponent("morphood:pizza_oven", pizzaOvenComponent);
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
- Create: `packs/morphood_rp/models/blocks/pizza_oven.geo.json` (exported from Blockbench)
- Create: `packs/morphood_rp/textures/blocks/morphood_pizza_oven.png` (the model's texture sheet, painted in Blockbench)
- Modify: `packs/morphood_bp/blocks/pizza_oven.json`, `terrain_texture.json`

**Interfaces:**
- Geometry identifier `geometry.morphood_pizza_oven`, bones named exactly: `body`, `flame`, `pizza_margherita`, `pizza_pepperoni`, `pizza_prosciutto`, `pizza_hawaii`. Bone visibility is driven by the block states from Task 5.

- [ ] **Step 1: Model in Blockbench**

1. New project > Bedrock Block. Set the identifier to `geometry.morphood_pizza_oven`, texture size 64x64.
2. Build: a brick dome/box body (`body` bone) with an opening on the north face (-Z), a small flame cube (`flame`) inside the mouth, and four flat pizza discs (`pizza_<name>`), one bone each, overlapping at the same spot on the oven floor. Follow `docs/superpowers/specs/images/oven.svg` for colours.
3. Paint the texture in Blockbench's paint tab. Save the texture as `morphood_pizza_oven.png` into `packs/morphood_rp/textures/blocks/`.
4. File > Export > Export Bedrock Geometry to `packs/morphood_rp/models/blocks/pizza_oven.geo.json`.

- [ ] **Step 2: Point the block at the model**

In `blocks/pizza_oven.json` replace the base `minecraft:geometry` and `minecraft:material_instances` with:

```json
      "minecraft:geometry": {
        "identifier": "geometry.morphood_pizza_oven",
        "bone_visibility": {
          "flame": "q.block_state('morphood:stage') == 'baking'",
          "pizza_margherita": "q.block_state('morphood:stage') == 'done' && q.block_state('morphood:pizza') == 'margherita'",
          "pizza_pepperoni": "q.block_state('morphood:stage') == 'done' && q.block_state('morphood:pizza') == 'pepperoni'",
          "pizza_prosciutto": "q.block_state('morphood:stage') == 'done' && q.block_state('morphood:pizza') == 'prosciutto'",
          "pizza_hawaii": "q.block_state('morphood:stage') == 'done' && q.block_state('morphood:pizza') == 'hawaii'"
        }
      },
      "minecraft:material_instances": {
        "*": { "texture": "morphood_pizza_oven", "render_method": "alpha_test" }
      },
```

Delete the `baking` and `done` permutations' `minecraft:material_instances` blocks (keep the `baking` permutation with only `minecraft:light_emission: 10`; delete the `done` permutation entirely). Keep the four rotation permutations.

Add to `terrain_texture.json`: `"morphood_pizza_oven": { "textures": "textures/blocks/morphood_pizza_oven" }`.

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

Build order step 5. Two kid sessions: (a) tomato crop end to end, (b) the other three crops by copying.

**Files:**
- Create: `packs/morphood_bp/blocks/{tomato,garlic,oregano,pineapple}_crop.json`
- Create: `packs/morphood_bp/loot_tables/blocks/{tomato,garlic,oregano,pineapple}_crop_seed.json` and `..._crop_mature.json`
- Create: `packs/morphood_bp/scripts/crop.js`
- Modify: `items/{tomato_seeds,garlic,oregano_seeds,pineapple_crown}.json`, `scripts/main.js`, `terrain_texture.json`, `en_US.lang`, `docs/test-checklist.md`

**Interfaces:**
- Blocks `morphood:<plant>_crop` with state `morphood:growth` in `[0, 1, 2, 3]`.
- Custom component id `morphood:crop` registered in `crop.js`; no parameters.
- Task 8 wild plants drop the seed items set up here.

- [ ] **Step 1: Tomato crop block**

`blocks/tomato_crop.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "morphood:tomato_crop",
      "menu_category": { "category": "none" },
      "states": { "morphood:growth": [0, 1, 2, 3] }
    },
    "components": {
      "minecraft:geometry": "minecraft:geometry.cross",
      "minecraft:material_instances": {
        "*": { "texture": "morphood_tomato_crop_0", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
      },
      "minecraft:collision_box": false,
      "minecraft:selection_box": { "origin": [-7, 0, -7], "size": [14, 10, 14] },
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 0 },
      "minecraft:light_dampening": 0,
      "minecraft:placement_filter": {
        "conditions": [{ "allowed_faces": ["up"], "block_filter": ["minecraft:farmland"] }]
      },
      "minecraft:loot": "loot_tables/blocks/tomato_crop_seed.json",
      "morphood:crop": {}
    },
    "permutations": [
      {
        "condition": "q.block_state('morphood:growth') == 1",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "morphood_tomato_crop_1", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
          }
        }
      },
      {
        "condition": "q.block_state('morphood:growth') == 2",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "morphood_tomato_crop_2", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
          }
        }
      },
      {
        "condition": "q.block_state('morphood:growth') == 3",
        "components": {
          "minecraft:material_instances": {
            "*": { "texture": "morphood_tomato_crop_3", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
          },
          "minecraft:loot": "loot_tables/blocks/tomato_crop_mature.json"
        }
      }
    ]
  }
}
```

- [ ] **Step 2: Tomato loot tables**

`loot_tables/blocks/tomato_crop_seed.json` (immature: one seed):

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [{ "type": "item", "name": "morphood:tomato_seeds", "weight": 1 }]
    }
  ]
}
```

`loot_tables/blocks/tomato_crop_mature.json` (2–3 tomatoes + 1–2 seeds):

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "morphood:tomato",
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
          "name": "morphood:tomato_seeds",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 1, "max": 2 } }]
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Tomato seeds place the crop**

Add to `items/tomato_seeds.json` `components`:

```json
      "minecraft:block_placer": {
        "block": "morphood:tomato_crop",
        "use_on": ["minecraft:farmland"]
      }
```

- [ ] **Step 4: Crop script**

`scripts/crop.js`:

```js
import { GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

const GROWTH = "morphood:growth";
const MAX_GROWTH = 3;
const GROW_CHANCE = 0.34; // per random tick, roughly vanilla wheat pace
const BONE_MEAL = "minecraft:bone_meal";

function growthOf(block) {
  return block.permutation.getState(GROWTH);
}

function setGrowth(block, growth) {
  block.setPermutation(block.permutation.withState(GROWTH, Math.min(growth, MAX_GROWTH)));
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
    if (growth >= MAX_GROWTH) return;
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
    if (!held || held.typeId !== BONE_MEAL) return;

    if (player.getGameMode() !== GameMode.Creative) {
      if (held.amount > 1) {
        held.amount -= 1;
        equippable.setEquipment(EquipmentSlot.Mainhand, held);
      } else {
        equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
      }
    }
    setGrowth(block, growth + 1 + Math.floor(Math.random() * 2)); // +1 or +2 stages
    const c = block.center();
    block.dimension.spawnParticle("minecraft:crop_growth_emitter", c);
    block.dimension.playSound("item.bone_meal.use", c);
  },
};
```

In `scripts/main.js` add `import { cropComponent } from "./crop.js";` and inside the startup subscriber:

```js
  event.blockComponentRegistry.registerCustomComponent("morphood:crop", cropComponent);
```

- [ ] **Step 5: Textures and names for tomato**

Add to `terrain_texture.json`: `morphood_tomato_crop_0` … `morphood_tomato_crop_3` -> `textures/blocks/<same>`.
Append to `en_US.lang`: `tile.morphood:tomato_crop.name=Tomato Crop`.

- [ ] **Step 6: Deploy and verify the tomato crop (session a ends here)**

1. Deploy, re-enter. Content Log clean.
2. `/give @s morphood:tomato_seeds 8`, `/give @s minecraft:bone_meal 16`. Till dirt with a hoe. Seeds plant on farmland only; on grass nothing happens.
3. `/gamerule randomtickspeed 300`: crops visibly change texture through stages within a minute. Set back to `/gamerule randomtickspeed 1`. If no crop ever changes stage at 300, random ticks are not reaching the component: stop and report (that would be a plan change, not something to patch around).
4. Bone meal a stage-0 crop: jumps one or two stages, green particles, one bone meal used in survival, none in creative.
5. Break a stage-0/1/2 crop: one tomato seed only. Break a stage-3 crop: 2–3 tomatoes and 1–2 seeds.
6. Break the farmland under a crop: the crop pops off as a seed (placement_filter survivability).

Checklist section:

```markdown
## Crops
- [ ] Tomato seeds plant only on farmland
- [ ] Tomato crop grows through 4 stages on random ticks (randomtickspeed 300)
- [ ] Bone meal advances tomato crop and is consumed in survival
- [ ] Immature tomato crop drops 1 seed; mature drops 2–3 tomatoes + 1–2 seeds
- [ ] Crop pops off when its farmland is broken
```

Commit: `git add packs docs/test-checklist.md && git commit -m "Add tomato crop with growth, bone meal and harvest"`.

- [ ] **Step 7: Garlic, oregano and pineapple crops (session b)**

Copy the three tomato files for each plant and change only the values below. The block JSON changes identifier, the four texture names and the two loot paths. Lang line `tile.morphood:<plant>_crop.name=<Plant> Crop`. Add the twelve `terrain_texture.json` entries `morphood_<plant>_crop_<n>`.

| Plant | Block id | Seed item (gets `block_placer` with `use_on: ["minecraft:farmland"]`) | Immature loot | Mature loot |
|---|---|---|---|---|
| garlic | `morphood:garlic_crop` | `morphood:garlic` (planted directly, like potatoes) | 1 `morphood:garlic` | `morphood:garlic` count 2–4 (one pool) |
| oregano | `morphood:oregano_crop` | `morphood:oregano_seeds` | 1 `morphood:oregano_seeds` | `morphood:oregano` count 1–2 and `morphood:oregano_seeds` count 1–2 (two pools) |
| pineapple | `morphood:pineapple_crop` | `morphood:pineapple_crown` | 1 `morphood:pineapple_crown` | `morphood:pineapple` count 1 and `morphood:pineapple_crown` count 1 (two pools, no set_count) |

`loot_tables/blocks/garlic_crop_mature.json` in full, since it has one pool:

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "morphood:garlic",
          "weight": 1,
          "functions": [{ "function": "set_count", "count": { "min": 2, "max": 4 } }]
        }
      ]
    }
  ]
}
```

- [ ] **Step 8: Deploy and verify the three crops**

Deploy, re-enter, Content Log clean. Repeat the five checklist lines for garlic, oregano and pineapple (add 15 lines). Garlic plants from the garlic item itself. Tick them.

- [ ] **Step 9: Commit**

```bash
git add packs docs/test-checklist.md
git commit -m "Add garlic, oregano and pineapple crops"
```

---

### Task 8: Wild plants with per-biome spawning

Build order step 6. Kid session. Tested in a new, non-flat world.

**Files:**
- Create: `packs/morphood_bp/blocks/wild_{tomato,garlic,oregano,pineapple}.json`
- Create: `packs/morphood_bp/loot_tables/blocks/wild_{tomato,garlic,oregano,pineapple}.json`
- Create: `packs/morphood_bp/features/wild_{plant}_block.json` and `features/wild_{plant}_patch.json` (4 plants, 8 files)
- Create: `packs/morphood_bp/feature_rules/wild_{plant}_rule.json` (4 files)
- Modify: `terrain_texture.json`, `en_US.lang`, `blocks.json`, `docs/test-checklist.md`

**Interfaces:**
- Blocks `morphood:wild_<plant>`; feature ids `morphood:wild_<plant>_block`, `morphood:wild_<plant>_patch`; rule ids `morphood:wild_<plant>_rule`. File names must equal the part after the colon.

- [ ] **Step 1: Wild tomato block**

`blocks/wild_tomato.json`:

```json
{
  "format_version": "1.26.50",
  "minecraft:block": {
    "description": {
      "identifier": "morphood:wild_tomato",
      "menu_category": { "category": "nature" }
    },
    "components": {
      "minecraft:geometry": "minecraft:geometry.cross",
      "minecraft:material_instances": {
        "*": { "texture": "morphood_wild_tomato", "render_method": "alpha_test_single_sided", "ambient_occlusion": 0 }
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
          "name": "morphood:tomato_seeds",
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
    "description": { "identifier": "morphood:wild_tomato_block" },
    "places_block": "morphood:wild_tomato",
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
    "description": { "identifier": "morphood:wild_tomato_patch" },
    "places_feature": "morphood:wild_tomato_block",
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
      "identifier": "morphood:wild_tomato_rule",
      "places_feature": "morphood:wild_tomato_patch"
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
| garlic | `morphood:garlic` | `{ "test": "has_biome_tag", "operator": "==", "value": "forest" }` |
| oregano | `morphood:oregano_seeds` | `{ "any_of": [ { "test": "has_biome_tag", "operator": "==", "value": "meadow" }, { "test": "has_biome_tag", "operator": "==", "value": "plains" } ] }` |
| pineapple | `morphood:pineapple_crown`, fixed count 1 (no `set_count`) | `{ "test": "has_biome_tag", "operator": "==", "value": "jungle" }` |

Add `terrain_texture.json` entries `morphood_wild_<plant>` -> `textures/blocks/<same>`, lang lines `tile.morphood:wild_<plant>.name=Wild <Plant>`, and in `blocks.json` give each wild block and each crop block `{ "sound": "grass" }`.

- [ ] **Step 4: Deploy and verify in a new world**

1. Deploy. Create a new world "Morphood Wild": Infinite (not flat), Creative, cheats on, both packs active. Features only generate in new chunks.
2. Content Log clean. A wrong file name vs identifier shows here.
3. `/locate biome plains`, `/tp` there, fly around: wild tomatoes appear in small patches on grass. Same for `forest` (garlic), `meadow` (oregano), `jungle` (pineapple).
4. Break a wild tomato: 1–2 tomato seeds. Break a wild pineapple: 1 crown.
5. `/give @s morphood:wild_tomato` and place it on grass and on stone: grass works, stone does not.

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

### Task 9: Polish (Norwegian names, ding sound, .mcaddon, Realm test)

Build order step 7. Kid session for names and sound; Stig handles the Realm upload.

**Files:**
- Modify: `packs/morphood_rp/texts/nb_NO.lang`
- Create: `packs/morphood_rp/sounds/sound_definitions.json`, `packs/morphood_rp/sounds/morphood/ding.ogg`
- Modify: `packs/morphood_bp/scripts/oven.js` (`DING_SOUND`)
- Create: `tools/export_mcaddon.ps1`
- Modify: `docs/test-checklist.md`

- [ ] **Step 1: Norwegian names**

`nb_NO.lang` gets one line per key in `en_US.lang` (same keys, Norwegian values):

```
item.morphood.tomato.name=Tomat
item.morphood.garlic.name=Hvitløk
item.morphood.oregano.name=Oregano
item.morphood.pineapple.name=Ananas
item.morphood.tomato_seeds.name=Tomatfrø
item.morphood.oregano_seeds.name=Oreganofrø
item.morphood.pineapple_crown.name=Ananaskrone
item.morphood.flour.name=Mel
item.morphood.pizza_dough.name=Pizzadeig
item.morphood.tomato_sauce.name=Tomatsaus
item.morphood.mozzarella.name=Mozzarella
item.morphood.pepperoni.name=Pepperoni
item.morphood.ham.name=Skinke
item.morphood.raw_pizza_margherita.name=Rå pizza margherita
item.morphood.raw_pizza_pepperoni.name=Rå pizza pepperoni
item.morphood.raw_pizza_prosciutto.name=Rå pizza prosciutto
item.morphood.raw_pizza_hawaii.name=Rå pizza Hawaii
item.morphood.pizza_margherita.name=Pizza margherita
item.morphood.pizza_pepperoni.name=Pizza pepperoni
item.morphood.pizza_prosciutto.name=Pizza prosciutto
item.morphood.pizza_hawaii.name=Pizza Hawaii
tile.morphood:pizza_oven.name=Pizzaovn
tile.morphood:tomato_crop.name=Tomatplante
tile.morphood:garlic_crop.name=Hvitløkplante
tile.morphood:oregano_crop.name=Oreganoplante
tile.morphood:pineapple_crop.name=Ananasplante
tile.morphood:wild_tomato.name=Vill tomat
tile.morphood:wild_garlic.name=Vill hvitløk
tile.morphood:wild_oregano.name=Vill oregano
tile.morphood:wild_pineapple.name=Vill ananas
```

Save the file as UTF-8. Verify `en_US.lang` has exactly the same 30 keys: `grep -c = packs/morphood_rp/texts/en_US.lang` and the same for `nb_NO.lang` both print 30.

- [ ] **Step 2: Oven ding sound**

1. Record or pick a short "ding" (under 1 s), export as OGG Vorbis mono to `packs/morphood_rp/sounds/morphood/ding.ogg` (Audacity: File > Export > OGG).
2. `packs/morphood_rp/sounds/sound_definitions.json`:

```json
{
  "format_version": "1.26.60",
  "sound_definitions": {
    "morphood.oven.ding": {
      "category": "block",
      "sounds": [{ "name": "sounds/morphood/ding", "volume": 1.0 }]
    }
  }
}
```

3. In `scripts/oven.js` change `const DING_SOUND = "random.orb";` to `const DING_SOUND = "morphood.oven.ding";`.

- [ ] **Step 3: Export script**

`tools/export_mcaddon.ps1`:

```powershell
# Bundles both packs into dist/morphood.mcaddon (a zip with the two pack folders at its root).
$repo = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $repo "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$zip = Join-Path $dist "morphood.zip"
$out = Join-Path $dist "morphood.mcaddon"
Remove-Item -Force -ErrorAction SilentlyContinue $zip, $out
Compress-Archive -Path (Join-Path $repo "packs\morphood_bp"), (Join-Path $repo "packs\morphood_rp") -DestinationPath $zip
Rename-Item $zip $out
Write-Host "Wrote $out"
```

Add `dist/` to `.gitignore`.

- [ ] **Step 4: Deploy and verify**

1. Deploy, re-enter. Content Log clean.
2. Settings > General > Language > Norsk bokmål: hover items and blocks, names are Norwegian. Switch back to English.
3. Bake a pizza: the custom ding plays when it finishes.
4. Run `tools\export_mcaddon.ps1`; double-click `dist\morphood.mcaddon`: Minecraft imports both packs ("Import complete"). On a second Windows account or PC, create a world with the imported packs and run the Hello pizza line.
5. Realm: upload "Morphood Test" to the Realm (Play > Edit world > Realms > Upload). On a console (Xbox/PlayStation/Switch) join the Realm, `/give @s morphood:pizza_oven`, bake one pizza, eat it.

Checklist:

```markdown
## Polish
- [ ] Norwegian names show with language set to Norsk bokmål (30 keys)
- [ ] Custom ding sound plays when a pizza finishes
- [ ] dist/morphood.mcaddon imports cleanly on another Windows install
- [ ] Realm: console player can craft, bake and eat a pizza
```

- [ ] **Step 5: Commit**

```bash
git add packs tools/export_mcaddon.ps1 .gitignore docs/test-checklist.md
git commit -m "Polish: Norwegian names, oven ding, mcaddon export"
```

---

## Self-review

- Spec 2.1 crops and wild plants: Tasks 7 and 8 (4 stages, farmland only, bone meal, seed-only immature drop, per-biome spawn, seed drops).
- Spec 2.2 ingredients and 2.3 pizzas: Tasks 3 and 4 (all recipes, bucket return, nausea, hunger above vanilla).
- Spec 2.4 oven recipe and states, 4.1 flow, 4.2 edge cases: Task 5 (every table row has a checklist line), model in Task 6.
- Spec 2.5 art rules: placeholders from Task 1; kids redraw in place (same file names, 16x16).
- Spec 3 architecture: one script module, block_placer with `use_on` farmland, feature rules, loot tables, `en_US`/`nb_NO`, sounds, Blockbench model.
- Spec 5 build order: Tasks 2–9 map to steps 1–7 in order; each ends playable.
- Spec 6 testing: Content Log check and `docs/test-checklist.md` lines in every task; wild plants tested in a new world.
- Names used across tasks are consistent: `morphood:raw_pizza_<name>` / `morphood:pizza_<name>` (Tasks 4, 5), `morphood:stage` / `morphood:pizza` (Tasks 5, 6), `morphood:growth` (Task 7), seed item ids (Tasks 3, 7, 8), texture names (Task 1 vs atlas entries in Tasks 2–8).
