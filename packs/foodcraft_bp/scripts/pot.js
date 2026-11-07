// Cooking pot = a vanilla cauldron full of water on a lit campfire.
// Minecraft fills the cauldron with water itself. This script takes the ingredients, cooks for 10 s,
// colours the water like the dish and serves 3 portions with bowls, lowering the water each time.
import { world, system, ItemStack, BlockComponentTypes, EquipmentSlot, FluidType } from "@minecraft/server";
import { giveOrDrop, takeOne, heldItem, isCreative } from "./hand.js";

const CAULDRON = "minecraft:cauldron";
const FULL = 6; // fill level of a full cauldron (one water bucket)
const COOK_TICKS = 200; // 10 seconds
const TICK_INTERVAL = 10;
const PORTIONS = 3; // each portion takes FULL / PORTIONS fill levels
const RECIPES = {
  fish_soup: { item: "foodcraft:fish_soup", needs: ["foodcraft:fish_fillet", "minecraft:potato", "minecraft:carrot"], color: "#e0cc98" },
  bolognese: { item: "foodcraft:spaghetti_bolognese", needs: ["foodcraft:raw_pasta", "foodcraft:minced_meat", "foodcraft:tomato_sauce"], color: "#a8432a" },
  mac_and_cheese: { item: "foodcraft:mac_and_cheese", needs: ["foodcraft:raw_pasta", "foodcraft:mozzarella", "foodcraft:mozzarella"], color: "#f0c040" },
  rice_porridge: { item: "foodcraft:rice_porridge", needs: ["foodcraft:rice", "foodcraft:rice", "minecraft:milk_bucket", "minecraft:sugar"], color: "#f2ebd8" },
};
const INGREDIENTS = new Set(Object.values(RECIPES).flatMap((r) => r.needs));
const GIVES_BACK = { "minecraft:milk_bucket": "minecraft:bucket" };

// Pot record per cauldron, in a world dynamic property:
// { contents: [item ids], phase: "filling" | "cooking" | "done", dish?, portions? }
// Cooking progress is kept in memory only; after a world reload the pot cooks a fresh 10 s.
const PREFIX = "foodcraft:cauldron@";
const progress = new Map();
const keyOf = (block) => `${PREFIX}${block.dimension.id}|${block.x},${block.y},${block.z}`;

function load(key) {
  const raw = world.getDynamicProperty(key);
  return typeof raw === "string" ? JSON.parse(raw) : undefined;
}
function save(key, pot) {
  world.setDynamicProperty(key, pot ? JSON.stringify(pot) : undefined);
  if (!pot || pot.phase !== "cooking") progress.delete(key);
}

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

const fluid = (block) => block.getComponent(BlockComponentTypes.FluidContainer);
function fullOfWater(block) {
  const f = fluid(block);
  return !!f && f.fillLevel >= FULL && f.getFluidType() === FluidType.Water;
}
function campfireLit(block) {
  const below = block.below();
  if (!below || (below.typeId !== "minecraft:campfire" && below.typeId !== "minecraft:soul_campfire")) return false;
  return below.permutation.getState("extinguished") === false;
}
function rgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { red: (n >> 16) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255, alpha: 1 };
}
// Sounds and particles are decoration: a problem with one must not undo what the pot just did.
function playSound(block, id) {
  try {
    block.dimension.playSound(id, block.center());
  } catch {}
}
function particle(block, id, dy) {
  try {
    const c = block.center();
    block.dimension.spawnParticle(id, { x: c.x, y: c.y + dy, z: c.z });
  } catch {}
}

// "In the pot: Fish Fillet, Potato" in the player's own language.
function showContents(player, list) {
  const rawtext = [{ text: "In the pot: " }];
  list.forEach((id, i) => {
    if (i) rawtext.push({ text: ", " });
    rawtext.push({ translate: new ItemStack(id, 1).localizationKey });
  });
  player.onScreenDisplay.setActionBar(list.length ? { rawtext } : "The pot is empty");
}

function dropContents(block, list) {
  for (const id of list) if (!GIVES_BACK[id]) block.dimension.spawnItem(new ItemStack(id, 1), block.center());
}

// --- player clicks a cauldron -----------------------------------------------------------------
// The before-event decides whether Minecraft's own cauldron behaviour runs (buckets, bottles, dyes);
// the change itself happens a tick later, since before-events may not change the world.
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { block, player, itemStack, isFirstEvent } = event;
  if (block.typeId !== CAULDRON) return;
  const key = keyOf(block);
  const pot = load(key);
  const held = itemStack?.typeId;

  if (pot?.phase === "cooking" || pot?.phase === "done") {
    event.cancel = true; // no buckets or bottles in the soup
  } else if (held && INGREDIENTS.has(held)) {
    event.cancel = true;
  } else if (pot?.contents.length && held) {
    event.cancel = true; // keep the water while ingredients are in it
  } else if (!(pot?.contents.length && !held)) {
    return; // a plain cauldron: Minecraft handles it
  }
  if (!isFirstEvent) return;
  system.run(() => interact(block, player, key));
});

function interact(block, player, key) {
  if (!block.isValid || block.typeId !== CAULDRON) return;
  const { equippable, held } = heldItem(player);
  const pot = load(key) ?? { contents: [], phase: "filling" };

  if (pot.phase === "cooking") {
    player.onScreenDisplay.setActionBar("Still cooking…");
    return;
  }

  if (pot.phase === "done") {
    if (held?.typeId !== "minecraft:bowl") {
      player.onScreenDisplay.setActionBar("Take the food out with a bowl");
      return;
    }
    const recipe = RECIPES[pot.dish];
    const left = (pot.portions ?? 1) - 1;
    const f = fluid(block);
    if (f) f.fillLevel = Math.max(0, Math.round((FULL / PORTIONS) * left));
    save(key, left > 0 ? { ...pot, portions: left } : undefined);
    if (!recipe) return; // broken record: nothing to serve, the pot is reset
    takeOne(player, equippable, held);
    giveOrDrop(player, block, new ItemStack(recipe.item, 1));
    playSound(block, "bucket.fill_water");
    return;
  }

  // filling
  if (!held) {
    const last = pot.contents.pop();
    if (!last) return;
    save(key, pot.contents.length ? pot : undefined);
    if (!GIVES_BACK[last]) giveOrDrop(player, block, new ItemStack(last, 1)); // no free milk buckets
    showContents(player, pot.contents);
    return;
  }
  if (!INGREDIENTS.has(held.typeId)) {
    player.onScreenDisplay.setActionBar("Take the ingredients out first");
    return;
  }
  if (!fullOfWater(block)) {
    player.onScreenDisplay.setActionBar("Fill the cauldron with a water bucket first");
    return;
  }
  const next = [...pot.contents, held.typeId];
  if (!canStillMake(next)) {
    player.onScreenDisplay.setActionBar("That doesn't go in the pot");
    return;
  }
  pot.contents = next;
  save(key, pot);
  const back = GIVES_BACK[held.typeId];
  if (back && !isCreative(player)) equippable.setEquipment(EquipmentSlot.Mainhand, new ItemStack(back, 1));
  else takeOne(player, equippable, held);
  playSound(block, "bucket.empty_water");
  particle(block, "minecraft:water_splash_particle_manual", 0.5);
  showContents(player, pot.contents);
  if (recipeFor(pot.contents) && !campfireLit(block)) player.onScreenDisplay.setActionBar("The pot needs a lit campfire under it");
}

// --- cooking: every half second over all pots -------------------------------------------------
function blockAt(key) {
  const [dimId, pos] = key.slice(PREFIX.length).split("|");
  const [x, y, z] = pos.split(",").map(Number);
  try {
    return world.getDimension(dimId).getBlock({ x, y, z }); // undefined while the chunk is unloaded
  } catch {
    return undefined;
  }
}

system.runInterval(() => {
  for (const key of world.getDynamicPropertyIds()) {
    if (!key.startsWith(PREFIX)) continue;
    const block = blockAt(key);
    if (!block) continue;
    const pot = load(key);
    if (!pot) continue;

    // The cauldron is gone or emptied by something other than a player (explosion, piston, dispenser).
    if (block.typeId !== CAULDRON || (pot.phase !== "done" && !fullOfWater(block))) {
      if (pot.phase !== "done") dropContents(block, pot.contents);
      save(key, undefined);
      continue;
    }

    if (pot.phase === "filling") {
      const dish = recipeFor(pot.contents);
      if (dish && campfireLit(block)) {
        save(key, { ...pot, phase: "cooking", dish });
        progress.set(key, 0);
        playSound(block, "bubble.pop");
      }
      continue;
    }
    if (pot.phase !== "cooking" || !campfireLit(block)) continue; // no fire: paused

    const done = (progress.get(key) ?? 0) + TICK_INTERVAL;
    if (done < COOK_TICKS) {
      progress.set(key, done);
      particle(block, "minecraft:basic_smoke_particle", 0.6);
      continue;
    }
    save(key, { contents: [], phase: "done", dish: pot.dish, portions: PORTIONS });
    const f = fluid(block);
    if (f && RECIPES[pot.dish]) f.fluidColor = rgba(RECIPES[pot.dish].color);
    playSound(block, "random.orb");
  }
}, TICK_INTERVAL);

// --- a player breaks the cauldron -------------------------------------------------------------
world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation }) => {
  if (brokenBlockPermutation.type.id !== CAULDRON) return;
  const key = keyOf(block);
  const pot = load(key);
  if (!pot) return;
  if (pot.phase !== "done") dropContents(block, pot.contents); // cooked portions are lost
  save(key, undefined);
});
