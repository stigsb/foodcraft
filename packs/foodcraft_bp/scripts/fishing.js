// Spec 2.1: a vanilla fish caught in a water zone becomes one of that zone's Foodcraft fish half of the time.
import { world, system, ItemStack, EntityComponentTypes } from "@minecraft/server";
import { ZONES } from "./fish_data.js";

const VANILLA_FISH = new Set(["minecraft:cod", "minecraft:salmon", "minecraft:tropical_fish", "minecraft:pufferfish"]);
const SWAP_CHANCE = 0.5;
const HOOK_RADIUS = 2; // from the Task 1 probe

const fishByBiome = new Map(ZONES.flatMap((zone) => zone.biomes.map((b) => [`minecraft:${b}`, zone.fish])));

// Decision A from Task 1. For decision B, replace this function (see Task 1 step 3).
function caughtWithRod(entity) {
  return entity.dimension.getEntities({ type: "minecraft:fishing_hook", location: entity.location, maxDistance: HOOK_RADIUS }).length > 0;
}

function swap(entity, typeId, amount) {
  if (!entity.isValid) return; // already picked up
  const { dimension, location } = entity;
  const velocity = entity.getVelocity();
  entity.remove();
  const caught = dimension.spawnItem(new ItemStack(typeId, amount), location);
  caught.clearVelocity();
  caught.applyImpulse(velocity); // keeps flying toward the player like the original catch
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (entity.typeId !== "minecraft:item" || entity.dimension.id !== "minecraft:overworld") return;
  const stack = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
  if (!stack || !VANILLA_FISH.has(stack.typeId)) return;
  if (!caughtWithRod(entity)) return;
  const fish = fishByBiome.get(entity.dimension.getBiome(entity.location).id);
  if (!fish || Math.random() >= SWAP_CHANCE) return;
  const pick = fish[Math.floor(Math.random() * fish.length)];
  system.run(() => swap(entity, `foodcraft:${pick}`, stack.amount)); // next tick: the catch has its velocity by then
});
