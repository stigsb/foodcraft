# Pizza Night test checklist

Tick a line only after seeing it work in the test world with an empty Content Log.

## Items
- [ ] Tomato: `/give @s foodcraft:tomato`, name "Tomato", eats, hunger goes up
- [ ] Garlic: `/give @s foodcraft:garlic`, name "Garlic", eats, hunger goes up
- [ ] Oregano: `/give @s foodcraft:oregano`, name "Oregano", eats, hunger goes up
- [ ] Pineapple: `/give @s foodcraft:pineapple`, name "Pineapple", eats, hunger goes up
- [ ] Tomato Seeds: `/give @s foodcraft:tomato_seeds`, name "Tomato Seeds", right texture
- [ ] Oregano Seeds: `/give @s foodcraft:oregano_seeds`, name "Oregano Seeds", right texture
- [ ] Pineapple Crown: `/give @s foodcraft:pineapple_crown`, name "Pineapple Crown", right texture
- [ ] Flour: `/give @s foodcraft:flour`, name "Flour", right texture
- [ ] Pizza Dough: `/give @s foodcraft:pizza_dough`, name "Pizza Dough", right texture
- [ ] Tomato Sauce: `/give @s foodcraft:tomato_sauce`, name "Tomato Sauce", right texture
- [ ] Mozzarella: `/give @s foodcraft:mozzarella`, name "Mozzarella", right texture
- [ ] Pepperoni: `/give @s foodcraft:pepperoni`, name "Pepperoni", eats, hunger goes up
- [ ] Ham: `/give @s foodcraft:ham`, name "Ham", eats, hunger goes up
- [ ] Raw Pizza Margherita: `/give @s foodcraft:raw_pizza_margherita`, name "Raw Pizza Margherita", right texture, eats
- [ ] Raw Pizza Pepperoni: `/give @s foodcraft:raw_pizza_pepperoni`, name "Raw Pizza Pepperoni", right texture, eats
- [ ] Raw Pizza Prosciutto: `/give @s foodcraft:raw_pizza_prosciutto`, name "Raw Pizza Prosciutto", right texture, eats
- [ ] Raw Pizza Hawaii: `/give @s foodcraft:raw_pizza_hawaii`, name "Raw Pizza Hawaii", right texture, eats
- [ ] Pizza Margherita: `/give @s foodcraft:pizza_margherita`, name "Pizza Margherita", right texture, eats
- [ ] Pizza Pepperoni: `/give @s foodcraft:pizza_pepperoni`, name "Pizza Pepperoni", right texture, eats
- [ ] Pizza Prosciutto: `/give @s foodcraft:pizza_prosciutto`, name "Pizza Prosciutto", right texture, eats
- [ ] Pizza Hawaii: `/give @s foodcraft:pizza_hawaii`, name "Pizza Hawaii", right texture, eats

## Recipes
- [ ] Flour: 1 wheat -> 1 flour
- [ ] Pizza dough: 3 flour over a water bucket -> dough, empty bucket stays in the grid output
- [ ] Tomato sauce: 2 tomato + garlic + oregano + bowl -> sauce
- [ ] Mozzarella: milk bucket -> mozzarella, empty bucket returned
- [ ] Pepperoni: raw porkchop + oregano -> pepperoni
- [ ] Ham: cooked porkchop -> 2 ham
- [ ] Raw pizza margherita: dough + sauce + mozzarella + oregano
- [ ] Raw pizza pepperoni: dough + sauce + mozzarella + pepperoni
- [ ] Raw pizza prosciutto: dough + sauce + mozzarella + ham
- [ ] Raw pizza hawaii: dough + sauce + mozzarella + ham + pineapple

## Pizzas
- [ ] Eating a raw pizza (any kind) gives Nausea for 10 s (screen wobbles, effect icon shows)
- [ ] Eating a baked pizza fills the hunger bar from empty to full with saturation to spare

## Oven
- [ ] Oven recipe: BBB / BFB / SSS (brick block, furnace, stone) -> pizza oven
- [ ] Placed oven faces the player
- [ ] Right-click empty oven with raw pizza: pizza taken, oven glows (light 10) and smokes
- [ ] After 10 s: ding sound, front texture shows a pizza
- [ ] Right-click done oven: get the matching baked pizza, oven empty again
- [ ] Right-click empty oven with anything else: action bar "Put something raw in the oven", nothing consumed
- [ ] Right-click while baking: action bar "Still baking…"
- [ ] Break oven while baking: drops oven + raw pizza
- [ ] Break oven while done: drops oven + baked pizza
- [ ] Start baking, Save & Quit, re-enter: oven still baking, finishes within 10 s of entering
- [ ] Two players click a done oven at once (second account or split screen): only one baked pizza comes out
- [ ] Creative mode: raw pizza stack does not shrink
- [ ] Survival mode: raw pizza stack shrinks by one
- [ ] Fill inventory (`/give @s dirt 64` until full), take out a baked pizza: it drops in front of the oven
- [ ] Pizza left in a done oven for 5 minutes is still there
- [ ] Oven model: flame shows while baking, correct pizza shows when done, empty when empty (all four pizzas)

## Crops
- [ ] Oregano seeds plant only on farmland
- [ ] Oregano crop grows through 4 stages on random ticks (randomtickspeed 300)
- [ ] Bone meal advances oregano crop and is consumed in survival
- [ ] Immature oregano crop drops 1 seed; mature drops 1–2 oregano + 1–2 seeds
- [ ] Crop pops off when its farmland is broken
- [ ] Garlic plants only on farmland (from the garlic item itself)
- [ ] Garlic crop grows through 4 stages on random ticks (randomtickspeed 300)
- [ ] Bone meal advances garlic crop and is consumed in survival
- [ ] Immature garlic crop drops 1 garlic; mature drops 2–4 garlic
- [ ] Garlic crop pops off when its farmland is broken

## Tomato plant
- [ ] Tomato seeds plant only on farmland
- [ ] Tomato plant grows sprout, small plant, two blocks tall, then flowers and ripens small green, green, orange, red (randomtickspeed 300)
- [ ] Tomato plant does not grow tall when the block above is taken
- [ ] Bone meal moves the tomato plant one stage and is consumed in survival
- [ ] Using a red plant gives 2–3 tomatoes, leaves empty calyxes, and the plant ripens again
- [ ] Breaking either half removes the whole plant; red drops 2–3 tomatoes + 1–2 seeds, otherwise 1 seed
- [ ] Tomato plant pops off when its farmland is broken

## Pineapple plant
- [ ] Pineapple crown plants only on farmland
- [ ] Pineapple grows small, medium, full rosette, then flower spike, small green, green, golden (randomtickspeed 300)
- [ ] Bone meal moves the pineapple one stage and is consumed in survival
- [ ] Using a golden plant gives 1 pineapple, leaves a cut stalk, and the plant ripens again
- [ ] Breaking a golden plant drops 1 pineapple + 1 crown, otherwise 1 crown
- [ ] Pineapple plant pops off when its farmland is broken

## Wild plants (new world)
- [ ] Wild tomato spawns in plains, drops 1–2 tomato seeds
- [ ] Wild garlic spawns in forest, drops 1–2 garlic
- [ ] Wild oregano spawns in meadow and plains, drops 1–2 oregano seeds
- [ ] Wild pineapple spawns in jungle, drops 1 pineapple crown
- [ ] Wild plants only place on grass/dirt type blocks

## Polish
- [ ] Norwegian names show with language set to Norsk bokmål (31 keys)
- [ ] Custom ding sound plays when a pizza finishes
- [ ] dist/foodcraft.mcaddon imports cleanly on another Windows install
- [ ] Realm: console player can craft, bake and eat a pizza

## v2: Fish (Task 2)
- [ ] `/give @s foodcraft:trout` (and the other 12): name, icon, eats
- [ ] Every raw fish cooks in furnace, smoker and campfire into its cooked fish
- [ ] Norwegian names show with the game language set to Norsk

## v2: Fishing (Task 3) — new world "Foodcraft Ocean Test"
- [ ] River: trout, perch and pike come up among vanilla fish (about half the fish catches)
- [ ] Frozen river: arctic char, trout
- [ ] Ocean / deep ocean: herring, mackerel, saithe
- [ ] Cold ocean: saithe, halibut, herring, wolffish
- [ ] Frozen ocean: halibut, wolffish
- [ ] Lukewarm ocean: mackerel, tuna, swordfish; warm ocean: tuna, swordfish
- [ ] Lake in a taiga or snowy biome: arctic char, trout
- [ ] Lake in plains or forest: pike, perch
- [ ] Swamp: pike, catfish; lake in savanna or desert: catfish; lake in jungle: piranha, catfish
- [ ] Treasure and junk catches are never swapped
- [ ] A swapped fish flies to the player like a normal catch
- [ ] Killing a cod with a sword drops a normal cod
- [ ] Lush caves water: vanilla fish only

## v2: Scallops (Task 4) — new world
- [ ] Scallop beds lie on the sea floor in normal, cold and lukewarm oceans, never in frozen or warm ones
- [ ] The bed sits in water (no air pocket)
- [ ] Breaking a bed drops 1–2 scallops
- [ ] Scallop cooks into grilled scallop in furnace, smoker and campfire

## v2: Cutting board (Task 5)
- [ ] Knife: iron ingot over stick; board: 3 wooden slabs (any wood)
- [ ] Right-click board with a trout: trout lies on the board (medium fish shape), one trout taken
- [ ] Three right-clicks with the knife: chop sound each time, then 2 fish fillets pop out, board empty
- [ ] Tuna gives 3 tuna fillets; herring gives 1 fish fillet; halibut gives 3 fish fillets
- [ ] Beef -> 2 minced meat; potato -> raw fries; pizza dough -> 2 raw pasta
- [ ] Empty board, holding dirt: action bar "Put something to chop on the board", nothing taken
- [ ] Full board, holding dirt: action bar "Chop it with a knife"
- [ ] Full board, empty hand: the exact item comes back (the same fish species)
- [ ] Break a full board: drops the board and the item
- [ ] Knife loses 1 durability per chop and breaks with a sound at 128 chops (survival)
- [ ] Creative: ingredient not taken, knife not worn
- [ ] Fillet, minced meat and raw fries cook in the furnace
- [ ] Knife held in hand: handle in the fist, blade pointing forward (v0.2.1)
- [ ] Knife as a weapon: hits harder than a fist, loses durability per hit; creative swing does not break blocks (v0.2.1)

## v2: New crops (Task 6)
- [ ] Corn kernels, lettuce seeds, rice and cinnamon cutting plant on farmland only
- [ ] Each crop shows 4 stages, grows on its own and with bone meal
- [ ] Mature harvests as in spec 2.2; immature drops only the seed item
- [ ] New world: wild corn in savanna and plains, wild lettuce in forests, wild rice in swamps, wild cinnamon in jungles

## v2: Cooking pot — vanilla cauldron on a campfire (v0.2.4)
- [ ] Cauldron on a lit campfire, filled with a water bucket (Minecraft fills it as usual)
- [ ] Ingredient into an empty cauldron: "Fill the cauldron with a water bucket first", nothing taken
- [ ] Ingredients go in one at a time; the action bar lists what is in the pot (names in the game language)
- [ ] Wrong ingredient: "That doesn't go in the pot", nothing taken
- [ ] Empty hand takes the last ingredient back out
- [ ] With ingredients in: buckets, bottles and blocks do nothing ("Take the ingredients out first")
- [ ] Fish soup, bolognese, mac and cheese, rice porridge: each starts cooking on its last ingredient (smoke), done after 10 s
- [ ] Done: the water takes the dish's colour
- [ ] Milk bucket goes in and the empty bucket comes back
- [ ] No campfire: "The pot needs a lit campfire under it"; light one later and it starts by itself
- [ ] Put out the campfire mid-cook: cooking pauses; relight: it finishes
- [ ] While cooking: "Still cooking…"; buckets and bottles do nothing
- [ ] Done: three bowls take three portions, the water drops each time, then the cauldron is empty
- [ ] Done + no bowl: "Take the food out with a bowl"
- [ ] Break the cauldron with ingredients in: they drop (no milk bucket); break while done: no food drops
- [ ] Save & Quit mid-cook, re-enter: finishes within 10 s
- [ ] A cauldron without ingredients still works as normal (buckets, bottles, dyes)
- [ ] Creative: ingredients and buckets not used up

## v2: Oven extended (Task 8)
- [ ] All four v1 pizzas still bake in a newly placed oven
- [ ] Raw tuna pizza: dough + sauce + mozzarella + tuna fillet; eating it gives nausea
- [ ] Tuna pizza bakes in 10 s, done oven shows it, take-out gives tuna pizza
- [ ] Right-click empty oven with dirt: "Put something raw in the oven"

## v2: Fish dishes (Task 9)
- [ ] Fish fillet + egg + flour -> 2 raw fish cakes -> furnace -> fish cakes
- [ ] Cooked fish fillet + fries + paper -> fish and chips
- [ ] Tuna fillet + rice + dried kelp -> 3 sushi
- [ ] Each dish eats and fills less than a baked pizza

## v2: Pasta and taco (Task 10)
- [ ] Raw pasta + minced meat + tomato sauce + mozzarella -> raw lasagna -> pizza oven -> lasagna (oven shows it)
- [ ] Corn -> corn flour -> furnace -> tortilla
- [ ] Tortilla + cooked minced meat + lettuce + tomato + mozzarella -> taco

## v2: Baking (Task 11)
- [ ] Pizza dough + sugar + cinnamon stick -> raw cinnamon buns -> oven -> 3 cinnamon buns
- [ ] Flour + cocoa beans + egg + sugar -> raw brownies -> oven -> 4 brownies
- [ ] Flour, egg, sugar over a milk bucket -> batter, empty bucket returned
- [ ] Batter -> furnace -> pancakes; batter -> pizza oven -> 3 waffles
- [ ] 3 sweet berries + sugar + glass bottle -> jam; eating jam gives the bottle back
- [ ] Breaking an oven while baking buns drops the raw buns; while done drops 3 buns

## v2: Swimming fish (v0.2.5) — new world
- [ ] All 13 spawn eggs are in the creative inventory with the fish's colours and names (Norsk too)
- [ ] Each fish swims, wiggles its tail and flops on land; it faces the way it swims (head first)
- [ ] Shapes: halibut flat with eyes on top, swordfish with bill and sail, catfish with whiskers, piranha short and deep
- [ ] Fish appear on their own in their waters: trout/perch/pike in rivers, herring/mackerel/saithe in normal ocean, tuna/swordfish in warm oceans, arctic char/trout in taiga or snowy lakes, pike/perch in plains and forest lakes, catfish/piranha in jungle lakes
- [ ] No Foodcraft fish in lush caves, deep dark or the Nether
- [ ] Killing a fish drops its raw fish (cooked if it was burning), sometimes bone meal
- [ ] Water bucket on a fish: it disappears and the bucket becomes "Bucket of <fish>" with a fish icon
- [ ] Bucket of <fish> used on a block: water appears next to it with the fish in it, empty bucket back (survival)
- [ ] Fish don't despawn while in a bucket-made aquarium as long as players are close; they swim away from players
