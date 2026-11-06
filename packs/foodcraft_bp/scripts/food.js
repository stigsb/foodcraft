import { world } from "@minecraft/server";

const RAW_PIZZA_PREFIX = "foodcraft:raw_pizza_";
const NAUSEA_TICKS = 200; // 10 seconds

// The joke from the spec: raw pizza is edible but makes you queasy.
world.afterEvents.itemCompleteUse.subscribe((event) => {
  if (!event.itemStack.typeId.startsWith(RAW_PIZZA_PREFIX)) return;
  event.source.addEffect("minecraft:nausea", NAUSEA_TICKS, { showParticles: false });
});
