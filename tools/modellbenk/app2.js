
// ---------- Geometry: Bedrock geo.json drawn the way Blockbench shows it ----------
const SHADE = { up: 1, down: 0.5, north: 0.8, south: 0.8, east: 0.64, west: 0.64 };
const matCache = {};
function material(path, cross) {
  const k = path + (cross ? "|x" : "");
  return (matCache[k] ||= new THREE.MeshBasicMaterial({ map: tex(path).three, vertexColors: !cross, alphaTest: 0.5, side: cross ? THREE.DoubleSide : THREE.FrontSide }));
}
// Corners per face as seen from outside: top-left, top-right, bottom-right, bottom-left.
function faceCorners(f, x1, y1, z1, x2, y2, z2) {
  switch (f) {
    case "north": return [[x2, y2, z1], [x1, y2, z1], [x1, y1, z1], [x2, y1, z1]];
    case "south": return [[x1, y2, z2], [x2, y2, z2], [x2, y1, z2], [x1, y1, z2]];
    case "east":  return [[x2, y2, z2], [x2, y2, z1], [x2, y1, z1], [x2, y1, z2]];
    case "west":  return [[x1, y2, z1], [x1, y2, z2], [x1, y1, z2], [x1, y1, z1]];
    case "up":    return [[x1, y2, z1], [x2, y2, z1], [x2, y2, z2], [x1, y2, z2]];
    case "down":  return [[x1, y1, z2], [x2, y1, z2], [x2, y1, z1], [x1, y1, z1]];
  }
}
function quadsToMesh(quads, tw, th, mat) {
  const pos = [], uv = [], col = [];
  for (const q of quads) {
    const [u1, v1, u2, v2] = q.uv;
    const T = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]];
    for (const i of [0, 3, 2, 0, 2, 1]) {
      pos.push(...q.p[i]);
      uv.push(T[i][0] / tw, 1 - T[i][1] / th);
      col.push(q.shade, q.shade, q.shade);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Mesh(g, mat);
}
function cubeObject(c, tw, th, mat) {
  // geo.json -> Blockbench space: mirror x, mirror x/y rotation. UVs are pre-normalised to Blockbench order.
  const x1 = -(c.o[0] + c.s[0]), x2 = -c.o[0];
  const y1 = c.o[1], y2 = c.o[1] + c.s[1], z1 = c.o[2], z2 = c.o[2] + c.s[2];
  const quads = Object.entries(c.uv).map(([f, uv]) => ({ p: faceCorners(f, x1, y1, z1, x2, y2, z2), uv, shade: SHADE[f] }));
  const mesh = quadsToMesh(quads, tw, th, mat);
  if (!c.r) return mesh;
  const pv = [-(c.p?.[0] ?? 0), c.p?.[1] ?? 0, c.p?.[2] ?? 0];
  const holder = new THREE.Group();
  holder.position.set(...pv);
  mesh.position.set(-pv[0], -pv[1], -pv[2]);
  holder.rotation.order = "ZYX";
  holder.rotation.set(THREE.MathUtils.degToRad(-c.r[0]), THREE.MathUtils.degToRad(-c.r[1]), THREE.MathUtils.degToRad(c.r[2]));
  holder.add(mesh);
  return holder;
}
function geoObject(geoId, path) {
  const g = DATA.geos[geoId], mat = material(path);
  const root = new THREE.Group(), bones = {};
  for (const bone of g.bones) {
    const grp = new THREE.Group();
    bone.cubes.forEach((c) => grp.add(cubeObject(c, g.tw, g.th, mat)));
    bones[bone.name] = grp; root.add(grp);
  }
  return { root, bones, geo: g };
}
function crossObject(path) {
  // minecraft:geometry.cross: two planes from corner to corner.
  const mat = material(path, true), root = new THREE.Group(), w = 16 * Math.SQRT2;
  for (const a of [45, -45]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 16), mat);
    m.position.y = 8; m.rotation.y = THREE.MathUtils.degToRad(a);
    root.add(m);
  }
  return root;
}
function itemObject(path) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), material(path, true));
  m.position.y = 8;
  const g = new THREE.Group(); g.add(m); return g;
}

// ---------- Ground blocks ----------
function pixelTexture(fn) {
  const c = document.createElement("canvas"); c.width = c.height = 16;
  const x = c.getContext("2d");
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = fn(i, j); x.fillRect(i, j, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; return t;
}
const hh = (i, j) => ((i * 73856093) ^ (j * 19349663)) % 7;
const GROUND = {
  farmland: { dip: 1,
    top: pixelTexture((i, j) => (j % 4 === 0 ? "#3b2416" : hh(i, j) < 2 ? "#5a3a24" : "#4a2f1d")),
    side: pixelTexture((i, j) => (j < 1 ? "#4a2f1d" : hh(i, j) < 2 ? "#6b4a2f" : hh(i, j) < 4 ? "#7d5a3a" : "#8a6442")) },
  grass: {
    top: pixelTexture((i, j) => (hh(i, j) < 2 ? "#5d9a3c" : hh(i, j) < 4 ? "#6fae48" : "#7cbb52")),
    side: pixelTexture((i, j) => (j < 3 || (j < 5 && hh(i, j) < 3) ? "#6fae48" : hh(i, j) < 2 ? "#6b4a2f" : "#8a6442")) },
  sand: {
    top: pixelTexture((i, j) => (hh(i, j) < 2 ? "#d8c98f" : hh(i, j) < 4 ? "#e3d5a0" : "#dccd95")),
    side: pixelTexture((i, j) => (hh(i, j) < 2 ? "#d8c98f" : hh(i, j) < 4 ? "#e3d5a0" : "#dccd95")) },
  planks: {
    top: pixelTexture((i, j) => (j % 4 === 3 ? "#6b4f2c" : hh(i, j) < 2 ? "#9c7a48" : "#a8844f")),
    side: pixelTexture((i, j) => (j % 4 === 3 ? "#6b4f2c" : hh(i, j) < 2 ? "#9c7a48" : "#a8844f")) },
};
function groundBlock(kind) {
  const g = GROUND[kind];
  const side = new THREE.MeshBasicMaterial({ map: g.side, color: 0xa3a3a3 });
  const top = new THREE.MeshBasicMaterial({ map: g.top });
  const dark = new THREE.MeshBasicMaterial({ map: g.side, color: 0x828282 });
  const hgt = 16 - (g.dip || 0);
  const m = new THREE.Mesh(new THREE.BoxGeometry(16, hgt, 16), [dark, dark, top, side, side, side]);
  m.position.y = -hgt / 2 - (g.dip || 0);
  return m;
}

// ---------- Scene ----------
const canvas = document.getElementById("canvas");
const viewport = document.getElementById("viewport");
const tagsEl = document.getElementById("tags");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const view = { model: MODELS[0], cat: "blokker", mode: "all", stage: 7, spin: 25, pitch: 18, zoom: 1, spinning: false };
let items = [];
let frame = { cy: 8, h: 16, w: 24, minY: -16 };

function contentFor(m, si) {
  const [, state] = m.stages[si];
  const group = new THREE.Group();
  const ground = m.kind === "geo" || m.kind === "item" ? null : (m.ground || "farmland");
  if (ground) group.add(groundBlock(ground));
  const lower = ground ? -(GROUND[ground].dip || 0) : 0;
  if (m.kind === "block") {
    for (const [id, y] of m.blocks) {
      const b = DATA.blocks[id], o = geoObject(b.geometry, b.texture);
      o.root.position.y = y + lower;
      for (const [name, grp] of Object.entries(o.bones)) grp.visible = visible(b.vis[name] ?? true, state);
      group.add(o.root);
    }
  } else if (m.kind === "cross") {
    for (const [p, y] of m.cross(si)) { const o = crossObject(p); o.position.y = y + lower; group.add(o); }
  } else if (m.kind === "geo") {
    group.add(geoObject(m.geo, m.tex).root);
  } else {
    group.add(itemObject(m.tex));
  }
  return group;
}

function buildModel(m) {
  scene.clear(); items = []; tagsEl.innerHTML = "";
  const list = view.mode === "all" ? m.stages.map((s, i) => i) : [view.stage];
  // Measure one stage to space the row and frame the camera.
  const probe = contentFor(m, list[list.length - 1]);
  const box = new THREE.Box3().setFromObject(probe);
  const r = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z), 8);
  const gap = Math.max(22, 2 * r + 6);
  let minY = box.min.y, maxY = box.max.y;
  list.forEach((si, k) => {
    const [label] = m.stages[si];
    const holder = new THREE.Group();
    holder.position.x = (k - (list.length - 1) / 2) * gap;
    const spinner = k === list.length - 1 ? probe : contentFor(m, si);
    holder.add(spinner);
    if (spinner !== probe) { const b = new THREE.Box3().setFromObject(spinner); minY = Math.min(minY, b.min.y); maxY = Math.max(maxY, b.max.y); }
    scene.add(holder);
    const tag = document.createElement("div");
    tag.className = "tag"; tag.innerHTML = `<i>${si + 1}</i>`; tag.append(label);
    tagsEl.appendChild(tag);
    items.push({ holder, spinner, tag });
  });
  frame = { cy: (minY + maxY) / 2, h: maxY - minY, w: (list.length - 1) * gap + 2 * r, minY };
  render();
}

function resize() {
  const rc = viewport.getBoundingClientRect();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(rc.width, rc.height, false);
  camera.aspect = rc.width / rc.height; camera.updateProjectionMatrix();
  render();
}
let raf = 0;
render3D = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
function render() {
  if (!items.length) return;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const needH = frame.h + 12, needW = frame.w + 8;
  const distH = needH / 2 / Math.tan(fov / 2);
  const distW = needW / 2 / Math.tan(fov / 2) / camera.aspect;
  const dist = Math.max(distH, distW) / view.zoom;
  const p = THREE.MathUtils.degToRad(view.pitch);
  camera.position.set(0, frame.cy + Math.sin(p) * dist, -Math.cos(p) * dist);
  camera.lookAt(0, frame.cy, 0);
  const a = THREE.MathUtils.degToRad(view.spin);
  for (const it of items) it.spinner.rotation.y = a;
  renderer.render(scene, camera);
  const rc = viewport.getBoundingClientRect();
  for (const it of items) {
    const v = new THREE.Vector3(it.holder.position.x, frame.minY - 2, 0).project(camera);
    it.tag.style.left = ((v.x + 1) / 2) * rc.width + "px";
    it.tag.style.top = Math.min(rc.height - 26, ((1 - v.y) / 2) * rc.height + 4) + "px";
    it.tag.hidden = view.mode !== "all";
  }
}

// ---------- 3D controls: drag to turn, wheel or pinch to zoom ----------
const pointers = new Map();
let drag = null, pinch = null;
viewport.addEventListener("pointerdown", (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  viewport.setPointerCapture(e.pointerId); setSpin(false);
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, s: view.spin, p: view.pitch };
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.zoom }; drag = null; }
});
viewport.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    view.zoom = Math.max(0.5, Math.min(6, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); render(); return;
  }
  if (!drag) return;
  view.spin = drag.s + (e.clientX - drag.x) * 0.5;
  view.pitch = Math.max(-30, Math.min(80, drag.p + (e.clientY - drag.y) * 0.3));
  render();
});
const endPtr = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) drag = null; };
viewport.addEventListener("pointerup", endPtr);
viewport.addEventListener("pointercancel", endPtr);
viewport.addEventListener("wheel", (e) => { e.preventDefault(); view.zoom = Math.max(0.5, Math.min(6, view.zoom * Math.exp(-e.deltaY * 0.001))); render(); }, { passive: false });

const spinBtn = document.getElementById("spin");
let last = 0;
function tick(t) {
  if (!view.spinning) return;
  if (last) view.spin += (t - last) * 0.02;
  last = t; render(); requestAnimationFrame(tick);
}
function setSpin(on) {
  view.spinning = on && !reduce; spinBtn.setAttribute("aria-pressed", String(view.spinning));
  last = 0; if (view.spinning) requestAnimationFrame(tick);
}
spinBtn.addEventListener("click", () => setSpin(!view.spinning));
