/* ============================ Collection › Vehicles ============================
   Every ownable car and motorcycle, owned tracking, how to get each one
   (mission links, Autofixer price and requirements). The other Collection
   screens live in overview.js and collectibles.js.
   ============================================================================== */
import { S, DATA, save } from "../store.js";
import { mission, isDone } from "../journal.js";
import { $, esc, toast, openSheet, sheetOpen } from "../ui.js";

const owned = id => !!S.playthrough.vehicles[id];
const applies = v => !v.branch || !S.playthrough.choices[v.branch[0]] || S.playthrough.choices[v.branch[0]] === v.branch[1];
export const vehiclesFrom = missionId => (DATA.vehicles || []).filter(v => (v.from || []).includes(missionId) && applies(v));
const eb = n => "€$" + n.toLocaleString("en-US");

function how(v) {
  if (v.from && v.from.length) return v.from.map(mission).filter(Boolean).map(m => m.name).join(" / ");
  if (v.price) return `Autofixer · ${eb(v.price)}`;
  return v.get || "";
}
function tags(v) {
  const t = [];
  if (!owned(v.id)) {
    if (v.dep) t.push(`<span class="tag warn">⚠ Choice-based</span>`);
    if (v.cred) t.push(`<span class="tag dim">Cred ${v.cred}</span>`);
    if (v.jas) t.push(`<span class="tag dim">JAS ×${v.jas}</span>`);
  }
  return t.join("");
}
function row(v) {
  const o = owned(v.id);
  const sub = [v.kind === "bike" ? "Motorcycle" : "Car", v.cls, how(v), v.pl && "PL"].filter(Boolean).map(esc).join(" · ");
  return `<div class="mrow ${o ? "done" : ""}">
    <button class="mchk" data-vown="${v.id}" aria-pressed="${o}" aria-label="${o ? "Mark not owned" : "Mark owned"}: ${esc(v.name)}"><i></i></button>
    <button class="mmain" data-vehicle="${v.id}"><span class="nm">${esc(v.name)}<small>${sub}</small></span><span class="tags">${tags(v)}</span></button></div>`;
}

export function vehicleTally() { const all = (DATA.vehicles || []).filter(applies); return { done: all.filter(v => owned(v.id)).length, total: all.length }; }

export function renderVehicles() {
  const U = S.ui.vehicles; const all = (DATA.vehicles || []).filter(applies);
  const got = all.filter(v => owned(v.id)).length; const pct = all.length ? Math.round(got / all.length * 100) : 0;
  const choice = all.filter(v => v.dep && !owned(v.id)).length;
  $("#v-vehicles").innerHTML = `
  <div class="panel"><div class="ph"><h2>Vehicles</h2><span class="meta">${all.filter(v => v.kind === "car").length} cars · ${all.filter(v => v.kind === "bike").length} motorcycles</span></div><div class="pb">
    <div class="prog one"><div><small>Owned</small><b class="num">${got}<span>/${all.length}</span></b><i><em style="width:${pct}%"></em></i></div></div>
    ${choice ? `<p class="hint" style="margin:4px 0 0">⚠ ${choice} depend on a choice in their mission — check the details before you play it.</p>` : ""}
  </div></div>
  <div class="panel"><div class="ph"><h2>Garage</h2><span class="meta">tick what you own</span></div><div class="pb">
    <div class="search"><input id="vq" type="search" placeholder="Search name, maker, mission…" value="${esc(U.q || "")}" aria-label="Search vehicles" autocomplete="off"></div>
    <div class="seg jmode" style="grid-template-columns:repeat(3,1fr)" role="group" aria-label="Kind">${[["all", "All"], ["car", "Cars"], ["bike", "Motorcycles"]].map(([k, l]) => `<button data-vkind="${k}" class="${U.kind === k ? "on" : ""}" aria-pressed="${U.kind === k}">${l}</button>`).join("")}</div>
    <div class="chips" role="group" aria-label="How you get it">${[["all", "Any source"], ["reward", "Mission rewards"], ["buy", "Autofixer"]].map(([k, l]) => `<button class="chip ${U.src === k ? "on" : ""}" data-vsrc="${k}" aria-pressed="${U.src === k}">${l}</button>`).join("")}</div>
    <div class="field" style="padding-top:0"><div class="k">Hide what I own</div><div class="v"><button class="tog ${U.hideOwned ? "on" : ""}" id="vHide" aria-pressed="${!!U.hideOwned}" aria-label="Hide owned vehicles"></button></div></div>
    <div id="vList"></div>
  </div></div>
  <p class="hint">Autofixer is Muamar Reyes's car-dealing netpage; more cars appear on it as your Street Cred rises. Pictures: Cyberpunk Wiki / CD PROJEKT RED.</p>`;
  renderList();
}
function renderList() {
  const el = $("#vList"); if (!el) return;
  const U = S.ui.vehicles; const q = (U.q || "").trim().toLowerCase();
  const list = (DATA.vehicles || []).filter(v => applies(v) && (U.kind === "all" || v.kind === U.kind) &&
    (U.src === "all" || (U.src === "reward" ? (v.from || []).length > 0 || !v.price : !!v.price)) && !(U.hideOwned && owned(v.id)) &&
    (!q || [v.name, v.mfr, v.cls, v.get, how(v)].some(x => (x || "").toLowerCase().includes(q))));
  let html = "", cur = null;
  for (const v of list) {
    const g = (v.kind === "bike" ? "Motorcycles" : "Cars") + ((v.from || []).length || !v.price ? " · mission rewards" : " · Autofixer");
    if (g !== cur) { cur = g; html += `<div class="msec"><b>${esc(g)}</b></div>`; }
    html += row(v);
  }
  el.innerHTML = html || `<p class="hint">Nothing matches.</p>`;
}

function openVehicle(id) {
  const v = (DATA.vehicles || []).find(x => x.id === id); if (!v) return;
  const o = owned(v.id); const ms = (v.from || []).map(mission).filter(Boolean);
  const st = v.stats || {};
  const stats = [["hp", "Horsepower"], ["top", "Top speed (mph)"], ["seats", "Seats"], ["drive", "Drive"]].filter(([k]) => st[k] !== undefined).map(([k, l]) => `<div><small>${l}</small><b class="num">${esc(String(st[k]))}</b></div>`).join("");
  const reqs = [v.price && `${eb(v.price)} on Autofixer`, v.cred && `Street Cred ${v.cred}`, v.jas && `Just Another Story completed ${v.jas} time${v.jas > 1 ? "s" : ""}`, v.pl && "Phantom Liberty"].filter(Boolean);
  openSheet(v.kind === "bike" ? "Motorcycle" : "Car", `
    <div class="detail">
      ${v.img ? `<figure class="wimg"><img src="${esc(v.img)}" alt="${esc(v.name)}" loading="lazy" onerror="this.parentNode.classList.add('noimg')"><figcaption>Image: Cyberpunk Wiki / CD PROJEKT RED</figcaption></figure>` : ""}
      <div class="name">${esc(v.name)}</div>
      <div class="line">${[v.mfr, v.cls].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("<span>·</span>")}</div>
      ${o ? `<div class="okbox">Owned ✓</div>` : v.dep ? `<div class="warnbox" style="border-color:var(--yellow);color:var(--yellow);background:rgba(245,230,13,.05)"><b>⚠ Depends on a choice.</b> ${esc(v.note || "")}</div>` : ""}
      ${ms.length ? `<div class="k-h">Reward from</div><p style="margin:0 0 8px">${ms.map(m => `<button class="lnk" data-mission="${m.id}">${esc(m.name)}</button>${isDone(m.id) ? " ✓" : ""}`).join(", ")}</p>` : !v.price ? `<div class="k-h">Where to get it</div><p style="margin:0 0 8px">${esc(v.get)}</p>` : ""}
      ${reqs.length ? `<div class="k-h">${v.price ? "To buy" : "Needs"}</div><p style="margin:0 0 8px">${esc(reqs.join(" · "))}</p>` : ""}
      ${v.note && !v.dep ? `<p class="hint" style="margin:0 0 8px">${esc(v.note)}</p>` : ""}
      ${stats ? `<div class="k-h">Specs</div><div class="wstats">${stats}</div>` : ""}
      <div class="btnrow"><button class="btn ${o ? "" : "pri"}" data-vown="${v.id}">${o ? "Mark not owned" : "I own this"}</button></div>
      <p class="hint" style="margin-top:10px"><a href="${esc(v.src)}" target="_blank" rel="noopener">Wiki page ↗</a></p>
    </div>`);
}

function refresh(id) { save(); renderVehicles(); if (id && sheetOpen()) openVehicle(id); }

export function click(t) {
  const ds = t.dataset;
  if (ds.vehicle) { openVehicle(ds.vehicle); return true; }
  if (ds.vown) {
    const P = S.playthrough.vehicles; const v = DATA.vehicles.find(x => x.id === ds.vown);
    if (P[ds.vown]) delete P[ds.vown]; else P[ds.vown] = Date.now();
    refresh(sheetOpen() ? ds.vown : null); toast(P[ds.vown] ? "Owned: " + v.name : "Marked not owned"); return true;
  }
  if (ds.vkind) { S.ui.vehicles.kind = ds.vkind; refresh(); return true; }
  if (ds.vsrc) { S.ui.vehicles.src = ds.vsrc; refresh(); return true; }
  if (t.id === "vHide") { S.ui.vehicles.hideOwned = !S.ui.vehicles.hideOwned; refresh(); return true; }
  return false;
}
export function input(t) {
  if (t.id === "vq") { S.ui.vehicles.q = t.value; renderList(); return true; }
  return false;
}
export function change(t) {
  if (t.id === "vq") { save(); return true; }
  return false;
}
