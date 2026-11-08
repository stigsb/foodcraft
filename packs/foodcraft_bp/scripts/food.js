import { world, system } from "@minecraft/server";
import { EAT_EFFECTS } from "./berry_data.js";

const RAW_PIZZA_PREFIX = "foodcraft:raw_pizza_";
const NAUSEA_TICKS = 200; // 10 seconds

world.afterEvents.itemCompleteUse.subscribe((event) => {
  const id = event.itemStack.typeId;
  const player = event.source;
  // The joke from the spec: raw pizza is edible but makes you queasy.
  if (id.startsWith(RAW_PIZZA_PREFIX)) {
    player.addEffect("minecraft:nausea", NAUSEA_TICKS, { showParticles: false });
    return;
  }
  const eat = EAT_EFFECTS[id];
  if (!eat) return;
  const [min, max] = eat.ticks;
  const ticks = min + Math.floor(Math.random() * (max - min + 1));
  if (eat.effect === "illumination") {
    illuminate(player, ticks);
  } else {
    player.addEffect(`minecraft:${eat.effect}`, ticks, { amplifier: eat.amplifier ?? 0 });
  }
});

// --- Illumination: a faint light that follows the player ---------------------------------------
// Minecraft has no light around a player, so an invisible vanilla light block is moved along with the
// player's head and removed when the effect ends. It only goes into air, so it never replaces anything.
const LIGHT = "minecraft:light_block_10";
const LEFT = "foodcraft:illumination_left"; // ticks of the effect left (survives leaving and rejoining)
const LAMP = "foodcraft:illumination_lamp"; // "dimension|x,y,z" of the light block now placed
const STEP = 2; // ticks between moves

function illuminate(player, ticks) {
  player.setDynamicProperty(LEFT, ticks);
  player.onScreenDisplay.setActionBar(`Illumination: ${Math.round(ticks / 20)} s`);
}

function removeLamp(player) {
  const lamp = player.getDynamicProperty(LAMP);
  if (typeof lamp !== "string") return;
  player.setDynamicProperty(LAMP, undefined);
  clearLight(lamp);
}

function clearLight(lamp) {
  const [dim, pos] = lamp.split("|");
  const [x, y, z] = pos.split(",").map(Number);
  try {
    const block = world.getDimension(dim).getBlock({ x, y, z });
    if (block?.typeId === LIGHT) block.setType("minecraft:air");
  } catch {
    // chunk not loaded: the light stays until the player comes back with the effect again
  }
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const left = player.getDynamicProperty(LEFT);
    if (typeof left !== "number") continue;
    if (left <= 0) {
      removeLamp(player);
      player.setDynamicProperty(LEFT, undefined);
      continue;
    }
    player.setDynamicProperty(LEFT, left - STEP);
    const head = player.getHeadLocation();
    const pos = { x: Math.floor(head.x), y: Math.floor(head.y), z: Math.floor(head.z) };
    const here = `${player.dimension.id}|${pos.x},${pos.y},${pos.z}`;
    if (player.getDynamicProperty(LAMP) === here) continue;
    removeLamp(player);
    try {
      const block = player.dimension.getBlock(pos);
      if (block?.isAir) {
        block.setType(LIGHT);
        player.setDynamicProperty(LAMP, here);
      }
    } catch {
      // outside the world (above the build limit): no light this step
    }
  }
}, STEP);

// A player who leaves takes the light along.
world.beforeEvents.playerLeave.subscribe((event) => {
  const lamp = event.player.getDynamicProperty(LAMP);
  if (typeof lamp === "string") system.run(() => clearLight(lamp));
});
