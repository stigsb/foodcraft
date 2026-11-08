
// ---------- Saving: one document per PNG in the artifact's shared database ----------
const COLL = "textures";
const SAVED = {};          // path -> stored document
const NAMES = {};          // user id -> display name
let db = null, user = null, dbState = "connecting";
const docId = (p) => p.replace(/\//g, "~");
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };
function note(text, isErr) { const n = $("db-note"); n.textContent = text; n.classList.toggle("err", !!isErr); }

async function nameOf(id) {
  if (!id) return "noen";
  if (NAMES[id]) return NAMES[id];
  if (!user) return "noen";
  try { const ps = await user.profiles([id]); NAMES[id] = ps[id]?.name || "noen"; } catch { NAMES[id] = "noen"; }
  return NAMES[id];
}

let revertArmed = 0;
function renderStatus() {
  const t = cur(), st = $("status"), sv = $("save"), rv = $("revert");
  $("undo").disabled = !t?.undo.length; $("redo").disabled = !t?.redo.length;
  if (!t || !t.orig) { st.textContent = ""; sv.disabled = rv.disabled = true; return; }
  const pill = document.createElement("span"), txt = document.createElement("span");
  if (t.saving) { pill.className = "pill dirty"; pill.textContent = "Lagrer …"; }
  else if (t.dirty) { pill.className = "pill dirty"; pill.textContent = "Ikke lagret"; txt.textContent = t.saved ? "Endret siden sist lagring." : "Endret fra originalen."; }
  else if (t.saved) {
    pill.className = "pill saved"; pill.textContent = "Lagret";
    const who = t.saved.savedBy;
    txt.textContent = `${fmtTime(t.saved.savedAt)}`;
    nameOf(who).then((n) => { if (cur() === t && t.saved?.savedBy === who && !t.dirty) txt.textContent = `${fmtTime(t.saved.savedAt)} av ${n}`; });
  } else { pill.className = "pill orig"; pill.textContent = "Original"; txt.textContent = "Slik den er i ressurspakken."; }
  st.replaceChildren(pill, txt);
  sv.disabled = !t.dirty || t.saving || !db;
  sv.textContent = t.saving ? "Lagrer …" : "Lagre";
  const isOrig = same(t.ctx.getImageData(0, 0, t.w, t.h), t.orig);
  rv.disabled = isOrig || t.saving;
  if (!revertArmed) { rv.textContent = "Tilbake til original"; rv.classList.remove("confirm"); }
}

async function applySaved(path, data) {
  const t = tex(path);
  await t.ready;
  if (data && t.lastWritten === data.png) { t.saved = data; t.thumb = data.png; renderStatus(); renderTexList(); renderModels(); return; }
  if (t.dirty || (ed.stroke && ed.path === path)) { t.saved = data; renderStatus(); return; }
  if (data) {
    let img;
    try { img = await loadImage(data.png); } catch { return; }
    if (img.width !== t.w || img.height !== t.h) return;
    t.ctx.clearRect(0, 0, t.w, t.h); t.ctx.drawImage(img, 0, 0);
    t.saved = data; t.thumb = data.png;
  } else {
    t.ctx.putImageData(t.orig, 0, 0);
    t.saved = null; t.thumb = DATA.textures[path].src;
  }
  t.base = t.ctx.getImageData(0, 0, t.w, t.h);
  t.dirty = false;
  changed(t);
  if (ed.path === path) renderPalette();
  renderStatus(); renderTexList(); renderModels();
}

async function save() {
  const t = cur();
  if (!t || !t.dirty || t.saving || !db) return;
  t.saving = true; renderStatus();
  const ref = db.collection(COLL).doc(docId(t.path));
  const snapshot = t.ctx.getImageData(0, 0, t.w, t.h);
  try {
    if (same(snapshot, t.orig)) {
      await ref.delete();
      t.saved = null; t.thumb = DATA.textures[t.path].src; t.lastWritten = null;
      note("Teksturen er tilbake til originalen. Den lagrede versjonen er slettet.");
    } else {
      const png = t.canvas.toDataURL("image/png");
      const data = { path: t.path, width: t.w, height: t.h, png, savedBy: user ? await user.id() : null, savedAt: new Date().toISOString() };
      t.lastWritten = png;
      await ref.set(data);
      t.saved = data; t.thumb = png;
      note("Lagret. Alle som åpner modellbenken ser den nye teksturen.");
    }
    t.base = snapshot;
    t.dirty = !same(t.ctx.getImageData(0, 0, t.w, t.h), t.base);
  } catch (e) {
    const why = e?.code === "not_granted" ? "Du har ikke lov til å lagre her. Be eieren om tilgang til å redigere." : e?.code === "unavailable" ? "Fikk ikke kontakt med lagringen. Prøv igjen om litt." : (e?.message || "Ukjent feil.");
    note("Lagring feilet. " + why, true);
  }
  t.saving = false;
  renderStatus(); renderTexList(); renderModels();
}
$("save").addEventListener("click", save);

$("revert").addEventListener("click", () => {
  const t = cur(); if (!t || !t.orig) return;
  const rv = $("revert");
  if (!revertArmed) {
    rv.textContent = "Trykk igjen for å bekrefte"; rv.classList.add("confirm");
    revertArmed = setTimeout(() => { revertArmed = 0; renderStatus(); }, 4000);
    return;
  }
  clearTimeout(revertArmed); revertArmed = 0;
  pushUndo(t); t.ctx.putImageData(t.orig, 0, 0); changed(t); afterEdit(t);
  note(t.dirty ? "Originalen er hentet fram. Trykk Lagre for å slette den lagrede versjonen." : "Teksturen er allerede original.");
});

async function connect() {
  const timer = setTimeout(() => { if (dbState === "connecting") { dbState = "timeout"; note("Lagringen svarer ikke. Du kan male, men ikke lagre akkurat nå.", true); renderStatus(); } }, 10000);
  try { db = window.claude?.use ? await window.claude.use("db") : null; } catch { db = null; }
  if (!db) {
    clearTimeout(timer); dbState = "off";
    note("Lagring er ikke tilgjengelig i denne visningen. Åpne siden på claude.ai og logg inn for å lagre. Du kan fortsatt male og se endringene.");
    renderStatus(); return;
  }
  try { user = await window.claude.use("user"); } catch { user = null; }
  db.collection(COLL).onSnapshot((snap) => {
    clearTimeout(timer);
    if (dbState !== "live") { dbState = "live"; note(snap.size ? `${snap.size} ${snap.size === 1 ? "tekstur er" : "teksturer er"} endret og lagret. De vises i stedet for originalene.` : "Ingen lagrede endringer ennå. Mal på en tekstur og trykk Lagre."); }
    for (const ch of snap.docChanges()) {
      const d = ch.doc.data(), path = d?.path || ch.doc.id.replace(/~/g, "/");
      if (!DATA.textures[path]) continue;
      if (ch.type === "removed") { delete SAVED[path]; applySaved(path, null); }
      else if (typeof d.png === "string" && d.png.startsWith("data:image/png")) { SAVED[path] = d; applySaved(path, d); }
    }
    renderStatus();
  }, (err) => {
    clearTimeout(timer); dbState = "error";
    note("Kunne ikke hente lagrede teksturer: " + (err?.message || err?.code || "ukjent feil"), true);
  });
}

// ---------- Start ----------
onTexReady = (t) => { if (t.path === ed.path) { fitZoom(); drawPaper(); renderPalette(); renderStatus(); } };
setTool("pen");
setColor("#c2412f");
renderCats();
new ResizeObserver(resize).observe(viewport);
selectModel(MODELS[0]);
setSpin(false);
connect();
