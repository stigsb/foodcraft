// Foodcraft Modellbenk (artifact https://claude.ai/code/artifact/eeaa7f09-1b4c-45bf-b452-a19e7af6ca62).
// Rebuild: node tools/modellbenk/build.cjs && node tools/modellbenk/assemble.cjs -> dist/modellbenk/modellbenk.html,
// then publish that file with the Artifact tool, passing the url above.
// Gathers models + textures from the foodcraft repo into data.js (const DATA = {...}).
const fs = require("fs"), path = require("path");
const REPO = path.resolve(__dirname, "../..").split(path.sep).join("/");
const RP = REPO + "/packs/foodcraft_rp", BP = REPO + "/packs/foodcraft_bp";
const OUT = path.join(REPO, "dist", "modellbenk"); // generated, git-ignored
fs.mkdirSync(OUT, { recursive: true });
const rd = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const textures = {}; // repo-relative path -> {w,h,src}
function pngSize(buf) { return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; }
function addTex(rel) { // rel like "textures/blocks/x" (no ext) inside RP
  const repoRel = "packs/foodcraft_rp/" + rel + (rel.endsWith(".png") ? "" : ".png");
  if (!textures[repoRel]) {
    const buf = fs.readFileSync(REPO + "/" + repoRel);
    const [w, h] = pngSize(buf);
    textures[repoRel] = { w, h, src: "data:image/png;base64," + buf.toString("base64") };
  }
  return repoRel;
}

// lang
const lang = {};
for (const line of fs.readFileSync(RP + "/texts/nb_NO.lang", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) lang[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const terrain = rd(RP + "/textures/terrain_texture.json").texture_data;
const terrainPath = (key) => { const t = terrain[key].textures; return addTex(typeof t === "string" ? t : t[0]); };

// geometry -> normalized faces in Blockbench space uv [u1,v1,u2,v2]
function boxFaces(u, v, s) {
  const [w, h, d] = s.map((x) => Math.floor(x));
  const f = {
    east: [u, v + d, u + d, v + d + h], west: [u + d + w, v + d, u + 2 * d + w, v + d + h],
    up: [u + d + w, v + d, u + d, v], down: [u + d + 2 * w, v, u + d + w, v + d],
    south: [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h], north: [u + d, v + d, u + d + w, v + d + h],
  };
  const [X, Y, Z] = s, out = {};
  const area = { east: Y * Z, west: Y * Z, up: X * Z, down: X * Z, north: X * Y, south: X * Y };
  for (const k in f) if (area[k] > 0) out[k] = f[k];
  return out;
}
const geos = {};
function addGeo(file) {
  const g = rd(file)["minecraft:geometry"][0];
  const id = g.description.identifier;
  const bones = g.bones.map((b) => ({
    name: b.name, parent: b.parent,
    cubes: (b.cubes || []).map((c) => {
      let uv = {};
      if (Array.isArray(c.uv)) uv = boxFaces(c.uv[0], c.uv[1], c.size);
      else for (const [face, fu] of Object.entries(c.uv || {})) {
        const [a, bb] = fu.uv, [w, h] = fu.uv_size;
        uv[face] = face === "up" || face === "down" ? [a + w, bb + h, a, bb] : [a, bb, a + w, bb + h];
      }
      const o = { o: c.origin, s: c.size, uv };
      if (c.rotation) { o.r = c.rotation; o.p = c.pivot || [0, 0, 0]; }
      return o;
    }),
  }));
  geos[id] = { tw: g.description.texture_width, th: g.description.texture_height, bones };
  return id;
}

// custom-geometry blocks
const blocks = {};
for (const f of ["pizza_oven", "tomato_crop", "tomato_crop_top", "pineapple_crop", "cutting_board", "scallop_bed"]) {
  const b = rd(`${BP}/blocks/${f}.json`)["minecraft:block"];
  const g = b.components["minecraft:geometry"];
  const gid = typeof g === "string" ? g : g.identifier;
  const geoFile = fs.readdirSync(RP + "/models/blocks").map((n) => RP + "/models/blocks/" + n).find((p) => rd(p)["minecraft:geometry"][0].description.identifier === gid);
  addGeo(geoFile);
  const id = b.description.identifier;
  blocks[id] = {
    states: b.description.states || {}, geometry: gid, vis: (typeof g === "object" && g.bone_visibility) || {},
    texture: terrainPath(b.components["minecraft:material_instances"]["*"].texture),
    name: lang[`tile.${id}.name`] || id,
  };
}

// cross crops: per growth stage the texture from permutations
const crops = {};
for (const f of fs.readdirSync(BP + "/blocks")) {
  const b = rd(`${BP}/blocks/${f}`)["minecraft:block"];
  if (b.components["minecraft:geometry"] !== "minecraft:geometry.cross") continue;
  const id = b.description.identifier, key = id.split(":")[1];
  const base = b.components["minecraft:material_instances"]["*"].texture;
  const growth = (b.description.states || {})["foodcraft:growth"];
  const entry = { id, name: lang[`tile.${id}.name`] || key, stages: [] };
  if (!growth) entry.stages = [terrainPath(base)];
  else entry.stages = growth.map((g) => {
    const p = (b.permutations || []).find((p) => p.condition.replace(/\s/g, "") === `q.block_state('foodcraft:growth')==${g}` && p.components["minecraft:material_instances"]);
    return terrainPath(p ? p.components["minecraft:material_instances"]["*"].texture : base);
  });
  crops[key] = entry;
}

// fish entities
const fish = [];
for (const f of fs.readdirSync(RP + "/entity").filter((n) => n.startsWith("foodcraft_")).sort()) {
  const e = rd(RP + "/entity/" + f)["minecraft:client_entity"].description;
  const id = e.identifier, key = id.split(":")[1];
  const gid = e.geometry.default;
  addGeo(RP + "/models/entity/" + gid.replace("geometry.", "") + ".geo.json");
  fish.push({ key, id, name: lang[`entity.${id}.name`] || key, geometry: gid, texture: addTex(e.textures.default) });
}

// items
const itemTex = rd(RP + "/textures/item_texture.json").texture_data;
const items = [];
for (const f of fs.readdirSync(BP + "/items").sort()) {
  const it = rd(BP + "/items/" + f)["minecraft:item"];
  const id = it.description.identifier, key = id.split(":")[1];
  const icon = it.components["minecraft:icon"];
  const ik = typeof icon === "string" ? icon : icon.textures?.default || icon.texture;
  if (!itemTex[ik]) { console.warn("no icon", id); continue; }
  const t = itemTex[ik].textures;
  items.push({ key, id, name: lang[`item.foodcraft.${key}.name`] || key, texture: addTex(typeof t === "string" ? t : t[0]) });
}

const DATA = { geos, blocks, crops, fish, items, textures };
const js = "const DATA = " + JSON.stringify(DATA) + ";\n";
fs.writeFileSync(OUT + "/data.js", js);
console.log("bytes", js.length, "textures", Object.keys(textures).length, "crops", Object.keys(crops).join(","), "fish", fish.length, "items", items.length);
console.log(Object.entries(crops).map(([k, c]) => k + ":" + c.stages.map((s) => path.basename(s)).join("|")).join("\n"));
console.log(fish.map((f) => f.key + "=" + f.name + " " + f.geometry).join(", "));
