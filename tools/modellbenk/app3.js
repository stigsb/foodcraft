
// ---------- Shelf, stage strip and readout ----------
const $ = (id) => document.getElementById(id);
const catsEl = $("cats"), modelsEl = $("models"), stripEl = $("strip");
const modeAll = $("mode-all"), modeOne = $("mode-one");

function thumb(path) { return TEX[path]?.thumb || DATA.textures[path].src; }

function renderCats() {
  catsEl.innerHTML = "";
  for (const [k, n] of CATS) {
    const b = document.createElement("button");
    b.type = "button"; b.id = "cat-" + k;
    b.setAttribute("aria-pressed", String(view.cat === k));
    b.innerHTML = `${n}<span class="c">${MODELS.filter((m) => m.cat === k).length}</span>`;
    b.addEventListener("click", () => { view.cat = k; renderCats(); renderModels(); });
    catsEl.appendChild(b);
  }
}
function modelMark(m) {
  let saved = false, dirty = false;
  for (const p of modelTextures(m)) { const t = TEX[p]; if (t?.dirty) dirty = true; else if (t?.saved || SAVED[p]) saved = true; }
  return dirty ? "unsaved" : saved ? "saved" : "";
}
function renderModels() {
  modelsEl.innerHTML = "";
  modelsEl.classList.toggle("grid", view.cat === "ting");
  for (const m of MODELS.filter((x) => x.cat === view.cat)) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "model"; b.id = "model-" + m.key;
    b.title = m.name;
    b.setAttribute("aria-pressed", String(m === view.model));
    const img = document.createElement("img"); img.alt = ""; img.src = thumb(m.icon);
    const span = document.createElement("span");
    span.innerHTML = "<b></b><small></small>";
    span.firstChild.textContent = m.name; span.lastChild.textContent = m.sub;
    b.append(img, span);
    const mark = modelMark(m);
    if (mark) { const d = document.createElement("i"); d.className = "dot" + (mark === "unsaved" ? " unsaved" : ""); d.title = mark === "unsaved" ? "Har endringer som ikke er lagret" : "Har lagret tekstur"; b.appendChild(d); }
    b.addEventListener("click", () => selectModel(m));
    modelsEl.appendChild(b);
  }
  $("picked-name").textContent = view.cat === "ting" ? view.model.cat === "ting" ? "Valgt: " + view.model.name : "Trykk på et ikon for å åpne det." : "";
}
function defaultStage(m) {
  const i = m.stages.findIndex((s) => /klar|Steker|Moden/.test(s[0]));
  return i >= 0 ? i : m.stages.length - 1;
}
function selectModel(m) {
  view.model = m; view.stage = defaultStage(m); view.zoom = 1;
  view.spin = m.spin ?? 25;
  view.mode = m.stages.length === 1 ? "one" : "all";
  setTexture(stageTexture(m, view.stage));
  update();
}
function setMode(mode) {
  if (view.model.stages.length === 1) mode = "one";
  view.mode = mode; view.zoom = 1;
  update();
}
modeAll.addEventListener("click", () => setMode("all"));
modeOne.addEventListener("click", () => setMode("one"));

function update() {
  const m = view.model;
  modeAll.setAttribute("aria-pressed", String(view.mode === "all"));
  modeOne.setAttribute("aria-pressed", String(view.mode === "one"));
  modeAll.disabled = m.stages.length === 1;
  renderModels();
  stripEl.innerHTML = "";
  m.stages.forEach(([label, , loop], i) => {
    const c = document.createElement("button");
    c.type = "button"; c.className = "chip" + (loop ? " loop" : "");
    c.setAttribute("aria-pressed", String(view.mode === "one" && i === view.stage));
    c.innerHTML = `<span class="n">${i + 1}</span>`; c.append(label);
    c.addEventListener("click", () => { view.stage = i; setTexture(stageTexture(m, i)); setMode("one"); });
    stripEl.appendChild(c);
  });
  $("strip-label").textContent = m.stages.length === 1 ? "Stadium" : m.loopNote ? "Stadier · " + m.loopNote : "Stadier";
  readout();
  buildModel(m);
  renderTexList();
}

function readout() {
  const m = view.model, [label, state] = m.stages[view.stage];
  const all = view.mode === "all" && m.stages.length > 1;
  $("r-title").textContent = all || m.stages.length === 1 ? m.name : `${m.name}: ${label}`;
  $("r-desc").textContent = all ? `${m.stages.length} stadier side om side. Trykk på et stadium for å se det alene.` : m.sub;
  const st = $("r-state"); st.innerHTML = "";
  const rows = Object.entries(state).map(([k, v]) => [k === "id" ? "identifikator" : k, typeof v === "string" && k !== "id" ? `'${v}'` : String(v)]);
  if (!rows.length) rows.push(["tilstander", "ingen"]);
  for (const [k, v] of rows) { const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = k; dd.textContent = v; st.append(dt, dd); }
  const bl = $("r-bones"); bl.innerHTML = "";
  const li = (text, cls) => { const e = document.createElement("li"); e.className = cls; e.textContent = text; bl.appendChild(e); };
  const src = [];
  if (m.kind === "cross") {
    li("Ingen bein. Spillet bytter tekstur for hvert stadium.", "part");
    src.push("minecraft:geometry.cross", ...m.cross(view.stage).map(([p]) => p.split("/").pop()));
  } else if (m.kind === "item") {
    li("Ingen bein. Et flatt ikon i inventaret.", "part");
    src.push(m.tex.split("/").pop());
  } else if (m.kind === "geo") {
    for (const bone of DATA.geos[m.geo].bones) li(bone.name + (bone.parent ? "  ← " + bone.parent : ""), "on");
    src.push(m.geo, m.tex.split("/").pop());
  } else {
    for (const [id] of m.blocks) {
      const b = DATA.blocks[id], g = DATA.geos[b.geometry];
      if (m.blocks.length > 1) li(id.endsWith("_top") ? "Øverste blokk" : "Nederste blokk", "part");
      for (const bone of g.bones) li(bone.name, visible(b.vis[bone.name] ?? true, state) ? "on" : "off");
      src.push(b.geometry);
    }
  }
  $("r-src").textContent = src.join(" · ");
}
