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
