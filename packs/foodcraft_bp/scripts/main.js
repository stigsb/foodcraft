import { system } from "@minecraft/server";
import { cropComponent } from "./crop.js";

system.beforeEvents.startup.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("foodcraft:crop", cropComponent);
});
