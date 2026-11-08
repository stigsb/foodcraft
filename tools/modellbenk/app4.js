
// ---------- Texture workshop ----------
const paint = $("paint"), paper = $("paper"), pctx = paint.getContext("2d");
const ed = { path: null, tool: "pen", hex: "#c2412f", zoom: 8, grid: true, uv: true, stroke: null, hover: null, pan: null, space: false };
const ZOOMS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32];
const cur = () => (ed.path ? tex(ed.path) : null);
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const toHex = (r, g, b) => "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");

function texLabel(m, p) {
  if (m.kind === "cross") {
    const i = m.stages.findIndex((_, si) => m.cross(si).some(([q]) => q === p));
    const top = m.tall && /_top_/.test(p);
    return (m.key === "wild" ? m.stages[i][0] : (CROSS_LABELS[i] || "Stadium " + i)) + (top ? " (topp)" : "");
  }
  return p.split("/").pop().replace(/^foodcraft_/, "").replace(/\.png$/, "");
}
function renderTexList() {
  const m = view.model, el = $("texlist");
  el.innerHTML = "";
  const list = modelTextures(m);
  for (const p of list) {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-pressed", String(p === ed.path)); b.title = p;
    const img = document.createElement("img"); img.alt = ""; img.src = thumb(p);
    b.append(img, texLabel(m, p));
    const t = TEX[p];
    if (t?.dirty || t?.saved) { const d = document.createElement("i"); d.className = "d" + (t.dirty ? " unsaved" : ""); b.appendChild(d); }
    b.addEventListener("click", () => setTexture(p));
    el.appendChild(b);
  }
  el.hidden = list.length < 2;
}
function setTexture(p) {
  ed.path = p; ed.stroke = null;
  const t = tex(p);
  $("texpath").textContent = p;
  $("tex-size").textContent = `${t.w} × ${t.h} piksler`;
  t.ready.then(() => { if (ed.path !== p) return; fitZoom(); drawPaper(); renderPalette(); renderStatus(); });
  renderTexList();
}

function fitZoom() {
  const t = cur(); if (!t) return;
  const maxW = Math.max(120, paper.clientWidth - 12), maxH = window.innerWidth > 760 ? 440 : 360;
  ed.zoom = ZOOMS.filter((z) => t.w * z <= maxW && t.h * z <= maxH).pop() || 2;
  $("zoom-val").textContent = ed.zoom + "×";
}
function setZoom(dir) {
  const i = ZOOMS.indexOf(ed.zoom);
  ed.zoom = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + dir))];
  $("zoom-val").textContent = ed.zoom + "×";
  drawPaper();
}
$("zoom-in").addEventListener("click", () => setZoom(1));
$("zoom-out").addEventListener("click", () => setZoom(-1));
$("opt-grid").addEventListener("change", (e) => { ed.grid = e.target.checked; drawPaper(); });
$("opt-uv").addEventListener("change", (e) => { ed.uv = e.target.checked; drawPaper(); });

let paperRaf = 0;
function queuePaper() { if (!paperRaf) paperRaf = requestAnimationFrame(() => { paperRaf = 0; drawPaper(); }); }
function drawPaper() {
  const t = cur(); if (!t || !t.orig) return;
  const dpr = Math.min(devicePixelRatio || 1, 2), z = ed.zoom, s = z * dpr;
  const W = t.w * s, H = t.h * s;
  if (paint.width !== W || paint.height !== H) { paint.width = W; paint.height = H; }
  paint.style.width = t.w * z + "px"; paint.style.height = t.h * z + "px";
  const ca = css("--check-a"), cb = css("--check-b");
  pctx.imageSmoothingEnabled = false;
  pctx.fillStyle = ca; pctx.fillRect(0, 0, W, H);
  pctx.fillStyle = cb;
  const cs = Math.max(s / 2, 4 * dpr);
  for (let y = 0; y * cs < H; y++) for (let x = 0; x * cs < W; x++) if ((x + y) % 2) pctx.fillRect(x * cs, y * cs, cs, cs);
  pctx.drawImage(t.canvas, 0, 0, W, H);
  if (ed.grid && z >= 6) {
    pctx.strokeStyle = css("--grid"); pctx.lineWidth = 1; pctx.beginPath();
    for (let x = 1; x < t.w; x++) { pctx.moveTo(Math.round(x * s) + 0.5, 0); pctx.lineTo(Math.round(x * s) + 0.5, H); }
    for (let y = 1; y < t.h; y++) { pctx.moveTo(0, Math.round(y * s) + 0.5); pctx.lineTo(W, Math.round(y * s) + 0.5); }
    pctx.stroke();
  }
  const rects = UVRECTS[t.path];
  if (ed.uv && rects) {
    pctx.strokeStyle = css("--uv"); pctx.lineWidth = Math.max(1, dpr); pctx.setLineDash([3 * dpr, 2 * dpr]);
    for (const [x, y, w, h] of rects.values()) pctx.strokeRect(x * s + 0.5, y * s + 0.5, w * s - 1, h * s - 1);
    pctx.setLineDash([]);
  }
  if (ed.hover && !ed.pan) {
    const [x, y] = ed.hover;
    pctx.strokeStyle = css("--ink"); pctx.lineWidth = Math.max(1, dpr);
    pctx.strokeRect(x * s + 0.5, y * s + 0.5, s - 1, s - 1);
  }
}

// Tools
const toolBtns = [...document.querySelectorAll(".tool[data-tool]")];
function setTool(name) {
  ed.tool = name;
  toolBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === name)));
  paper.classList.toggle("pan", name === "pan");
}
toolBtns.forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
function setColor(hex) {
  ed.hex = hex; $("swatch").style.background = hex; $("hex").textContent = hex; $("picker").value = hex;
  document.querySelectorAll("#palette button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.hex === hex)));
}
$("picker").addEventListener("input", (e) => { setColor(e.target.value); if (ed.tool !== "fill") setTool("pen"); });
function renderPalette() {
  const t = cur(); if (!t) return;
  const d = t.ctx.getImageData(0, 0, t.w, t.h).data, count = new Map();
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { const h = toHex(d[i], d[i + 1], d[i + 2]); count.set(h, (count.get(h) || 0) + 1); }
  const el = $("palette"), label = el.firstElementChild;
  el.innerHTML = ""; el.appendChild(label);
  [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([h]) => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.hex = h; b.style.background = h; b.title = h; b.setAttribute("aria-label", "Farge " + h);
    b.setAttribute("aria-pressed", String(h === ed.hex));
    b.addEventListener("click", () => { setColor(h); if (ed.tool !== "fill") setTool("pen"); });
    el.appendChild(b);
  });
}

// Painting
function texel(e) {
  const t = cur(), r = paint.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / ed.zoom), y = Math.floor((e.clientY - r.top) / ed.zoom);
  return x >= 0 && y >= 0 && x < t.w && y < t.h ? [x, y] : null;
}
function changed(t) { t.three.needsUpdate = true; render3D(); queuePaper(); }
function pushUndo(t) { t.undo.push(t.ctx.getImageData(0, 0, t.w, t.h)); if (t.undo.length > 80) t.undo.shift(); t.redo = []; }
function plot(t, x, y) {
  if (ed.tool === "eraser") t.ctx.clearRect(x, y, 1, 1);
  else { t.ctx.fillStyle = ed.hex; t.ctx.fillRect(x, y, 1, 1); }
}
function line(t, [x0, y0], [x1, y1]) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    plot(t, x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function flood(t, x, y) {
  const img = t.ctx.getImageData(0, 0, t.w, t.h), d = img.data;
  const at = (i) => (d[i] << 24 | d[i + 1] << 16 | d[i + 2] << 8 | d[i + 3]) >>> 0;
  const target = at((y * t.w + x) * 4);
  const n = parseInt(ed.hex.slice(1), 16), nr = n >> 16 & 255, ng = n >> 8 & 255, nb = n & 255;
  if (target === ((nr << 24 | ng << 16 | nb << 8 | 255) >>> 0)) return false;
  const stack = [[x, y]], seen = new Uint8Array(t.w * t.h);
  while (stack.length) {
    const [cx, cy] = stack.pop(), k = cy * t.w + cx;
    if (cx < 0 || cy < 0 || cx >= t.w || cy >= t.h || seen[k] || at(k * 4) !== target) continue;
    seen[k] = 1; d[k * 4] = nr; d[k * 4 + 1] = ng; d[k * 4 + 2] = nb; d[k * 4 + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  t.ctx.putImageData(img, 0, 0);
  return true;
}
paint.addEventListener("pointerdown", (e) => {
  const t = cur(); if (!t || !t.orig || ed.stroke || ed.pan) return;
  paint.setPointerCapture(e.pointerId);
  if (ed.tool === "pan" || ed.space || e.button === 1) { ed.pan = { id: e.pointerId, x: e.clientX, y: e.clientY, l: paper.scrollLeft, t: paper.scrollTop }; queuePaper(); return; }
  const p = texel(e); if (!p) return;
  if (ed.tool === "pick") {
    const [r, g, b, a] = t.ctx.getImageData(p[0], p[1], 1, 1).data;
    if (a === 0) setTool("eraser"); else { setColor(toHex(r, g, b)); setTool("pen"); }
    return;
  }
  if (ed.tool === "fill") {
    const before = t.ctx.getImageData(0, 0, t.w, t.h);
    if (flood(t, p[0], p[1])) { t.undo.push(before); t.redo = []; changed(t); afterEdit(t); }
    return;
  }
  pushUndo(t);
  ed.stroke = { id: e.pointerId, last: p };
  plot(t, p[0], p[1]); changed(t);
});
paint.addEventListener("pointermove", (e) => {
  const t = cur(); if (!t || !t.orig) return;
  if (ed.pan) {
    if (e.pointerId !== ed.pan.id) return;
    paper.scrollLeft = ed.pan.l - (e.clientX - ed.pan.x); paper.scrollTop = ed.pan.t - (e.clientY - ed.pan.y); return;
  }
  const p = texel(e);
  const hv = ed.hover; ed.hover = p;
  const coord = $("coord");
  coord.hidden = !p; if (p) coord.textContent = `x ${p[0]}  y ${p[1]}`;
  if (ed.stroke && e.pointerId === ed.stroke.id && p) { line(t, ed.stroke.last, p); ed.stroke.last = p; changed(t); }
  else if (String(hv) !== String(p)) queuePaper();
});
function endStroke(e) {
  if (ed.pan && e.pointerId === ed.pan.id) { ed.pan = null; queuePaper(); return; }
  if (!ed.stroke || e.pointerId !== ed.stroke.id) return;
  ed.stroke = null; afterEdit(cur());
}
paint.addEventListener("pointerup", endStroke);
paint.addEventListener("pointercancel", endStroke);
paint.addEventListener("pointerleave", () => { if (!ed.stroke) { ed.hover = null; $("coord").hidden = true; queuePaper(); } });

function same(a, b) { if (!a || !b || a.data.length !== b.data.length) return false; const x = a.data, y = b.data; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; }
function afterEdit(t) {
  t.dirty = !same(t.ctx.getImageData(0, 0, t.w, t.h), t.base);
  renderPalette(); renderStatus(); renderTexList(); renderModels();
}
function undo() { const t = cur(); if (!t?.undo.length) return; t.redo.push(t.ctx.getImageData(0, 0, t.w, t.h)); t.ctx.putImageData(t.undo.pop(), 0, 0); changed(t); afterEdit(t); }
function redo() { const t = cur(); if (!t?.redo.length) return; t.undo.push(t.ctx.getImageData(0, 0, t.w, t.h)); t.ctx.putImageData(t.redo.pop(), 0, 0); changed(t); afterEdit(t); }
$("undo").addEventListener("click", undo);
$("redo").addEventListener("click", redo);

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); save(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === " " && e.target === document.body) { e.preventDefault(); ed.space = true; paper.classList.add("pan"); return; }
  const map = { b: "pen", p: "pen", e: "eraser", f: "fill", i: "pick" };
  if (map[k] && !e.target.closest("button")) setTool(map[k]);
});
document.addEventListener("keyup", (e) => { if (e.key === " ") { ed.space = false; paper.classList.toggle("pan", ed.tool === "pan"); } });
addEventListener("resize", () => { if (cur()?.orig) drawPaper(); });
addEventListener("beforeunload", (e) => { if (Object.values(TEX).some((t) => t.dirty)) { e.preventDefault(); e.returnValue = ""; } });
