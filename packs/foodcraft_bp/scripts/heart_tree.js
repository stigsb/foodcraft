// The heart tree. Its only seed sits in the trunk (the seed log).
// - Planting the seed: in a cherry grove with no other living heart tree within RADIUS blocks it becomes a tree
//   sapling; anywhere else a heart flower plant. Both grow 1, 2, 4, 8 and 16 pixels tall (growth 0-4).
// - A full-grown sapling becomes a tree (about 11 blocks tall, a little taller than a cherry tree).
// - Wild trees: world generation places a full-grown "wild" sapling in cherry groves, which this script turns into
//   a tree (or, if another tree is near, into a flowering heart flower).
// - Taking the seed out of the trunk (or blowing it up) makes the tree wither: it turns into pale oak and then
//   disappears a few blocks at a time.
// Living and withering trees are kept as world dynamic properties: "foodcraft:hearttree@<dim>|x,y,z" (the seed log)
// -> { phase: "alive" | "withering", blocks: [[x, y, z, kind], ...] } with kind l (log), s (seed log), f (leaves).
import { world, system, BlockPermutation, EntityComponentTypes, EquipmentSlot, ItemStack } from "@minecraft/server";
import { isCreative } from "./hand.js";

const LOG = "foodcraft:heart_tree_log";
const SEED_LOG = "foodcraft:heart_tree_seed_log";
const LEAVES = "foodcraft:heart_tree_leaves";
const SAPLING = "foodcraft:heart_tree_sapling";
const FLOWER = "foodcraft:heart_flower_plant";
const SEED = "foodcraft:heart_seed";
const GROWTH = "foodcraft:growth";
const WILD = "foodcraft:wild";
const FULL = 4; // growth of a 16 pixel plant
const GROW_CHANCE = 0.35; // per random tick, per stage
const BLOOM_CHANCE = 0.05; // heart flower bud -> flower: slow, the heart berry is rare
const HEART_BERRY = "foodcraft:heart_berry";
const RADIUS = 128; // one heart tree per area: no other living tree this close (horizontally)
const SEED_HEIGHT = 2; // the seed log is the third trunk block
const PREFIX = "foodcraft:hearttree@";
const SOIL = new Set(["minecraft:grass_block", "minecraft:dirt", "minecraft:coarse_dirt", "minecraft:podzol", "minecraft:moss_block", "minecraft:farmland"]);
// Blocks a tree may grow into.
const SOFT = new Set(["minecraft:air", "minecraft:short_grass", "minecraft:tall_grass", "minecraft:fern", "minecraft:large_fern", "minecraft:pink_petals", "minecraft:snow_layer"]);
const PALE_LOG = "minecraft:pale_oak_log";
const PALE_LEAVES = "minecraft:pale_oak_leaves";
const WITHER_PER_STEP = 3; // blocks removed every 2 seconds while withering
const STEP_TICKS = 40;

// --- small helpers ---------------------------------------------------------------------------------
const tryRun = (f) => { try { return f(); } catch { return undefined; } };
const blockAt = (dim, x, y, z) => tryRun(() => dim.getBlock({ x, y, z })); // undefined when not loaded
const isSoft = (block) => !!block && (block.isAir || SOFT.has(block.typeId));
const keyOf = (dimId, { x, y, z }) => `${PREFIX}${dimId}|${x},${y},${z}`;
const hash = (a, b, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const effects = (block, sound, particle) => {
  tryRun(() => block.dimension.playSound(sound, block.center()));
  if (particle) tryRun(() => block.dimension.spawnParticle(particle, block.center()));
};

function loadTree(key) {
  const raw = world.getDynamicProperty(key);
  return typeof raw === "string" ? tryRun(() => JSON.parse(raw)) : undefined;
}
const saveTree = (key, tree) => world.setDynamicProperty(key, tree ? JSON.stringify(tree) : undefined);
const treeKeys = () => world.getDynamicPropertyIds().filter((k) => k.startsWith(PREFIX));
function parseKey(key) {
  const [dimId, pos] = key.slice(PREFIX.length).split("|");
  const [x, y, z] = pos.split(",").map(Number);
  return { dimId, x, y, z };
}

// Is a living heart tree within RADIUS blocks of this spot?
function treeNear(dimId, x, z) {
  return treeKeys().some((key) => {
    const t = parseKey(key);
    if (t.dimId !== dimId || Math.hypot(t.x - x, t.z - z) > RADIUS) return false;
    return loadTree(key)?.phase === "alive";
  });
}

function inCherryGrove(block) {
  const biome = tryRun(() => block.dimension.getBiome(block.location));
  return !!biome && (biome.id === "minecraft:cherry_grove" || tryRun(() => biome.hasTags(["cherry_grove"])) === true);
}

// --- the tree's shape --------------------------------------------------------------------------------
// Offsets from the sapling's spot: a trunk 8 blocks tall with the seed in it, short branches, a wide dome of
// blossoms and strands hanging down at the edge, like the drawing. Strand lengths vary per tree.
function treeShape(x, z) {
  const blocks = new Map();
  const put = (dx, dy, dz, kind) => {
    const k = `${dx},${dy},${dz}`;
    if (kind !== "f" || !blocks.has(k)) blocks.set(k, [dx, dy, dz, kind]);
  };
  for (let dy = 0; dy <= 7; dy++) put(0, dy, 0, dy === SEED_HEIGHT ? "s" : "l");
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    put(dx, 5, dz, "l");
    put(dx * 2, 6, dz * 2, "l");
  }
  const R = 4.6, CY = 8, RY = 2.4;
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      const d = Math.hypot(dx, dz);
      let lowest;
      for (let dy = 5; dy <= 11; dy++) {
        if ((d / R) ** 2 + ((dy - CY) / RY) ** 2 > 1) continue;
        put(dx, dy, dz, "f");
        lowest ??= dy;
      }
      // Hanging strands around the edge of the dome.
      if (lowest !== undefined && d >= 3 && d <= 4.9) {
        const length = 1 + Math.floor(hash(x + dx, z + dz) * 3); // 1-3 blocks
        for (let i = 1; i <= length; i++) put(dx, lowest - i, dz, "f");
      }
    }
  }
  return [...blocks.values()];
}

// Room for the trunk? Leaves only go where there is room, so the tree fits around cherry trees and hills.
function hasRoom(base) {
  for (let dy = 1; dy <= 7; dy++) {
    const b = blockAt(base.dimension, base.x, base.y + dy, base.z);
    if (!isSoft(b)) return false;
  }
  return true;
}

function growTree(base) {
  const dim = base.dimension, { x, y, z } = base.location;
  const placed = [];
  for (const [dx, dy, dz, kind] of treeShape(x, z)) {
    const b = blockAt(dim, x + dx, y + dy, z + dz);
    if (!b) continue;
    const trunk = dx === 0 && dz === 0 && dy <= 7;
    if (!trunk && !isSoft(b)) continue;
    b.setType(kind === "s" ? SEED_LOG : kind === "l" ? LOG : LEAVES);
    placed.push([x + dx, y + dy, z + dz, kind]);
  }
  saveTree(keyOf(dim.id, { x, y: y + SEED_HEIGHT, z }), { phase: "alive", blocks: placed });
  effects(base, "random.levelup");
  tryRun(() => dim.spawnParticle("minecraft:crop_growth_emitter", { x: x + 0.5, y: y + SEED_HEIGHT + 0.5, z: z + 0.5 }));
}

// --- sapling -----------------------------------------------------------------------------------------
// A full-grown sapling becomes a tree if it may (no other tree near) and can (room for the trunk).
// If it may not, it becomes a flowering heart flower instead. A wild one with no room does too.
function tryBecomeTree(sapling) {
  const wild = sapling.permutation.getState(WILD) === true;
  if (treeNear(sapling.dimension.id, sapling.x, sapling.z)) {
    sapling.setPermutation(BlockPermutation.resolve(FLOWER, { [GROWTH]: FULL }));
    return;
  }
  if (!hasRoom(sapling)) {
    if (wild) sapling.setPermutation(BlockPermutation.resolve(FLOWER, { [GROWTH]: FULL }));
    return;
  }
  growTree(sapling);
}

function growStage(block, type) {
  const growth = block.permutation.getState(GROWTH);
  if (growth < FULL) {
    block.setPermutation(block.permutation.withState(GROWTH, growth + 1));
    return true;
  }
  if (type === SAPLING) {
    tryBecomeTree(block);
    return true;
  }
  return false; // a flowering heart flower is done
}

// No bone meal for the sapling (or the heart flower): they only grow by waiting.
export const heartSaplingComponent = {
  onTick({ block }) {
    if (block.typeId === SAPLING && block.permutation.getState(WILD) === true) tryBecomeTree(block);
  },
  onRandomTick({ block }) {
    if (block.typeId !== SAPLING || Math.random() >= GROW_CHANCE) return;
    growStage(block, SAPLING);
  },
};

// The heart flower plant: once it flowers, using it picks a heart berry. The plant goes back to a bud and
// flowers again after a while. Bone meal does nothing here: you have to wait.
export const heartFlowerComponent = {
  onRandomTick({ block }) {
    if (block.typeId !== FLOWER) return;
    const chance = block.permutation.getState(GROWTH) === FULL - 1 ? BLOOM_CHANCE : GROW_CHANCE;
    if (Math.random() >= chance) return;
    growStage(block, FLOWER);
  },
  onPlayerInteract({ block, player }) {
    if (!player || block.permutation.getState(GROWTH) < FULL) return;
    block.setPermutation(block.permutation.withState(GROWTH, FULL - 1));
    block.dimension.spawnItem(new ItemStack(HEART_BERRY, 1), block.center());
    effects(block, "block.sweet_berry_bush.pick");
  },
};

// --- planting the seed (item custom component) ------------------------------------------------------
export const heartSeedComponent = {
  onUseOn({ block, blockFace, source, itemStack }) {
    if (source?.typeId !== "minecraft:player" || blockFace !== "Up" || !SOIL.has(block.typeId)) return;
    const spot = block.above();
    if (!spot?.isAir) return;
    const player = source;
    system.run(() => {
      if (!spot.isValid || !spot.isAir) return;
      const asTree = inCherryGrove(spot) && !treeNear(spot.dimension.id, spot.x, spot.z);
      spot.setPermutation(asTree
        ? BlockPermutation.resolve(SAPLING, { [GROWTH]: 0, [WILD]: false })
        : BlockPermutation.resolve(FLOWER, { [GROWTH]: 0 }));
      effects(spot, "dig.grass", "minecraft:crop_growth_emitter");
      player.onScreenDisplay.setActionBar({ translate: asTree ? "foodcraft.heart_seed.tree" : "foodcraft.heart_seed.flower" });
      if (isCreative(player)) return;
      const equippable = player.getComponent(EntityComponentTypes.Equippable);
      const held = equippable?.getEquipment(EquipmentSlot.Mainhand);
      if (held?.typeId !== SEED) return;
      if (held.amount > 1) {
        held.amount -= 1;
        equippable.setEquipment(EquipmentSlot.Mainhand, held);
      } else equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    });
  },
};

// --- the seed log: taking the seed makes the tree wither --------------------------------------------
function startWithering(key, tree) {
  const { dimId } = parseKey(key);
  const dim = tryRun(() => world.getDimension(dimId));
  if (!dim) return saveTree(key, undefined);
  const left = [];
  for (const [x, y, z, kind] of tree.blocks) {
    const b = blockAt(dim, x, y, z);
    if (!b) {
      left.push([x, y, z, kind]); // not loaded: try again later
      continue;
    }
    if (b.typeId === LOG || b.typeId === SEED_LOG) b.setPermutation(BlockPermutation.resolve(PALE_LOG));
    else if (b.typeId === LEAVES) b.setPermutation(BlockPermutation.resolve(PALE_LEAVES, { persistent_bit: true }));
    else continue; // already gone (or the player put something else there)
    left.push([x, y, z, kind]);
  }
  // Leaves fall first, from the outside in; the trunk goes last, from the top.
  const { x: sx, z: sz } = parseKey(key);
  left.sort((a, b) => (a[3] === "f") !== (b[3] === "f") ? (a[3] === "f" ? -1 : 1)
    : a[3] === "f" ? Math.hypot(b[0] - sx, b[2] - sz) - Math.hypot(a[0] - sx, a[2] - sz) : b[1] - a[1]);
  saveTree(key, { phase: "withering", blocks: left });
}

function witherStep(key, tree) {
  const { dimId } = parseKey(key);
  const dim = tryRun(() => world.getDimension(dimId));
  const left = [];
  let removed = 0;
  for (const entry of tree.blocks) {
    if (removed >= WITHER_PER_STEP) {
      left.push(entry);
      continue;
    }
    const [x, y, z] = entry;
    const b = dim && blockAt(dim, x, y, z);
    if (!b) {
      left.push(entry);
      continue;
    }
    // Still a tree block (not yet turned pale, e.g. it was unloaded when the tree withered): turn it now.
    if (b.typeId === LOG || b.typeId === SEED_LOG || b.typeId === LEAVES) {
      b.setPermutation(b.typeId === LEAVES ? BlockPermutation.resolve(PALE_LEAVES, { persistent_bit: true }) : BlockPermutation.resolve(PALE_LOG));
      left.push(entry);
      continue;
    }
    if (b.typeId !== PALE_LOG && b.typeId !== PALE_LEAVES) continue; // the player took it
    b.setType("minecraft:air");
    tryRun(() => dim.spawnParticle("minecraft:basic_smoke_particle", { x: x + 0.5, y: y + 0.5, z: z + 0.5 }));
    removed++;
  }
  saveTree(key, left.length ? { phase: "withering", blocks: left } : undefined);
}

export const heartTreeComponent = {
  // The seed log was broken: its loot drops the seed, and the tree starts withering at once.
  onPlayerBreak({ block, dimension }) {
    const key = keyOf(dimension.id, block.location);
    const tree = loadTree(key);
    if (tree?.phase === "alive") startWithering(key, tree);
    tryRun(() => dimension.playSound("block.cherry_leaves.break", block.center()));
  },
};

// Every 2 seconds: a living tree whose seed log is gone (explosion, piston) starts withering; withering trees
// lose a few blocks.
system.runInterval(() => {
  for (const key of treeKeys()) {
    const tree = loadTree(key);
    if (!tree) {
      saveTree(key, undefined);
      continue;
    }
    if (tree.phase === "withering") {
      witherStep(key, tree);
      continue;
    }
    const { dimId, x, y, z } = parseKey(key);
    const dim = tryRun(() => world.getDimension(dimId));
    const seed = dim && blockAt(dim, x, y, z);
    if (seed && seed.typeId !== SEED_LOG) startWithering(key, tree);
  }
}, STEP_TICKS);

