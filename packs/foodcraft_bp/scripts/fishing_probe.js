// Task 1 probe: prints what the script sees when something is fished up. Deleted in Task 3.
import { world, system, EntityComponentTypes } from "@minecraft/server";

const fmt = (v) => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;

world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
  const d = entity.dimension;
  if (entity.typeId === "minecraft:fishing_hook") {
    const owner = entity.getComponent(EntityComponentTypes.Projectile)?.owner;
    world.sendMessage(`[probe] hook spawned at ${fmt(entity.location)} owner=${owner?.nameTag || owner?.typeId || "?"}`);
    return;
  }
  if (entity.typeId !== "minecraft:item") return;
  const stack = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
  if (!stack) return;
  const hooks = (r) => d.getEntities({ type: "minecraft:fishing_hook", location: entity.location, maxDistance: r }).length;
  world.sendMessage(
    `[probe] item ${stack.typeId} x${stack.amount} cause=${cause} biome=${d.getBiome(entity.location).id} ` +
      `hooks r2=${hooks(2)} r5=${hooks(5)} v=${fmt(entity.getVelocity())}`
  );
  system.run(() => {
    if (entity.isValid) world.sendMessage(`[probe]   next tick v=${fmt(entity.getVelocity())} hooks r2=${hooks(2)}`);
  });
});

world.afterEvents.entityRemove.subscribe(({ typeId }) => {
  if (typeId === "minecraft:fishing_hook") world.sendMessage("[probe] hook removed");
});
