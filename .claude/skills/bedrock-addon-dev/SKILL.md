---
name: bedrock-addon-dev
description: Technical rules and gotchas for building Minecraft Bedrock add-ons (behavior + resource packs) with JSON and the @minecraft/server Script API. Use whenever you add or change blocks, items, recipes, entities, spawn rules, features, biome filters, models, textures, sounds or scripts in this repo, or answer how something works in Bedrock.
---

# Building Bedrock add-ons

Learned while building Foodcraft (v0.1 Pizza Night, v0.2 Fish and Feasts). Nothing here has been verified in game yet unless marked; it is checked against Microsoft Learn, Mojang's bedrock-samples, the `@minecraft/server` typings and `@minecraft/vanilla-data`. When the user reports content-log errors or in-game behaviour, trust that over this file and update this file.

## Check, don't remember

- Pin versions and check them before writing: Bedrock **1.26.60**, `@minecraft/server` **2.11.0** (stable; check `npm view @minecraft/server dist-tags`, a newer one may be beta). `format_version`: items/blocks/recipes `"1.26.50"`, features `"1.21.10"`, feature rules `"1.13.0"`, entities `"1.21.0"`, spawn rules `"1.8.0"`, client entities `"1.10.0"`. Manifest `format_version: 2`, `min_engine_version [1, 26, 60]`.
- Look up script APIs in the unpacked typings (`npm pack @minecraft/server@2.11.0`, read `index.d.ts`) and vanilla ids/states in `@minecraft/vanilla-data`. Look up vanilla JSON (entities, spawn rules, biomes, animations) in `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/...`; biomes are `behavior_pack/biomes/<name>.biome.json`. A dedicated-server download only has `__brarchive` blobs, not readable JSON.
- Run `node tools/check_packs.cjs` and `node --check` on every script after each change. It cross-checks icons → atlas → PNG, lang keys in both languages, geometry ids and bone names, bone_visibility states, loot items, feature chains, recipe ids and registered components.

## Blocks

- Custom Components V2: put the component straight under `components` (`"foodcraft:crop": {}`), never `minecraft:custom_components`. Register in `system.beforeEvents.startup.subscribe(e => e.blockComponentRegistry.registerCustomComponent(...))`; items use `e.itemComponentRegistry`. No experiments needed.
- Component parameters: `"foodcraft:crop": { "top": "...", "top_from": 2 }` arrives as the second callback argument, `(event, { params })`. Use this instead of one component per variant.
- `onTick` needs `minecraft:tick` (`interval_range`, `looping`) on the block, or it is a content error. Keep the script's interval constant equal to `interval_range`.
- `onPlayerBreak` fires only for players. Explosions, pistons and `/setblock` skip it, so state kept in dynamic properties by position must also be cleared when the block is reused (a new block at the same spot inherited old contents once).
- A block needs both `minecraft:geometry` and `minecraft:material_instances`. Block bones can't animate: switch looks with `bone_visibility` Molang (`q.block_state('ns:s') == 2`) and change states from script.
- Two-block plants: the lower block carries growth, loot and the script; the top block has `placement_filter` on the lower block, an empty loot table (`{ "pools": [] }`), the same growth state for looks, and the same component with a `lower` param. Breaking the top runs `setblock … air destroy` on the lower half; breaking the lower half pops the top through its placement filter. A plant with no room above must stop growing.
- Lang: `tile.<ns>:<name>.name` (colon) for blocks, `item.<ns>.<name>.name` (dot) for items, `entity.<ns>:<name>.name` and `item.spawn_egg.entity.<ns>:<name>.name` for entities. `blocks.json` is only for sounds.

## Items, food, recipes

- `minecraft:food` has no effect field. Apply effects in `world.afterEvents.itemCompleteUse`.
- A weapon: `minecraft:damage { value }`, `minecraft:durability`, `hand_equipped: true`, `can_destroy_in_creative: false`. Durability loss on hits is built in.
- Hand-held item icons: the hand holds the **bottom-left** corner, so a tool's handle goes bottom left and the blade top right. Thin icons get no dark outline, or they turn into a dark line.
- `minecraft:block_placer` needs item format ≥ 1.21.50; `minecraft:liquid_detection` ≥ 1.21.60.
- A recipe that gives a bucket back must be **shaped**: only shaped recipes accept an array `result` (`[{item}, {"item": "minecraft:bucket"}]`). Tags work in keys: `{"tag": "minecraft:wooden_slabs"}`.
- Creative mode never uses up items in your scripts (`isCreative` checks). Test consumption in survival, or the user will report "it doesn't use up the item".

## Script API

- Before-events are read-only. Decide and set `event.cancel = true` in the before-event, then change the world in `system.run(() => ...)`. Re-check `block.isValid` there.
- Prefer a vanilla block plus a script over a custom block that imitates it. The cooking pot became a vanilla cauldron on a lit campfire: Minecraft handles the water bucket itself, and `BlockComponentTypes.FluidContainer` gives `fillLevel` (full = 6), `fluidColor` (RGBA 0–1) and `getFluidType()`. Intercept other clicks with `world.beforeEvents.playerInteractWithBlock`; only act on `isFirstEvent`.
- Vanilla blocks have no custom component, so tick them with `system.runInterval` over positions stored as dynamic properties (`world.getDynamicPropertyIds()` with a prefix).
- Campfire lit = `extinguished` state `false` (also `soul_campfire`).
- Show item names in the player's language with rawtext: `{ rawtext: [{ translate: new ItemStack(id).localizationKey }] }`.
- No fishing catch event exists. Watch `world.afterEvents.entitySpawn` for an item entity near a `minecraft:fishing_hook` and swap its item next tick (unverified in game).
- Wrap sounds and particles in try/catch: a bad id must not undo game logic.

## Entities (mobs)

- Copy the vanilla behaviour components from bedrock-samples (`behavior_pack/entities/fish.json` for cod) and adapt; the fish face **-Z** in the geometry (head at negative z).
- Spawn eggs come from `is_spawnable: true` plus `spawn_egg { base_color, overlay_color }` in the client entity, and a lang line.
- Bucket capture without script: `minecraft:interact` with a `has_equipment` water_bucket filter, `transform_to_item: "<ns>:<fish>_bucket"`, an event that adds a group with `minecraft:instant_despawn`. Releasing is an item custom component `onUseOn` that places water and spawns the entity.
- Animate with your own Molang (`math.sin(query.life_time * 540) * 25`) and `scripts.animate` conditions (`query.is_in_water`) rather than engine variables you can't see.

## Biomes and spawning

- Bedrock biome ids differ from Java: `cold_beach`, `stone_beach`, `mushroom_island`, `ice_plains`, `extreme_hills*`, `mega_taiga*`, `roofed_forest*`, `mesa*`, `swampland*`; 1.26 adds `dappled_forest` and `sulfur_caves`.
- Feature rules and spawn rules can only test **tags**, not biome ids, and the tags are irregular: lukewarm oceans have no `warm`; `flower_forest` has no `forest`; `mangrove_swamp` has its own tag; some `_mutated` biomes have `overworld_generation` instead of `overworld`.
- So generate tag filters from data and verify them: `tools/data/biome_tags.json` holds the tags of all 89 vanilla biomes, and `tools/make_fish_mobs.mjs` builds an `any_of`/`all_of` filter per species and checks that it matches exactly the wanted biomes. Reuse that approach for any biome-dependent feature.
- `query.above_top_solid(x, z)` in a feature rule gives the sea floor + 1 under water.

## Models and textures

- Blockbench `.bbmodel` → Bedrock geo (`tools/bbmodel_to_geo.mjs`): flip X, flip the sign of the X and Y rotations, swap the up/down UV corners, read Blockbench 5's separate `groups` list, centre block models on x/z −8..8, single-axis rotations in 22.5° steps.
- Generated models use box UV with integer sizes; zero-width cubes make fins and planes.
- Stepped voxel "round" shapes of a small block look bad. Prefer a vanilla block, or have the kids model it in Blockbench.
- Pixel art: draw 16×16 textures as ASCII grids with a named palette in a script (`tools/art_corn.mjs`) and render a preview PNG to look at before committing.
- Generators must never overwrite existing textures (they may be the kids' drawings): write a placeholder only when the file is missing. Art scripts that deliberately overwrite say so at the top.

## Packaging, caching, Realms

- `.mcaddon` = zip with `<bp>/manifest.json` and `<rp>/manifest.json` at the root and `/` in entry names. Windows PowerShell 5.1 `Compress-Archive` writes `\` and can break the import: build with `System.IO.Compression.ZipArchive`.
- Players and Realms cache packs by UUID **and version**. Changed content under an unchanged version is ignored by anyone who has it, Realm players included. Bump the version on every content change. On a Realm, activate the new pack versions in the Realm settings or upload a world that has them (that replaces the Realm world).
- Windows GDK build (1.21.120+) dev folders: `%APPDATA%\Minecraft Bedrock\users\shared\games\com.mojang\development_behavior_packs` / `development_resource_packs`; logs in `%APPDATA%\Minecraft Bedrock\logs`.
- Sounds: `sound_definitions.json` paths have no extension; OGG is safest.
