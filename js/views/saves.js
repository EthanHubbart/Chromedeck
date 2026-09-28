/* ============================ Saves ============================
   Up to 5 playthroughs, each with its own progress and its own V (lifepath,
   body type, voice). Builds are shared by every save. Everything happens in
   the shared bottom sheet, opened from System, the Journal or the Overview.
   =============================================================== */
import { S, save, activeSave, newSave, switchSave, deleteSave, renameSave, MAX_SAVES } from "../store.js";
import { $, esc, toast, openSheet, closeSheet } from "../ui.js";
import { renderAll } from "../app.js";

export const V_OPTS = {
  lifepath: { label: "Lifepath", opts: [["corpo", "Corpo"], ["nomad", "Nomad"], ["streetkid", "Streetkid"]] },
  body: { label: "Body type", opts: [["f", "Feminine"], ["m", "Masculine"]] },
  voice: { label: "Voice", opts: [["f", "Feminine"], ["m", "Masculine"]] }
};
const optLabel = (k, v) => (V_OPTS[k].opts.find(o => o[0] === v) || [])[1];
/* "Streetkid · Feminine body · Masculine voice" — only what's set. */
export function vSummary(P) {
  return [optLabel("lifepath", P.choices.lifepath), P.v.body && optLabel("body", P.v.body) + " body", P.v.voice && optLabel("voice", P.v.voice) + " voice"].filter(Boolean).join(" · ");
}
const runOf = id => id === S.activeSave ? S.playthrough : S.stash[id];
const date = t => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

let form = null;   // {mode: "new"|"edit", name, lifepath, body, voice} while a form is open

function segs(f) {
  return Object.entries(V_OPTS).map(([k, c]) => `<div class="field stack"><div class="k">${c.label}</div><div class="v"><div class="seg" style="grid-template-columns:repeat(${c.opts.length},1fr)" role="group" aria-label="${c.label}">${c.opts.map(([v, l]) =>
    `<button data-svopt="${k}:${v}" class="${f[k] === v ? "on" : ""}" aria-pressed="${f[k] === v}">${l}</button>`).join("")}</div></div></div>`).join("");
}
function listHtml() {
  const full = S.saves.length >= MAX_SAVES;
  return `<div class="detail">
    <p class="hint" style="margin:0 0 8px">Each save keeps its own progress and V. Your builds are shared by all saves.</p>
    ${S.saves.map(sv => {
      const P = runOf(sv.id); const on = sv.id === S.activeSave; const n = Object.keys(P.missions).length;
      return `<div class="saverow ${on ? "on" : ""}">
        <div class="sv-main"><b>${esc(sv.name)}${on ? ` <span class="tag ok">Playing</span>` : ""}</b>
          <small>${esc(vSummary(P) || "V not set")} · ${n} mission${n === 1 ? "" : "s"} done · started ${date(sv.created)}</small></div>
        <div class="btnrow">${on ? `<button class="btn" data-svedit="${sv.id}">Edit</button>` : `<button class="btn pri" data-svswitch="${sv.id}">Load</button><button class="btn" data-svedit="${sv.id}">Rename</button>`}${S.saves.length > 1 ? `<button class="btn warn" data-svdel="${sv.id}">Delete</button>` : ""}</div>
      </div>`;
    }).join("")}
    <div class="btnrow" style="margin-top:12px"><button class="btn pri" id="svNew" ${full ? "disabled" : ""}>New save</button></div>
    ${full ? `<p class="hint" style="margin:6px 0 0">That's the limit of ${MAX_SAVES}. Delete one to start another.</p>` : ""}
  </div>`;
}
function formHtml() {
  const f = form; const isNew = f.mode === "new"; const own = !isNew && f.id === S.activeSave;
  return `<div class="detail">
    <div class="field stack"><div class="k">Name</div><div class="v"><input id="svName" type="text" maxlength="40" value="${esc(f.name)}" placeholder="${isNew ? `Save ${S.saves.length + 1}` : ""}" autocomplete="off" aria-label="Save name"></div></div>
    ${isNew || own ? segs(f) + `<p class="hint" style="margin:4px 0 0">Body type and voice decide who V can romance: Judy needs both feminine, River a feminine body, Panam a masculine body, Kerry both masculine (Cyberpunk Wiki, Romance). Body type also picks which clothing pictures you see.</p>` : ""}
    ${isNew ? `<div class="okbox">Starts a fresh playthrough: no missions, collectibles, owned items or outfits. Only your builds carry over, and your current save stays in the list.</div>` : ""}
    <div class="btnrow"><button class="btn pri" id="svOk">${isNew ? "Start new save" : "Save changes"}</button><button class="btn" id="svBack">Back</button></div>
  </div>`;
}
/* One-line strip naming the current save, with a button to the Saves sheet. */
export function saveStrip() {
  const sv = activeSave(); const who = vSummary(S.playthrough);
  return `<div class="savestrip"><span><b>${esc(sv.name)}</b><small>${esc(who || "V not set — tap Saves to set lifepath, body and voice")}</small></span><button class="btn" id="openSaves">Saves</button></div>`;
}
export function openSaves() { form = null; openSheet("Saves", listHtml()); }
function openForm(f) { form = f; openSheet(f.mode === "new" ? "New save" : own(f) ? "Edit save" : "Rename save", formHtml()); }
const own = f => f.id === S.activeSave;
const done = msg => { save(); renderAll(); openSaves(); toast(msg); };

export function click(t) {
  const ds = t.dataset;
  if (t.id === "openSaves") { openSaves(); return true; }
  if (t.id === "svNew") { openForm({ mode: "new", name: "", lifepath: null, body: null, voice: null }); return true; }
  if (ds.svedit) {
    const sv = S.saves.find(x => x.id === ds.svedit); const P = runOf(sv.id);
    openForm({ mode: "edit", id: sv.id, name: sv.name, lifepath: P.choices.lifepath, body: P.v.body, voice: P.v.voice }); return true;
  }
  if (ds.svopt && form) { const [k, v] = ds.svopt.split(":"); form[k] = form[k] === v ? null : v; openForm(form); return true; }
  if (t.id === "svBack") { openSaves(); return true; }
  if (t.id === "svOk" && form) {
    const name = $("#svName").value;
    if (form.mode === "new") { const sv = newSave(name, form); if (sv) { form = null; done(`Started "${sv.name}"`); } else toast(`Up to ${MAX_SAVES} saves`); return true; }
    if (name.trim()) renameSave(form.id, name);
    if (own(form)) { const P = S.playthrough; P.choices.lifepath = form.lifepath; P.v.body = form.body; P.v.voice = form.voice; }
    form = null; done("Save updated"); return true;
  }
  if (ds.svswitch) { switchSave(ds.svswitch); save(); renderAll(); closeSheet(); toast(`Loaded "${activeSave().name}"`); return true; }
  if (ds.svdel) {
    const sv = S.saves.find(x => x.id === ds.svdel);
    if (!confirm(`Delete "${sv.name}" and all its progress? This can't be undone (a backup from System would keep it).`)) return true;
    deleteSave(sv.id); done(`Deleted "${sv.name}"`); return true;
  }
  return false;
}
export function input(t) { if (t.id === "svName" && form) { form.name = t.value; return true; } return false; }
