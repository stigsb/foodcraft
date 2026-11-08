
// ---------- Textures: one working canvas per PNG, shared by the 3D view and the editor ----------
const TEX = {};
let render3D = () => {};
let onTexReady = () => {};
function tex(path) {
  if (TEX[path]) return TEX[path];
  const d = DATA.textures[path];
  const canvas = document.createElement("canvas");
  canvas.width = d.w; canvas.height = d.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const three = new THREE.CanvasTexture(canvas);
  three.magFilter = THREE.NearestFilter; three.minFilter = THREE.NearestFilter; three.generateMipmaps = false;
  const t = { path, w: d.w, h: d.h, canvas, ctx, three, orig: null, base: null, saved: null, dirty: false, undo: [], redo: [], saving: false, thumb: d.src };
  t.ready = loadImage(d.src).then((img) => {
    ctx.drawImage(img, 0, 0);
    t.orig = ctx.getImageData(0, 0, d.w, d.h);
    t.base = t.orig;
    three.needsUpdate = true;
    onTexReady(t);
    render3D();
  });
  TEX[path] = t;
  return t;
}
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// ---------- What each model is ----------
const CROSS_LABELS = ["Frø", "Spire", "Halvvoksen", "Moden"];
const L = (k) => DATA.items.find((i) => i.key === k)?.name;
const CATS = [["blokker", "Blokker"], ["avlinger", "Avlinger"], ["ville", "Ville planter"], ["fisk", "Fisk"], ["ting", "Gjenstander"]];
const MODELS = [
  {
    key: "tomato", cat: "blokker", kind: "block", name: "Tomat", sub: "To blokker høy, plukkes igjen og igjen",
    blocks: [["foodcraft:tomato_crop", 0], ["foodcraft:tomato_crop_top", 16]], icon: "packs/foodcraft_rp/textures/items/foodcraft_tomato.png",
    loopNote: "Etter plukking modner planten på nytt fra blomster.",
    stages: [
      ["Spire", { "foodcraft:growth": 0, "foodcraft:fruit": 0 }],
      ["Liten plante", { "foodcraft:growth": 1, "foodcraft:fruit": 0 }],
      ["Stor plante", { "foodcraft:growth": 2, "foodcraft:fruit": 0 }],
      ["Blomster", { "foodcraft:growth": 3, "foodcraft:fruit": 1 }],
      ["Små grønne", { "foodcraft:growth": 3, "foodcraft:fruit": 2 }],
      ["Grønne", { "foodcraft:growth": 3, "foodcraft:fruit": 3 }],
      ["Modner", { "foodcraft:growth": 3, "foodcraft:fruit": 4 }],
      ["Røde, klar", { "foodcraft:growth": 3, "foodcraft:fruit": 5 }],
      ["Plukket", { "foodcraft:growth": 3, "foodcraft:fruit": 0 }, true],
    ],
  },
  {
    key: "pineapple", cat: "blokker", kind: "block", name: "Ananas", sub: "Én blokk, vokser sakte",
    blocks: [["foodcraft:pineapple_crop", 0]], icon: "packs/foodcraft_rp/textures/items/foodcraft_pineapple.png",
    loopNote: "Etter plukking står stilken igjen, og en ny kolbe kommer.",
    stages: [
      ["Liten rosett", { "foodcraft:growth": 0, "foodcraft:fruit": 0 }],
      ["Rosett", { "foodcraft:growth": 1, "foodcraft:fruit": 0 }],
      ["Blomsterkolbe", { "foodcraft:growth": 2, "foodcraft:fruit": 1 }],
      ["Liten frukt", { "foodcraft:growth": 2, "foodcraft:fruit": 2 }],
      ["Grønn", { "foodcraft:growth": 2, "foodcraft:fruit": 3 }],
      ["Gyllen, klar", { "foodcraft:growth": 2, "foodcraft:fruit": 4 }],
      ["Plukket", { "foodcraft:growth": 2, "foodcraft:fruit": 0 }, true],
    ],
  },
  {
    key: "oven", cat: "blokker", kind: "block", name: "Pizzaovn", sub: "Tom, steker, ferdig rett",
    blocks: [["foodcraft:pizza_oven", 0]], ground: "grass", icon: "packs/foodcraft_rp/textures/items/foodcraft_pizza_margherita.png",
    stages: [
      ["Tom", { "foodcraft:stage": "empty", "foodcraft:dish": "none" }],
      ["Steker", { "foodcraft:stage": "baking", "foodcraft:dish": "margherita" }],
      ...[["margherita", "Margherita"], ["pepperoni", "Pepperoni"], ["prosciutto", "Prosciutto"], ["hawaii", "Hawaii"], ["tuna", "Tunfiskpizza"],
        ["lasagna", "Lasagne"], ["cinnamon_buns", "Kanelsnurrer"], ["brownies", "Brownies"], ["waffles", "Vafler"]]
        .map(([d, n]) => [n, { "foodcraft:stage": "done", "foodcraft:dish": d }]),
    ],
  },
  {
    key: "board", cat: "blokker", kind: "block", name: "Skjærebrett", sub: "Hva som ligger på brettet",
    blocks: [["foodcraft:cutting_board", 0]], ground: "planks", icon: "packs/foodcraft_rp/textures/items/foodcraft_knife.png",
    stages: [["Tomt", "none"], ["Liten fisk", "small_fish"], ["Middels fisk", "medium_fish"], ["Stor fisk", "large_fish"], ["Tunfisk", "tuna"],
      ["Biff", "beef"], ["Potet", "potato"], ["Deig", "dough"]].map(([n, v]) => [n, { "foodcraft:item": v, "foodcraft:chops": 0 }]),
  },
  {
    key: "scallop", cat: "blokker", kind: "block", name: "Kamskjellbanke", sub: "Ligger på sandbunnen under vann",
    blocks: [["foodcraft:scallop_bed", 0]], ground: "sand", icon: "packs/foodcraft_rp/textures/items/foodcraft_scallop.png",
    stages: [["Kamskjell", {}]],
  },
];
// Crops drawn as two crossed planes; the game swaps texture per growth stage.
for (const [k, c] of Object.entries(DATA.crops)) {
  if (k.startsWith("wild_") || k === "corn_crop_top") continue;
  const m = { key: k, cat: "avlinger", kind: "cross", name: c.name.replace(/plante$/, ""), sub: "Kryssmodell, " + c.stages.length + " tekstur-stadier", id: c.id,
    stages: c.stages.map((_, i) => [CROSS_LABELS[i] || "Stadium " + i, { "foodcraft:growth": i }]),
    cross: (i) => [[c.stages[i], 0]] };
  if (k === "corn_crop") {
    const top = DATA.crops.corn_crop_top;
    m.sub = "To blokker høy fra stadium 3";
    m.cross = (i) => (i >= 2 ? [[c.stages[i], 0], [top.stages[i], 16]] : [[c.stages[i], 0]]);
    m.tall = true;
  }
  m.icon = c.stages[c.stages.length - 1];
  MODELS.push(m);
}
const wild = Object.entries(DATA.crops).filter(([k]) => k.startsWith("wild_"));
MODELS.push({ key: "wild", cat: "ville", kind: "cross", name: "Alle ville planter", sub: "Vokser i naturen, høstes for frø", ground: "grass",
  stages: wild.map(([, c]) => [c.name, { id: c.id }]), cross: (i) => [[wild[i][1].stages[0], 0]], icon: wild[0][1].stages[0] });
for (const [k, c] of wild) MODELS.push({ key: k, cat: "ville", kind: "cross", name: c.name, sub: "Én tekstur", ground: "grass", id: c.id,
  stages: [[c.name, { id: c.id }]], cross: () => [[c.stages[0], 0]], icon: c.stages[0] });
for (const f of DATA.fish) MODELS.push({ key: "fish_" + f.key, cat: "fisk", kind: "geo", name: f.name, sub: f.id, geo: f.geometry, tex: f.texture, spin: 75,
  stages: [[f.name, { id: f.id }]], icon: DATA.items.find((i) => i.key === f.key)?.texture || f.texture });
for (const it of DATA.items) MODELS.push({ key: "item_" + it.key, cat: "ting", kind: "item", name: it.name, sub: it.id, tex: it.texture,
  stages: [[it.name, { id: it.id }]], icon: it.texture });

// Every texture a model uses, in stage order; and the one that belongs to a given stage.
function modelTextures(m) {
  const out = [];
  const add = (p) => { if (p && !out.includes(p)) out.push(p); };
  if (m.kind === "block") m.blocks.forEach(([id]) => add(DATA.blocks[id].texture));
  else if (m.kind === "cross") m.stages.forEach((_, i) => m.cross(i).forEach(([p]) => add(p)));
  else add(m.tex);
  return out;
}
function stageTexture(m, i) {
  if (m.kind === "cross") return m.cross(i)[0][0];
  return modelTextures(m)[0];
}
// Face rectangles per texture, for the faint outlines in the editor.
const UVRECTS = {};
function addRects(path, geoId) {
  const g = DATA.geos[geoId], set = (UVRECTS[path] ||= new Map());
  const sx = DATA.textures[path].w / g.tw, sy = DATA.textures[path].h / g.th;
  for (const b of g.bones) for (const c of b.cubes) for (const uv of Object.values(c.uv)) {
    const r = [Math.min(uv[0], uv[2]) * sx, Math.min(uv[1], uv[3]) * sy, Math.abs(uv[2] - uv[0]) * sx, Math.abs(uv[3] - uv[1]) * sy];
    if (r[2] > 0 && r[3] > 0) set.set(r.join(","), r);
  }
}
for (const b of Object.values(DATA.blocks)) addRects(b.texture, b.geometry);
for (const f of DATA.fish) addRects(f.texture, f.geometry);

// ---------- Molang: the block's own bone_visibility strings, evaluated against a state ----------
function visible(expr, state) {
  if (typeof expr === "boolean") return expr;
  const js = String(expr).replace(/q(?:uery)?\.block_state\('([^']+)'\)/g, (_, k) => JSON.stringify(state[k]));
  try { return !!Function('"use strict";return (' + js + ");")(); } catch { return true; }
}
