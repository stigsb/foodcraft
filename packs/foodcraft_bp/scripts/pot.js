// Spec 2.5: water, up to 4 ingredients, a lit campfire below, 10 s of cooking, 3 portions taken with bowls.
import { world, ItemStack, EquipmentSlot } from "@minecraft/server";
import { giveOrDrop, takeOne, heldItem, isCreative } from "./hand.js";

const COOK_TICKS = 200; // 10 seconds
const TICK_INTERVAL = 10; // must match minecraft:tick interval_range in blocks/cooking_pot.json
const MAX_INGREDIENTS = 4; // highest value of the foodcraft:filled state
const PORTIONS = 3;
const RECIPES = {
  fish_soup: { item: "foodcraft:fish_soup", needs: ["foodcraft:fish_fillet", "minecraft:potato", "minecraft:carrot"] },
  bolognese: { item: "foodcraft:spaghetti_bolognese", needs: ["foodcraft:raw_pasta", "foodcraft:minced_meat", "foodcraft:tomato_sauce"] },
  mac_and_cheese: { item: "foodcraft:mac_and_cheese", needs: ["foodcraft:raw_pasta", "foodcraft:mozzarella", "foodcraft:mozzarella"] },
  rice_porridge: { item: "foodcraft:rice_porridge", needs: ["foodcraft:rice", "foodcraft:rice", "minecraft:milk_bucket", "minecraft:sugar"] },
};
const GIVES_BACK = { "minecraft:milk_bucket": "minecraft:bucket" };

// Cooking progress in ticks, by pot position. Only counts while the campfire is lit, so putting
// the fire out pauses the pot. Lost on world close; the pot then cooks a fresh 10 s (spec 2.5).
const progress = new Map();
const keyOf = (block) => `foodcraft:pot@${block.dimension.id}:${block.x},${block.y},${block.z}`;
const state = (block, name) => block.permutation.getState(`foodcraft:${name}`);

function setPot(block, changes) {
  let p = block.permutation;
  for (const [name, value] of Object.entries(changes)) p = p.withState(`foodcraft:${name}`, value);
  block.setPermutation(p);
}

function contents(block) {
  const raw = world.getDynamicProperty(keyOf(block));
  return typeof raw === "string" ? JSON.parse(raw) : [];
}

function setContents(block, list) {
  world.setDynamicProperty(keyOf(block), list.length ? JSON.stringify(list) : undefined);
}

// true if `list` is a sub-multiset of `needs`
function fitsInto(list, needs) {
  const left = [...needs];
  for (const id of list) {
    const i = left.indexOf(id);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}

const canStillMake = (list) => Object.values(RECIPES).some((r) => fitsInto(list, r.needs));
const recipeFor = (list) => Object.keys(RECIPES).find((d) => RECIPES[d].needs.length === list.length && fitsInto(list, RECIPES[d].needs));

function campfireLit(block) {
  const below = block.below();
  if (!below || (below.typeId !== "minecraft:campfire" && below.typeId !== "minecraft:soul_campfire")) return false;
  return below.permutation.getState("extinguished") === false;
}

function playSound(block, id) {
  try {
    block.dimension.playSound(id, block.center());
  } catch {
    // a sound problem must not undo what the pot just did
  }
}

function tryStart(block, player) {
  const dish = recipeFor(contents(block));
  if (!dish) return;
  if (!campfireLit(block)) {
    player?.onScreenDisplay.setActionBar("The pot needs a lit campfire under it");
    return;
  }
  setPot(block, { pot: "cooking", dish });
  progress.set(keyOf(block), 0);
  playSound(block, "bubble.pop");
}

function finish(block) {
  progress.delete(keyOf(block));
  setPot(block, { pot: "done", filled: 0, portions: PORTIONS });
  setContents(block, []);
  playSound(block, "random.orb");
}

export const cookingPotComponent = {
  onPlayerInteract({ block, player }) {
    if (!player) return;
    const { equippable, held } = heldItem(player);
    if (!equippable) return;
    const pot = state(block, "pot");
    const creative = isCreative(player);

    if (pot === "cooking") {
      player.onScreenDisplay.setActionBar("Still cooking…");
      return;
    }

    if (pot === "done") {
      if (held?.typeId !== "minecraft:bowl") {
        player.onScreenDisplay.setActionBar("Take the food out with a bowl");
        return;
      }
      const recipe = RECIPES[state(block, "dish")];
      const left = Number(state(block, "portions")) - 1;
      setPot(block, left > 0 ? { portions: left } : { pot: "empty", dish: "none", filled: 0, portions: 0 });
      if (!recipe) return; // broken state: nothing to serve, the pot is reset
      takeOne(player, equippable, held);
      giveOrDrop(player, block, new ItemStack(recipe.item, 1));
      return;
    }

    if (pot === "empty") {
      if (held?.typeId !== "minecraft:water_bucket") {
        player.onScreenDisplay.setActionBar("Fill the pot with water first");
        return;
      }
      setContents(block, []); // clear leftovers from a pot that stood here and was not broken by a player
      setPot(block, { pot: "water", dish: "none", filled: 0 });
      if (!creative) equippable.setEquipment(EquipmentSlot.Mainhand, new ItemStack("minecraft:bucket", 1));
      playSound(block, "bucket.empty_water");
      return;
    }

    // pot === "water"
    const list = contents(block);
    if (!held) {
      const last = list.pop();
      if (!last) return;
      setContents(block, list);
      setPot(block, { filled: list.length });
      if (!GIVES_BACK[last]) giveOrDrop(player, block, new ItemStack(last, 1)); // no free milk buckets
      return;
    }
    if (list.length >= MAX_INGREDIENTS || !canStillMake([...list, held.typeId])) {
      player.onScreenDisplay.setActionBar("That doesn't go in the pot");
      return;
    }
    list.push(held.typeId);
    setContents(block, list);
    setPot(block, { filled: list.length });
    const back = GIVES_BACK[held.typeId];
    if (back && !creative) equippable.setEquipment(EquipmentSlot.Mainhand, new ItemStack(back, 1));
    else takeOne(player, equippable, held);
    playSound(block, "bucket.fill_water");
    tryStart(block, player);
  },

  onTick({ block }) {
    const pot = state(block, "pot");
    if (pot === "water") {
      if (recipeFor(contents(block)) && campfireLit(block)) tryStart(block); // campfire lit after the last ingredient
      return;
    }
    if (pot !== "cooking") return;
    if (!campfireLit(block)) return; // paused until the fire is lit again
    const key = keyOf(block);
    const done = (progress.get(key) ?? 0) + TICK_INTERVAL; // missing after a world reload: start counting again
    if (done >= COOK_TICKS) {
      finish(block);
      return;
    }
    progress.set(key, done);
    const c = block.center();
    block.dimension.spawnParticle("minecraft:basic_smoke_particle", { x: c.x, y: c.y + 0.3, z: c.z });
  },

  onPlayerBreak({ block, brokenBlockPermutation }) {
    progress.delete(keyOf(block));
    const list = contents(block);
    setContents(block, []);
    if (brokenBlockPermutation.getState("foodcraft:pot") === "done") return; // spec: cooked portions are lost
    for (const id of list) if (!GIVES_BACK[id]) block.dimension.spawnItem(new ItemStack(id, 1), block.center());
  },
};
