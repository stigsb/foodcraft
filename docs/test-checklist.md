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
- [ ] Tomato plant grows two blocks tall, then flowers and ripens small green, green, orange, red (randomtickspeed 300)
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
