import { system } from "@minecraft/server";
import { cropComponent } from "./crop.js";
import { fruitPlant } from "./fruit_plant.js";

system.beforeEvents.startup.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("foodcraft:crop", cropComponent);
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
});
