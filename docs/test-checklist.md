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

## Recipes
- [ ] Flour: 1 wheat -> 1 flour
- [ ] Pizza dough: 3 flour over a water bucket -> dough, empty bucket stays in the grid output
- [ ] Tomato sauce: 2 tomato + garlic + oregano + bowl -> sauce
- [ ] Mozzarella: milk bucket -> mozzarella, empty bucket returned
- [ ] Pepperoni: raw porkchop + oregano -> pepperoni
- [ ] Ham: cooked porkchop -> 2 ham

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
