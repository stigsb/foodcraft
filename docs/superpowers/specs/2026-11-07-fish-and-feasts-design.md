# Foodcraft v2 "Fish and Feasts": Design

Status: draft for review. Builds on v1 "Pizza Night" (`2026-11-06-pizza-night-design.md`); everything there stays.

v2 adds fish and shellfish, four new crops, two kitchen stations (cutting board and cooking pot), and four groups of dishes: fish, pasta, taco and baking.

## 1. Goals and constraints

- Same as v1. The kids build it, Claude explains and writes the harder script parts with them.
- Develop and test on Windows. Xbox, PlayStation and Switch players use it through a Realm.
- Every build step ends in something playable.
- Leave vanilla files alone where possible, so Foodcraft works next to other add-ons. That is why fish come from a script instead of an overwritten fishing loot table (3.1).
- Baked pizza stays the most filling food. The new dishes fill between vanilla food and pizza.

## 2. Content

### 2.1 Fish and shellfish

Fish are caught with a normal fishing rod. Which fish can bite depends on the biome where the hook lands. Each biome with water belongs to one water zone, matched to the climate the real fish live in. Every zone has at least one Foodcraft fish.

**Species** (13). Fillets is what the cutting board gives (2.4): small fish 1, medium 2, large 3.

| Fish | Water | Real home | Fillets |
|---|---|---|---|
| Arctic char (røye) | Fresh | Cold mountain lakes and Arctic rivers | 1 |
| Trout (ørret) | Fresh | Cold, clear rivers and lakes | 2 |
| Perch (abbor) | Fresh | Temperate lakes and slow rivers | 1 |
| Pike (gjedde) | Fresh | Temperate lakes, rivers, reedy swamps | 2 |
| Catfish (malle) | Fresh | Warm, muddy rivers, lakes and swamps | 3 |
| Piranha (piraja) | Fresh | Tropical rivers (Amazon) | 1 |
| Herring (sild) | Salt | Cool and temperate seas, big schools | 1 |
| Mackerel (makrell) | Salt | Temperate to warm seas | 1 |
| Saithe (sei) | Salt | Cold and temperate North Atlantic | 2 |
| Atlantic wolffish (steinbit) | Salt | Cold, rocky sea floor, Arctic | 2 |
| Halibut (kveite) | Salt | Cold and Arctic deep water | 3 |
| Tuna (tunfisk) | Salt | Warm and lukewarm open sea | 3 |
| Swordfish (sverdfisk) | Salt | Warm and tropical open sea | 3 |

**Water zones.** "Lake" means water in a land biome: lakes, ponds and flooded pits get the fish of the climate around them. Rivers have their own biome in Minecraft (one for all climates, one frozen).

| Zone | Minecraft biomes | Fish that can bite |
|---|---|---|
| Arctic sea | Frozen ocean, deep frozen ocean, snowy beach | Halibut, wolffish |
| Cold sea | Cold ocean, deep cold ocean, stony shore | Saithe, halibut, herring, wolffish |
| Temperate sea | Ocean, deep ocean, beach, mushroom fields | Herring, mackerel, saithe |
| Warm sea | Lukewarm ocean, deep lukewarm ocean | Mackerel, tuna, swordfish |
| Tropical sea | Warm ocean, deep warm ocean | Tuna, swordfish |
| Frozen river | Frozen river | Arctic char, trout |
| River | River | Trout, perch, pike |
| Cold lakes | Taiga, old growth taiga (both kinds), snowy taiga, snowy plains, ice spikes, grove, snowy slopes, meadow, windswept hills, windswept forest, windswept gravelly hills, jagged, frozen and stony peaks | Arctic char, trout |
| Temperate lakes | Plains, sunflower plains, forest, flower forest, birch forest, old growth birch forest, dark forest, pale garden, cherry grove | Pike, perch |
| Swamps | Swamp, mangrove swamp | Pike, catfish |
| Dry warm lakes | Savanna, savanna plateau, windswept savanna, desert, badlands (all kinds) | Catfish |
| Tropical lakes | Jungle, sparse jungle, bamboo jungle | Piranha, catfish |

- Cave biomes (lush caves, dripstone caves, deep dark) and the Nether and End keep vanilla fishing only.
- When a player catches a vanilla fish (cod, salmon, tropical fish or pufferfish) in a zone, there is a 50 % chance it turns into one of that zone's Foodcraft fish, picked at random. Treasure and junk catches are never replaced. In the zones with only one fish (dry warm lakes) that fish comes up every time a swap happens.
- The biome list is checked against the Minecraft version in the plan. New biomes in later updates fall back to vanilla fishing until they are added to a zone.
- Every fish has a raw and a cooked item. Raw fish cooks in a furnace, smoker or campfire. Raw fish gives little hunger, cooked fish about as much as cooked salmon.
- Fish fillets come from the cutting board (2.4). All fish give the same fish fillet item, except tuna, which gives tuna fillets (used for sushi and tuna pizza). A fillet is raw; a cooked fillet comes from the furnace, smoker or campfire.

**Scallops (kamskjell)** are not fished. They are a small block on the sea floor in cold, lukewarm and normal oceans, placed by feature rules like the v1 wild plants. Breaking one drops 1–2 scallops. Raw scallops cook into grilled scallops in the furnace, smoker or campfire.

### 2.2 New crops

They work like the v1 crops: 4 growth stages, planted on farmland, bone meal, a wild plant that spawns in its biomes.

| Wild plant | Biomes | Breaking drops | Crop harvest (mature) |
|---|---|---|---|
| Wild corn (mais) | Savanna, plains | Corn kernels | 1–2 corn cobs + 1–2 corn kernels |
| Wild lettuce (salat) | Forest, flower forest | Lettuce seeds | 1 lettuce + 1–2 lettuce seeds |
| Wild rice (ris) | Swamp, mangrove swamp | Rice grains | 2–3 rice (rice is planted directly, like garlic) |
| Wild cinnamon (kanel) | Jungle | Cinnamon cutting | 1–2 cinnamon sticks + 1 cinnamon cutting |

### 2.3 Vanilla ingredients used

Potato, carrot, egg, sugar, cocoa beans, sweet berries, dried kelp, raw beef, bowl, glass bottle, water bucket and milk bucket. Players already know where to find them.

### 2.4 Cutting board (skjærebrett)

A low block. Recipe: 3 wooden slabs in a row. Chopping needs a **knife (kniv)**: iron ingot over a stick, uses durability like a tool.

1. Right-click the board with an ingredient from the table below: one is taken from the hand and lies on the board.
2. Right-click the board with the knife three times: chop sound and particles each time, the knife loses 1 durability per chop.
3. After the third chop the result pops out on top of the board, and the board is empty again.

| On the board | Result |
|---|---|
| Any raw Foodcraft fish | Fish fillets (1–3, see 2.1) |
| Raw beef | 2 minced meat (kjøttdeig) |
| Potato | Raw fries (rå pommes frites) |
| Pizza dough | 2 raw pasta |

Edge cases:

| Situation | Behavior |
|---|---|
| Right-click an empty board with something not in the table | Nothing taken. Action bar: "Put something to chop on the board" |
| Right-click a full board with anything but the knife | Action bar: "Chop it with a knife". Empty hand takes the ingredient back |
| Board broken while full | Drops the board plus the ingredient |
| Creative mode | Ingredient not consumed, knife takes no damage |

### 2.5 Cooking pot (kokegryte)

Recipe: iron ingots in a U shape (like a cauldron) with a bucket in the middle. The pot only cooks when it stands on a lit campfire.

1. Right-click with a water bucket: the pot fills with water, the bucket comes back empty.
2. Right-click with ingredients, one at a time: each goes in the water. The pot holds up to 4.
3. As soon as the ingredients match a recipe below, the pot starts cooking (bubbles, sound) for 10 seconds.
4. When done, the pot holds 3 portions. Right-click with a bowl to take one. After the third, the pot is empty (no water).

| Dish | Ingredients in the pot |
|---|---|
| Fish soup (fiskesuppe) | Fish fillet + potato + carrot |
| Spaghetti bolognese | Raw pasta + minced meat + tomato sauce |
| Mac and cheese | Raw pasta + mozzarella + mozzarella |
| Rice porridge (risgrøt) | Rice + rice + milk bucket (the empty bucket comes back) + sugar |

Edge cases:

| Situation | Behavior |
|---|---|
| No lit campfire under the pot | Ingredients can go in, but nothing cooks. Action bar: "The pot needs a lit campfire under it" |
| Ingredient that is in no recipe | Not taken. Action bar: "That doesn't go in the pot" |
| 4 ingredients and no match | Action bar: "That's not a recipe". Empty hand takes the last ingredient back out |
| Right-click with a bowl while cooking | Action bar: "Still cooking…" |
| Pot broken | Drops the pot and any ingredients not yet cooked. Cooked portions are lost |
| World closed mid-cook | Same rule as the oven: finishes 10 s after it is next ticked |

### 2.6 Pizza oven, extended

The v1 oven bakes more than pizza. The `foodcraft:pizza` state becomes `foodcraft:dish` with these values: `none`, the four v1 pizzas, `tuna`, `lasagna`, `cinnamon_buns`, `brownies`, `waffles`. The oven model gets a bone for each new dish. All v1 oven behavior and edge cases stay the same.

### 2.7 Dishes

Made at the crafting table unless a station is named. "Raw X" means the raw version is crafted and the oven, furnace or pot turns it into X.

**Fish**

| Dish | How |
|---|---|
| Fish cakes (fiskekaker) | Fish fillet + egg + flour -> 2 raw fish cakes -> furnace |
| Fish and chips | Cooked fish fillet + fries + paper. Fries: raw fries -> furnace |
| Sushi | Tuna fillet + rice + dried kelp -> 3 sushi |
| Grilled scallops | Scallop -> furnace or campfire (2.1) |
| Tuna pizza | Dough + tomato sauce + mozzarella + tuna fillet -> raw -> pizza oven |
| Fish soup | Cooking pot (2.5) |

**Pasta**

| Dish | How |
|---|---|
| Spaghetti bolognese | Cooking pot (2.5) |
| Mac and cheese | Cooking pot (2.5) |
| Lasagna | Raw pasta + minced meat + tomato sauce + mozzarella -> raw lasagna -> pizza oven |

**Taco**

| Dish | How |
|---|---|
| Corn flour (maismel) | 1 corn cob, shapeless |
| Tortilla | Corn flour -> furnace |
| Cooked minced meat | Minced meat -> furnace |
| Taco | Tortilla + cooked minced meat + lettuce + tomato + mozzarella |

**Baking and sweets**

| Dish | How |
|---|---|
| Cinnamon buns (kanelsnurrer) | Pizza dough + sugar + cinnamon stick -> 3 raw buns -> pizza oven |
| Brownies | Flour + cocoa beans + egg + sugar -> raw brownies -> pizza oven |
| Batter (røre) | Flour + egg + milk bucket + sugar, bucket returned |
| Pancakes (pannekaker) | Batter -> furnace |
| Waffles (vafler) | Batter -> pizza oven (the oven doubles as a waffle iron) |
| Jam (syltetøy) | 3 sweet berries + sugar + glass bottle. Eating it gives the bottle back |
| Rice porridge | Cooking pot (2.5) |

Hunger tiers, lowest to highest: raw ingredients, cooked fish and simple items (fries, tortilla), snacks (sushi, pancakes, waffles, cinnamon buns, brownies, jam), meals (soups, pasta dishes, taco, fish and chips, fish cakes), baked pizza and lasagna. Exact numbers are set in the plan.

### 2.8 Visual rules

As in v1: 16×16 textures with a dark outline, drawn by Ravn and Kasper in Blockbench, starting from generated placeholders. Raw and cooked versions must be easy to tell apart. The cutting board and the pot show what is in them (ingredient on the board, water and food colour in the pot).

## 3. Architecture

Same two packs. New parts:

| Part | Mechanism |
|---|---|
| Fish, ingredients, dishes, knife | Item JSON. Knife uses `minecraft:durability` |
| Cooking of single items | Furnace, smoker and campfire recipe JSON |
| New crops and wild plants | v1 crop component and feature rules, reused |
| Scallop block | Custom block on the sea floor, placed by feature rules, loot table drop |
| Biome fish | Script. When a vanilla fish item appears at a player's fishing hook, look up the biome (`Dimension.getBiome`) and maybe replace the item |
| Cutting board | Custom block, script custom component. States: ingredient on the board, chop count |
| Cooking pot | Custom block, script custom component. States: water, cooking, done, portions left, dish. The ingredient list lives in a dynamic property keyed by the block position |
| Oven | v1 component, with the state renamed to `foodcraft:dish` and a list of raw item -> baked item instead of four fixed pizzas |

### 3.1 Risks to check first in the plan

- **Catching a fish from script.** There is no fishing event. The plan must prove, before anything else is built on it, that a script can see the caught item appear (an item entity spawning at the hook) and swap it. Fallback: override `loot_tables/gameplay/fishing/fish.json` with all 13 fish in every biome, and drop the biome rule.
- **Renaming the oven state.** Ovens already placed in a v1 world have the old `foodcraft:pizza` state. The plan checks what Minecraft does with them and, if needed, keeps the old state name.
- **The pot's ingredient list** cannot be a block state. If dynamic properties keyed by position turn out unreliable (for example after the pot is moved by a piston), use one state per recipe slot instead.

## 4. Build order

Each step is playable before the next starts. Step 0 is v1's own in-game test, so v2 is not built on bugs.

0. Test v1 in game and fix what breaks.
1. Fish: 13 fish, raw and cooked, caught by water zone (prove the fishing script first). Scallops on the sea floor.
2. Cutting board and knife: fillets, minced meat, raw fries, raw pasta.
3. New crops: corn, lettuce, rice, cinnamon, with wild plants.
4. Cooking pot: fish soup, bolognese, mac and cheese, rice porridge.
5. Fish dishes: fish cakes, fish and chips, sushi, grilled scallops; oven extended with tuna pizza.
6. Pasta and taco: lasagna, corn flour, tortilla, taco.
7. Baking: cinnamon buns, brownies, batter, pancakes, waffles, jam.
8. Polish: Norwegian names, textures by the kids, sounds (chop, bubbling pot), `.mcaddon`, Realm test.

## 5. Testing

As in v1: no errors in the content log, one line per item, recipe and station edge case in `docs/test-checklist.md`, and spawning (wild plants, scallops) checked in a new world.

## 6. Out of scope for v2

- Live fish swimming in the water (own mobs with models and animations).
- Villagers planting crops and trading food.
- Wok, juicer, frying pan.
- Burnt food, fuel for the oven, several dishes at once.
- More cheeses (cheddar, Jarlsberg, gräddost), noodles, soy, chili sauce, mustard, pumpkin soup, taco variants.
