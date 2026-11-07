// Helpers for blocks that take items from the player's hand and give items back.
import { GameMode, EquipmentSlot, EntityComponentTypes } from "@minecraft/server";

export const isCreative = (player) => player.getGameMode() === GameMode.Creative;

export function heldItem(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  return { equippable, held: equippable?.getEquipment(EquipmentSlot.Mainhand) };
}

// Takes one item from the main hand (none in creative).
export function takeOne(player, equippable, held) {
  if (isCreative(player)) return;
  if (held.amount > 1) {
    held.amount -= 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  } else {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}

// Into the inventory, or dropped on top of the block if the inventory is full.
export function giveOrDrop(player, block, stack) {
  const leftover = player.getComponent(EntityComponentTypes.Inventory)?.container?.addItem(stack) ?? stack;
  if (leftover) {
    const c = block.center();
    block.dimension.spawnItem(leftover, { x: c.x, y: c.y + 0.4, z: c.z });
  }
}
