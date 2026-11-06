import { BlockPermutation, ItemStack } from "@minecraft/server";
import { useBoneMeal, boneMealEffects } from "./crop.js";

const GROWTH = "foodcraft:growth";
const FRUIT = "foodcraft:fruit";
const FULL = 2; // growth of the full plant

// Builds the custom component for one fruit plant.
// lower:  block id of the plant (the one on farmland)
// top:    block id of the upper half for a two-block plant, or undefined
// produce, count: item and [min, max] given when the ripe fruit is picked
// ripe:   fruit value of ripe fruit
// growChance, ripenChance: chance per random tick to grow / to ripen one stage
// pickSound: sound played when picking
export function fruitPlant({ lower, top, produce, count, ripe, growChance, ripenChance, pickSound }) {
  // The lower block carries the states that count.
  const lowerOf = (block) => (top && block.typeId === top ? block.below() : block);

  const read = (plant) => ({
    growth: plant.permutation.getState(GROWTH),
    fruit: plant.permutation.getState(FRUIT),
  });

  // A two-block plant needs air above (or its own top half) to grow.
  const roomAbove = (plant) => {
    if (!top) return true;
    const above = plant.above();
    return !!above && (above.isAir || above.typeId === top);
  };

  // Writes the states to the plant, and to the top half from growth 1.
  const write = (plant, growth, fruit) => {
    const states = { [GROWTH]: growth, [FRUIT]: fruit };
    plant.setPermutation(BlockPermutation.resolve(lower, states));
    if (top && growth >= 1 && roomAbove(plant)) {
      plant.above().setPermutation(BlockPermutation.resolve(top, states));
    }
  };

  // The next stage, or undefined when the fruit is ripe.
  const next = ({ growth, fruit }) => {
    if (growth < FULL) return { growth: growth + 1, fruit: growth + 1 === FULL ? 1 : 0 };
    if (fruit < ripe) return { growth, fruit: fruit + 1 };
    return undefined;
  };

  return {
    onRandomTick(event) {
      const plant = event.block;
      if (plant.typeId !== lower) return; // a top half never ticks the plant
      const now = read(plant);
      if (top && now.growth >= 1 && plant.above()?.isAir) write(plant, now.growth, now.fruit); // top half was lost: put it back
      const step = next(now);
      if (!step || !roomAbove(plant)) return;
      const chance = now.growth < FULL ? growChance : ripenChance;
      if (Math.random() >= chance) return;
      write(plant, step.growth, step.fruit);
    },

    onPlayerInteract(event) {
      const { block, player } = event;
      if (!player) return;
      const plant = lowerOf(block);
      if (plant?.typeId !== lower) return;
      const now = read(plant);

      // Ripe: pick the fruit, the plant stays.
      if (now.growth === FULL && now.fruit === ripe) {
        const [min, max] = count;
        const amount = min + Math.floor(Math.random() * (max - min + 1));
        block.dimension.spawnItem(new ItemStack(produce, amount), block.center());
        block.dimension.playSound(pickSound, block.center());
        write(plant, FULL, 0);
        return;
      }

      // Otherwise bone meal moves it one stage on.
      const step = next(now);
      if (!step || !roomAbove(plant) || !useBoneMeal(player)) return;
      write(plant, step.growth, step.fruit);
      boneMealEffects(block);
    },

    onPlayerBreak(event) {
      // Breaking a top half breaks the lower half too, so its loot drops.
      // (Breaking the lower half makes the top half pop off by its placement filter.)
      if (!top || event.brokenBlockPermutation.type.id !== top) return;
      const below = event.block.below();
      if (below?.typeId !== lower) return;
      const { x, y, z } = below.location;
      event.dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
    },
  };
}
