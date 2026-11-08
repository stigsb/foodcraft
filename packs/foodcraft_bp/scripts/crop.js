import { BlockPermutation, GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

const GROWTH = "foodcraft:growth";
const MAX_GROWTH = 3;
const GROW_CHANCE = 0.34; // per random tick, roughly vanilla wheat pace
const BONE_MEAL = "minecraft:bone_meal";

function growthOf(block) {
  return block.permutation.getState(GROWTH);
}

function setGrowth(block, growth) {
  block.setPermutation(block.permutation.withState(GROWTH, Math.min(growth, MAX_GROWTH)));
}

// Takes one bone meal from the player's hand (none in creative). Returns false if the hand holds no bone meal.
export function useBoneMeal(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!held || held.typeId !== BONE_MEAL) return false;
  if (player.getGameMode() !== GameMode.Creative) {
    if (held.amount > 1) {
      held.amount -= 1;
      equippable.setEquipment(EquipmentSlot.Mainhand, held);
    } else {
      equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    }
  }
  return true;
}

export function boneMealEffects(block) {
  const c = block.center();
  block.dimension.spawnParticle("minecraft:crop_growth_emitter", c);
  block.dimension.playSound("item.bone_meal.use", c);
}

// Two-block crops (corn). Parameters in the block JSON:
//   lower half: "foodcraft:crop": { "top": "<top block id>", "top_from": <growth that gets the top half> }
//   top half:   the same, plus "lower": "<lower block id>"
// The top half carries the same growth state, only for its look. It has no loot: breaking it breaks the
// lower half, which drops the harvest; breaking the lower half pops the top off by its placement filter.

// The highest growth the plant can reach where it stands: a tall crop with no room above stays short.
function reachable(block, growth, { top, top_from: topFrom }) {
  growth = Math.min(growth, MAX_GROWTH);
  if (!top || growth < topFrom) return growth;
  const above = block.above();
  return above && (above.isAir || above.typeId === top) ? growth : topFrom - 1;
}

function grow(block, growth, opts) {
  setGrowth(block, growth);
  if (opts.top && growth >= opts.top_from) {
    block.above()?.setPermutation(BlockPermutation.resolve(opts.top, { [GROWTH]: growth }));
  }
}

const optionsOf = (parameters) => parameters?.params ?? {};

export const cropComponent = {
  onRandomTick(event, parameters) {
    const opts = optionsOf(parameters);
    if (opts.lower) return; // the top half never ticks the plant
    const { block } = event;
    const growth = growthOf(block);
    if (opts.top && growth >= opts.top_from && block.above()?.isAir) grow(block, growth, opts); // top half was lost: put it back
    if (growth >= MAX_GROWTH || Math.random() >= GROW_CHANCE) return;
    const next = reachable(block, growth + 1, opts);
    if (next > growth) grow(block, next, opts);
  },

  onPlayerInteract(event, parameters) {
    const { player } = event;
    if (!player) return;
    const opts = optionsOf(parameters);
    const plant = opts.lower ? event.block.below() : event.block; // a click on the top half grows the lower half
    if (!plant || (opts.lower && plant.typeId !== opts.lower)) return;
    const growth = growthOf(plant);
    const next = reachable(plant, growth + 1 + Math.floor(Math.random() * 2), opts); // +1 or +2 stages
    if (next <= growth || !useBoneMeal(player)) return;
    grow(plant, next, opts);
    boneMealEffects(plant);
  },

  onPlayerBreak(event, parameters) {
    const opts = optionsOf(parameters);
    if (!opts.lower) return;
    const below = event.block.below();
    if (below?.typeId !== opts.lower) return;
    const { x, y, z } = below.location;
    event.dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`); // the lower half drops the harvest
  },
};
