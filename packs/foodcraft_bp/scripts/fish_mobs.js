// Bucket of <fish>: used on a block, it pours water next to that face and lets the fish out, like
// vanilla fish buckets. Catching is data-driven: the fish entities turn a water bucket into these.
import { system, ItemStack, EquipmentSlot, EntityComponentTypes, Direction } from "@minecraft/server";
import { isCreative } from "./hand.js";

const SUFFIX = "_bucket";
const NEXT = {
  [Direction.Up]: (b) => b.above(),
  [Direction.Down]: (b) => b.below(),
  [Direction.North]: (b) => b.north(),
  [Direction.South]: (b) => b.south(),
  [Direction.East]: (b) => b.east(),
  [Direction.West]: (b) => b.west(),
};

export const fishBucketComponent = {
  onUseOn({ block, blockFace, source, itemStack }) {
    if (source?.typeId !== "minecraft:player") return;
    const target = NEXT[blockFace]?.(block);
    if (!target) return;
    const water = target.typeId === "minecraft:water" || target.typeId === "minecraft:flowing_water";
    if (!water && !target.isAir) return; // only into air or water
    const fish = itemStack.typeId.slice(0, -SUFFIX.length);
    const player = source;
    system.run(() => {
      if (!water) target.setType("minecraft:water");
      target.dimension.spawnEntity(fish, target.center());
      target.dimension.playSound("bucket.empty_fish", target.center());
      if (isCreative(player)) return;
      player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, new ItemStack("minecraft:bucket", 1));
    });
  },
};
