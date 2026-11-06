# Art drafts

Generated placeholder art for Pizza Night v1. Redraw everything in Blockbench and keep the file names.

| Folder | Contents | Open in Blockbench |
|---|---|---|
| `textures/items/` | 22 item textures, 16×16 | File > Open, pick the PNG, paint, File > Save |
| `textures/blocks/` | Crop stages 0–3, wild plants, oven faces | Same as items |
| `models/pizza_oven.bbmodel` | Oven block model (bricks, front opening, chimney) | File > Open Model |
| `models/pizza_oven_open.bbmodel` | Oven with an open mouth and the bones from plan Task 6: `body`, `flame`, `pizza_margherita`, `pizza_pepperoni`, `pizza_prosciutto`, `pizza_hawaii`. Uses `textures/blocks/pizza_oven.png` (64×64) | File > Open Model |
| `models/pineapple_crop.bbmodel` | Pineapple plant, one block. Uses `textures/blocks/pineapple_plant.png` (32×32) | File > Open Model |
| `models/tomato_crop_lower.bbmodel`, `models/tomato_crop_upper.bbmodel` | Two-block tomato plant on a stake, one model per block. Both use `textures/blocks/tomato_plant.png` (32×32) | File > Open Model |

Oven front has three textures, one per state (`pizza_oven_front_empty`, `_baking`, `_done`). The model shows `empty`. All three must keep the same layout so the opening lines up.

Oregano, garlic and the wild plants use Minecraft's built-in cross model, so they need only a texture.

## Tomato plant (two blocks tall)

The tomato crop is two blocks: `geometry.foodcraft_tomato_crop_lower` sits on the farmland and `geometry.foodcraft_tomato_crop_upper` sits on top of it. A block model can be at most 30 pixels tall, so one model cannot cover 32 pixels.

The plant grows fast and the fruit ripens slowly, so the block has two states:

- `foodcraft:growth` 0–2: sprout, half-grown, full plant. The upper block appears at 1.
- `foodcraft:fruit` 0–5, used only at growth 2: 0 picked, 1 flowers, 2 small green, 3 green, 4 turning (orange), 5 red. When the plant reaches growth 2, the script sets fruit to 1. Picking red tomatoes sets fruit to 0, and the next random tick starts again at 1.

Let the script advance `fruit` on fewer random ticks than `growth` so ripening takes longer.

| Bone | Lower block | Upper block |
|---|---|---|
| `sprout` | growth 0 | growth 1 |
| `stake` (stake and twine) | growth 1–2 | growth 1–2 |
| `foliage` | growth 1–2 | growth 2 |
| `flowers` | fruit 1 | fruit 1 |
| `tomatoes_small` | fruit 2 | fruit 2 |
| `tomatoes_green` | fruit 3 | fruit 3 |
| `tomatoes_turning` | fruit 4 | fruit 4 |
| `tomatoes_red` | fruit 5 | fruit 5 |
| `tomatoes_picked` (calyx and stem where each tomato hung) | fruit 0 | fruit 0 |

Every `fruit` bone also needs growth 2. Example `bone_visibility` for the lower block:

```json
"sprout": "q.block_state('foodcraft:growth') == 0",
"foliage": "q.block_state('foodcraft:growth') >= 1",
"tomatoes_red": "q.block_state('foodcraft:growth') == 2 && q.block_state('foodcraft:fruit') == 5"
```

Use `"render_method": "alpha_test"` so the leaves get see-through gaps and show from both sides.

The models open showing the ripe plant. The other stages are hidden in the outliner: click the eye icon to see them.

## Pineapple plant

One block, geometry `geometry.foodcraft_pineapple_crop`. Same two states as the tomato, but `foodcraft:fruit` goes 0–4: 0 picked, 1 flower spike, 2 small green, 3 green, 4 golden.

| Bone | Shown at |
|---|---|
| `rosette_small` | growth 0 |
| `rosette_medium` | growth 1 |
| `rosette` | growth 2 |
| `stalk` | growth 2 |
| `flower` (red flower spike) | fruit 1 |
| `fruit_small` | fruit 2 |
| `fruit_green` | fruit 3 |
| `fruit_ripe` | fruit 4 |
| `fruit_picked` (cut stalk) | fruit 0 |

Every `fruit` bone also needs growth 2. The leaves are flat strips tilted 22.5° or 45° on one axis each, plus two crossed planes.

## Pizza oven with bones

`pizza_oven_open.bbmodel` is the model for plan Task 6. `pizza_oven.bbmodel` (the closed box with painted front faces) is left as it was. The mouth faces north (-Z), which the block's rotation turns towards the player. `flame` shows while baking, one `pizza_<name>` when done.
