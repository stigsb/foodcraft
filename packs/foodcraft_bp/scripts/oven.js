import { system, ItemStack, GameMode, EquipmentSlot, EntityComponentTypes, Direction } from "@minecraft/server";

const OVEN_ID = "foodcraft:pizza_oven";
const RAW_PREFIX = "foodcraft:raw_pizza_";
const BAKED_PREFIX = "foodcraft:pizza_";
const PIZZAS = ["margherita", "pepperoni", "prosciutto", "hawaii"];
const BAKE_TICKS = 200; // 10 seconds
const DING_SOUND = "foodcraft.oven.ding"; // sounds/foodcraft/ding.ogg in the resource pack

// Bake timers by block position. Lost on world close; onTick restarts them (spec 4.2).
const timers = new Map();

function keyOf(block) {
  return `${block.dimension.id}:${block.x},${block.y},${block.z}`;
}

function stageOf(block) {
  return block.permutation.getState("foodcraft:stage");
}

function pizzaOf(block) {
  return block.permutation.getState("foodcraft:pizza");
}

function setOven(block, stage, pizza) {
  block.setPermutation(block.permutation.withState("foodcraft:stage", stage).withState("foodcraft:pizza", pizza));
}

function faceOffset(face) {
  switch (face) {
    case Direction.North: return { x: 0, y: 0, z: -1 };
    case Direction.South: return { x: 0, y: 0, z: 1 };
    case Direction.East: return { x: 1, y: 0, z: 0 };
    case Direction.West: return { x: -1, y: 0, z: 0 };
    case Direction.Up: return { x: 0, y: 1, z: 0 };
    default: return { x: 0, y: -1, z: 0 };
  }
}

function dropAt(block, itemStack, offset = { x: 0, y: 1, z: 0 }) {
  const c = block.center();
  block.dimension.spawnItem(itemStack, { x: c.x + offset.x, y: c.y + offset.y, z: c.z + offset.z });
}

function startBakeTimer(block) {
  const key = keyOf(block);
  if (timers.has(key)) return;
  const dimension = block.dimension;
  const location = { x: block.x, y: block.y, z: block.z };
  const runId = system.runTimeout(() => {
    timers.delete(key);
    const oven = dimension.getBlock(location);
    if (!oven || oven.typeId !== OVEN_ID || stageOf(oven) !== "baking") return;
    setOven(oven, "done", pizzaOf(oven));
    try {
      dimension.playSound(DING_SOUND, oven.center()); // silent if ding.ogg is missing
    } catch {
      // the pizza is already done; a sound problem must not undo that
    }
  }, BAKE_TICKS);
  timers.set(key, runId);
}

function cancelBakeTimer(block) {
  const key = keyOf(block);
  const runId = timers.get(key);
  if (runId !== undefined) {
    system.clearRun(runId);
    timers.delete(key);
  }
}

function heldRawPizza(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!held || !held.typeId.startsWith(RAW_PREFIX)) return undefined;
  const pizza = held.typeId.slice(RAW_PREFIX.length);
  return PIZZAS.includes(pizza) ? { equippable, held, pizza } : undefined;
}

function takeOneFromHand(player, equippable, held) {
  if (player.getGameMode() === GameMode.Creative) return;
  if (held.amount > 1) {
    held.amount -= 1;
    equippable.setEquipment(EquipmentSlot.Mainhand, held);
  } else {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}

function giveOrDrop(player, block, face, itemStack) {
  const inventory = player.getComponent(EntityComponentTypes.Inventory);
  const leftover = inventory?.container ? inventory.container.addItem(itemStack) : itemStack;
  if (leftover) dropAt(block, leftover, faceOffset(face)); // inventory full: drop in front of the oven
}

export const pizzaOvenComponent = {
  onPlayerInteract(event) {
    const { block, player, face } = event;
    if (!player) return;
    const stage = stageOf(block);

    if (stage === "baking") {
      player.onScreenDisplay.setActionBar("Still baking…");
      return;
    }
    if (stage === "done") {
      const pizza = pizzaOf(block);
      setOven(block, "empty", "none"); // state change first: a second click sees "empty"
      giveOrDrop(player, block, face, new ItemStack(BAKED_PREFIX + pizza, 1));
      return;
    }
    const hand = heldRawPizza(player);
    if (!hand) {
      player.onScreenDisplay.setActionBar("Put a raw pizza in the oven");
      return;
    }
    takeOneFromHand(player, hand.equippable, hand.held);
    setOven(block, "baking", hand.pizza);
    startBakeTimer(block);
  },

  onTick(event) {
    const { block } = event;
    if (stageOf(block) !== "baking") return;
    startBakeTimer(block); // no-op while a timer runs; restarts the bake after a world reload
    const c = block.center();
    block.dimension.spawnParticle("minecraft:basic_smoke_particle", { x: c.x, y: c.y + 0.6, z: c.z });
  },

  onPlayerBreak(event) {
    const { block, brokenBlockPermutation } = event;
    cancelBakeTimer(block);
    const stage = brokenBlockPermutation.getState("foodcraft:stage");
    const pizza = brokenBlockPermutation.getState("foodcraft:pizza");
    if (stage === "baking") dropAt(block, new ItemStack(RAW_PREFIX + pizza, 1));
    if (stage === "done") dropAt(block, new ItemStack(BAKED_PREFIX + pizza, 1));
  },
};
