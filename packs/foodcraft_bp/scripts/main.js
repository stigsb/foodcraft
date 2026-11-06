import { system } from "@minecraft/server";
import "./food.js";
import { pizzaOvenComponent } from "./oven.js";

system.beforeEvents.startup.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("foodcraft:pizza_oven", pizzaOvenComponent);
});
