/* ============================ Character › Builds ============================
   Saved builds: switch, create, duplicate, rename, notes, delete, and
   single-build export/import. Full backups live in the System tab.
   =========================================================================== */
import { S, build, save, newBuild, clone, uid, importBuild } from "../store.js";
import { calc, countEquipped } from "../rules.js";
import { $, esc, toast, download, readFile, safeName } from "../ui.js";
import { renderAll, renderHeader, restoreFromFile } from "../app.js";

export function renderBuilds() {
  const b = build();
  const list = S.builds.map(x => {
    const r = calc(x);
    const bad = r.invalid || r.overBy > 0;
    return `<button class="bl ${x.id === b.id ? "on" : ""}" data-open="${x.id}" aria-current="${x.id === b.id}"><span class="nm">${esc(x.name)}<small>Level ${x.level} · ${countEquipped(x)} implants · updated ${new Date(x.updated).toLocaleDateString()}</small></span>${x.id === b.id ? '<span class="st">Active</span>' : ""}<span class="cap num" style="color:${bad ? "var(--red)" : "var(--yellow)"}">${r.used}/${r.normal}${bad ? " ⚠" : ""}</span></button>`;
  }).join("");
  $("#v-builds").innerHTML = `
  <div class="panel"><div class="ph"><h2>Builds</h2><span class="meta">${S.builds.length} saved</span></div><div class="pb">
    ${list}
    <div class="btnrow"><button class="btn pri" id="bNew">New build</button><button class="btn" id="bDup">Duplicate current</button></div>
  </div></div>
  <div class="panel"><div class="ph"><h2>${esc(b.name)}</h2><span class="meta">active build</span></div><div class="pb">
    <div class="field"><label class="k" for="bName">Name</label><div class="v" style="flex:1"><input type="text" id="bName" value="${esc(b.name)}" data-f="name"></div></div>
    <div style="padding:8px 0"><label class="hint" for="bNotes">Notes</label><textarea class="notes" id="bNotes" data-f="notes" placeholder="Quickhack combos, what to buy first, who sells it…">${esc(b.notes)}</textarea></div>
    <div class="btnrow"><button class="btn" id="bExport">Export this build</button><button class="btn" id="bImport">Import a build</button><button class="btn warn" id="bDel" ${S.builds.length <= 1 ? "disabled" : ""}>Delete</button></div>
    <input type="file" id="bFile" accept="application/json,.json" hidden>
    ${S.builds.length <= 1 ? `<p class="hint" style="margin-top:8px">You need at least one build, so the last one can't be deleted.</p>` : ""}
  </div></div>`;
}

export function click(t, b) {
  if (t.dataset.open) { S.active = t.dataset.open; save(); renderAll(); return true; }
  switch (t.id) {
    case "bNew": { const nb = newBuild("Build " + (S.builds.length + 1)); S.builds.push(nb); S.active = nb.id; save(); renderAll(); toast("New build"); return true; }
    case "bDup": { const nb = clone(b); nb.id = uid(); nb.name = b.name + " copy"; nb.created = nb.updated = Date.now(); S.builds.push(nb); S.active = nb.id; save(); renderAll(); toast("Duplicated"); return true; }
    case "bDel": {
      if (S.builds.length <= 1) return true;
      if (!confirm(`Delete "${b.name}"? This can't be undone.`)) return true;
      S.builds = S.builds.filter(x => x.id !== b.id); S.active = S.builds[0].id; save(); renderAll(); toast("Deleted"); return true;
    }
    case "bExport": download(safeName(b.name) + ".chromedeck.json", { chromedeck: 2, build: b }); return true;
    case "bImport": $("#bFile").click(); return true;
  }
  return false;
}
export function input(t, b) {
  if (t.dataset.f === "name") { b.name = t.value; b.updated = Date.now(); renderHeader(); return true; }
  if (t.dataset.f === "notes") { b.notes = t.value; b.updated = Date.now(); return true; }
  return false;
}
export function change(t) {
  if (t.dataset.f === "name" || t.dataset.f === "notes") { save(); renderBuilds(); return true; }
  if (t.id === "bFile") {
    readFile(t, obj => {
      if (obj && obj.chromedeck && obj.build) { if (importBuild(obj.build)) { save(); renderAll(); toast("Build imported"); } else toast("That build file looks damaged"); }
      else if (obj && obj.chromedeck && obj.state) restoreFromFile(obj);
      else toast("Not a Chromedeck file");
    });
    return true;
  }
  return false;
}
