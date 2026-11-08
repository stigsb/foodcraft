import { fruitPlant } from "./fruit_plant.js";
import { BERRIES } from "./berry_data.js";

// One custom component for every berry bush: "foodcraft:berry_bush": { "berry": "strawberry" }.
// Growth 0 -> 1 (the bush, with flowers), then fruit 1 -> 2 (ripe). Picking leaves the bush to ripen again.
const plants = Object.fromEntries(
  Object.entries(BERRIES).map(([berry, b]) => [
    berry,
    fruitPlant({
      lower: `foodcraft:${berry}_bush`,
      produce: `foodcraft:${berry}`,
      count: b.count,
      ripe: 2,
      full: 1,
      growChance: 0.25,
      ripenChance: b.ripenChance,
      pickSound: "block.sweet_berry_bush.pick",
    }),
  ])
);

const forward = (name) => (event, { params }) => plants[params?.berry]?.[name]?.(event);

export const berryBushComponent = {
  onRandomTick: forward("onRandomTick"),
  onPlayerInteract: forward("onPlayerInteract"),
};
