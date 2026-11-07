import { system } from "@minecraft/server";
import "./food.js";
import { pizzaOvenComponent } from "./oven.js";
import { cropComponent } from "./crop.js";
import { fruitPlant } from "./fruit_plant.js";
import { cuttingBoardComponent } from "./board.js";
import "./fishing.js";
// import "./fishing_probe.js"; // Task 1 probe: uncomment to see what the script sees when fishing
import "./pot.js"; // cooking pot: a vanilla cauldron on a campfire

system.beforeEvents.startup.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("foodcraft:pizza_oven", pizzaOvenComponent);
  event.blockComponentRegistry.registerCustomComponent("foodcraft:crop", cropComponent);
  event.blockComponentRegistry.registerCustomComponent("foodcraft:cutting_board", cuttingBoardComponent);
  event.blockComponentRegistry.registerCustomComponent(
    "foodcraft:tomato",
    fruitPlant({
      lower: "foodcraft:tomato_crop",
      top: "foodcraft:tomato_crop_top",
      produce: "foodcraft:tomato",
      count: [2, 3],
      ripe: 5,
      full: 3, // sprout, small plant, tall plant, then fruit
      topFrom: 2, // the top half appears with the tall plant
      growChance: 0.5, // the plant grows fast...
      ripenChance: 0.2, // ...and the tomatoes ripen slowly
      pickSound: "block.sweet_berry_bush.pick",
    })
  );
  event.blockComponentRegistry.registerCustomComponent(
    "foodcraft:pineapple",
    fruitPlant({
      lower: "foodcraft:pineapple_crop",
      produce: "foodcraft:pineapple",
      count: [1, 1],
      ripe: 4,
      full: 2,
      growChance: 0.25, // pineapples are slow at everything
      ripenChance: 0.15,
      pickSound: "block.sweet_berry_bush.pick",
    })
  );
});
