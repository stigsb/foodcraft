import { GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

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

export const cropComponent = {
  onRandomTick(event) {
    const { block } = event;
    const growth = growthOf(block);
    if (growth >= MAX_GROWTH || Math.random() >= GROW_CHANCE) return;
    setGrowth(block, growth + 1);
  },

  onPlayerInteract(event) {
    const { block, player } = event;
    if (!player) return;
    const growth = growthOf(block);
    if (growth >= MAX_GROWTH || !useBoneMeal(player)) return;
    setGrowth(block, growth + 1 + Math.floor(Math.random() * 2)); // +1 or +2 stages
    boneMealEffects(block);
  },
};
