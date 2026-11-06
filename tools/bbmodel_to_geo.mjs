// Convert a Blockbench .bbmodel (Bedrock block, per-face UV) to Bedrock .geo.json,
// the same way Blockbench's File > Export > Export Bedrock Geometry does.
// Use this when Blockbench is not at hand; otherwise export from Blockbench.
//
// usage: node tools/bbmodel_to_geo.mjs <in.bbmodel> <out.geo.json>
import fs from "node:fs";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node tools/bbmodel_to_geo.mjs <in.bbmodel> <out.geo.json>");
  process.exit(1);
}

const model = JSON.parse(fs.readFileSync(input, "utf8"));
if (model.meta?.box_uv) throw new Error("box UV models are not supported, use per-face UV");

const elements = new Map(model.elements.map((e) => [e.uuid, e]));
// Blockbench 5 keeps groups in a separate list and only uuids in the outliner.
const groups = new Map((model.groups ?? []).map((g) => [g.uuid, g]));

const round = (n) => Math.round(n * 10000) / 10000;
const flipX = (v) => [round(-v[0]), round(v[1]), round(v[2])];
// Bedrock rotates X and Y the other way round because the X axis is mirrored.
const flipRot = (r) => [round(-r[0]), round(-r[1]), round(r[2])];
const isZero = (v) => !v || v.every((n) => n === 0);

function cubeOf(e) {
  const inflate = e.inflate ?? 0;
  const size = [0, 1, 2].map((i) => round(e.to[i] - e.from[i]));
  const cube = {
    origin: [round(-(e.from[0] + size[0])), round(e.from[1]), round(e.from[2])],
    size,
  };
  if (inflate) cube.inflate = inflate;
  if (!isZero(e.rotation)) {
    cube.pivot = flipX(e.origin);
    cube.rotation = flipRot(e.rotation);
  }
  const uv = {};
  for (const [face, f] of Object.entries(e.faces ?? {})) {
    if (f.texture === null || f.texture === undefined || f.texture === false) continue;
    let [u1, v1, u2, v2] = f.uv;
    if (face === "up" || face === "down") {
      // Bedrock draws up/down faces flipped; Blockbench exports them from the far corner.
      [u1, v1, u2, v2] = [u2, v2, u1, v1];
    }
    uv[face] = { uv: [round(u1), round(v1)], uv_size: [round(u2 - u1), round(v2 - v1)] };
    if (f.rotation) uv[face].uv_rotation = f.rotation;
  }
  cube.uv = uv;
  return cube;
}

const bones = [];
function walk(node, parentName) {
  if (typeof node === "string" && elements.has(node)) return { cube: elements.get(node) };
  const group = typeof node === "string" ? groups.get(node) : { ...groups.get(node.uuid), ...node };
  if (!group) throw new Error(`unknown outliner node ${JSON.stringify(node)}`);
  if (group.export === false) return undefined;
  const bone = { name: group.name };
  if (parentName) bone.parent = parentName;
  bone.pivot = flipX(group.origin ?? [0, 0, 0]);
  if (!isZero(group.rotation)) bone.rotation = flipRot(group.rotation);
  const cubes = [];
  bones.push(bone);
  for (const child of node.children ?? []) {
    const r = walk(child, group.name);
    if (r?.cube && r.cube.export !== false) cubes.push(cubeOf(r.cube));
  }
  if (cubes.length) bone.cubes = cubes;
  return undefined;
}
for (const node of model.outliner) {
  if (typeof node === "string" && elements.has(node)) throw new Error("loose cube outside a bone");
  walk(node);
}

const [vw, vh, vy] = model.visible_box ?? [1, 1, 0];
const geo = {
  format_version: "1.21.0",
  "minecraft:geometry": [
    {
      description: {
        identifier: model.model_identifier.startsWith("geometry.") ? model.model_identifier : `geometry.${model.model_identifier}`,
        texture_width: model.resolution.width,
        texture_height: model.resolution.height,
        visible_bounds_width: vw,
        visible_bounds_height: vh,
        visible_bounds_offset: [0, vy, 0],
      },
      bones,
    },
  ],
};
fs.writeFileSync(output, JSON.stringify(geo, null, "\t") + "\n");
console.log(`${output}: ${bones.length} bones, ${bones.reduce((n, b) => n + (b.cubes?.length ?? 0), 0)} cubes`);
