// Spec 2.4: put an ingredient on the board, chop three times with the knife, get the result.
import { world, ItemStack, EquipmentSlot, EntityComponentTypes, ItemComponentTypes } from "@minecraft/server";
import { FISH, filletsOf } from "./fish_data.js";
import { takeOne, giveOrDrop, isCreative } from "./hand.js";

const KNIFE = "foodcraft:knife";
const CHOPS_NEEDED = 3;

// held item id -> { look: value of foodcraft:item, out: [[item, count], ...] }
const CHOPPABLE = {
  "minecraft:beef": { look: "beef", out: [["foodcraft:minced_meat", 2]] },
  "minecraft:potato": { look: "potato", out: [["foodcraft:raw_fries", 1]] },
  "foodcraft:pizza_dough": { look: "dough", out: [["foodcraft:raw_pasta", 2]] },
  "foodcraft:pepperoni_sausage": { look: "sausage", out: [["foodcraft:pepperoni_slices", 6]] }, // one sausage = one pizza
};
for (const id of Object.keys(FISH)) {
  const { item, count } = filletsOf(id);
  const look = id === "tuna" ? "tuna" : ["small_fish", "medium_fish", "large_fish"][FISH[id].size - 1];
  CHOPPABLE[`foodcraft:${id}`] = { look, out: [[item, count]] };
}

// The board state only shows the shape; the exact item id (which fish) is kept here, keyed by position.
const keyOf = (block) => `foodcraft:board@${block.dimension.id}:${block.x},${block.y},${block.z}`;

function setBoard(block, look, chops) {
  block.setPermutation(block.permutation.withState("foodcraft:item", look).withState("foodcraft:chops", chops));
}

function clearBoard(block) {
  setBoard(block, "none", 0);
  world.setDynamicProperty(keyOf(block), undefined);
}

function above(block) {
  const c = block.center();
  return { x: c.x, y: c.y + 0.4, z: c.z };
}

function wearKnife(player, equippable, knife) {
  if (isCreative(player)) return;
  const durability = knife.getComponent(ItemComponentTypes.Durability);
  if (!durability) return;
  if (durability.damage + 1 >= durability.maxDurability) {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    player.playSound("random.break");
    return;
  }
  durability.damage += 1;
  equippable.setEquipment(EquipmentSlot.Mainhand, knife);
}

export const cuttingBoardComponent = {
  onPlayerInteract({ block, player }) {
    if (!player) return;
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
    const look = block.permutation.getState("foodcraft:item");

    if (look === "none") {
      const recipe = held && CHOPPABLE[held.typeId];
      if (!recipe) {
        player.onScreenDisplay.setActionBar("Put something to chop on the board");
        return;
      }
      world.setDynamicProperty(keyOf(block), held.typeId);
      takeOne(player, equippable, held);
      setBoard(block, recipe.look, 0);
      block.dimension.playSound("block.itemframe.add_item", block.center());
      return;
    }

    const onBoard = world.getDynamicProperty(keyOf(block));
    if (!held) {
      clearBoard(block); // empty hand: take it back
      if (typeof onBoard === "string") giveOrDrop(player, block, new ItemStack(onBoard, 1));
      return;
    }
    if (held.typeId !== KNIFE) {
      player.onScreenDisplay.setActionBar("Chop it with a knife");
      return;
    }

    const chops = block.permutation.getState("foodcraft:chops") + 1;
    block.dimension.playSound("hit.wood", block.center());
    block.dimension.spawnParticle("minecraft:crop_growth_emitter", above(block));
    wearKnife(player, equippable, held);
    if (chops < CHOPS_NEEDED) {
      setBoard(block, look, chops);
      return;
    }
    clearBoard(block); // state first: a second click sees an empty board
    const recipe = typeof onBoard === "string" ? CHOPPABLE[onBoard] : undefined;
    for (const [item, count] of recipe?.out ?? []) block.dimension.spawnItem(new ItemStack(item, count), above(block));
  },

  onPlayerBreak({ block }) {
    const onBoard = world.getDynamicProperty(keyOf(block));
    world.setDynamicProperty(keyOf(block), undefined);
    if (typeof onBoard === "string") block.dimension.spawnItem(new ItemStack(onBoard, 1), block.center());
  },
};
