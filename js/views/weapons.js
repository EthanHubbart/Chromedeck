/* ============================ Gear › Weapons ============================
   Every weapon from the wiki, iconics trackable (owned), with where to get
   each one, links to the missions that give it, and base stats.
   ======================================================================== */
import { S, DATA, save } from "../store.js";
import { mission, isDone } from "../journal.js";
import { $, esc, toast, openSheet, sheetOpen } from "../ui.js";

const TECH = { Power: "Power", Tech: "Tech", Smart: "Smart", Blade: "Blade", Blunt: "Blunt", Thrown: "Thrown" };
const STATS = [["dmg", "Damage / hit"], ["aps", "Attacks / s"], ["rel", "Reload (s)"], ["rng", "Range"], ["hnd", "Handling"], ["mag", "Magazine"], ["hs", "Headshot ×%"], ["ap", "Armor pen. %"], ["wt", "Weight"], ["rad", "Radius (m)"]];
const owned = id => !!S.playthrough.weapons[id];
export const weaponsFrom = missionId => (DATA.weapons || []).filter(w => (w.from || []).includes(missionId));
const lostForGood = w => w.miss && !w.lowe;

function tags(w) {
  const t = [];
  if (w.iconic && !owned(w.id)) {
    if (lostForGood(w)) t.push(`<span class="tag bad">⚠ Missable</span>`);
    else if (w.miss) t.push(`<span class="tag warn">⚠ Missable*</span>`);
  }
  if (w.dep && !owned(w.id)) t.push(`<span class="tag dim">Choice-based</span>`);
  return t.join("");
}
function row(w) {
  const o = owned(w.id);
  const sub = [w.type, w.tech && TECH[w.tech], w.mfr].filter(Boolean).map(esc).join(" · ");
  const chk = w.iconic
    ? `<button class="mchk" data-wown="${w.id}" aria-pressed="${o}" aria-label="${o ? "Mark not owned" : "Mark owned"}: ${esc(w.name)}"><i></i></button>`
    : `<span class="mchk nochk" aria-hidden="true"></span>`;
  return `<div class="mrow ${o ? "done" : ""}">${chk}
    <button class="mmain" data-weapon="${w.id}"><span class="nm">${w.iconic ? `<span class="ic-d" aria-label="Iconic">◆</span> ` : ""}${esc(w.name)}<small>${sub}</small></span><span class="tags">${tags(w)}</span></button></div>`;
}

export function renderWeapons() {
  const U = S.ui.weapons; const all = DATA.weapons || [];
  const ic = all.filter(w => w.iconic);
  const got = ic.filter(w => owned(w.id)).length;
  const missLeft = ic.filter(w => lostForGood(w) && !owned(w.id)).length;
  const loweLeft = ic.filter(w => w.miss && w.lowe && !owned(w.id)).length;
  const types = [...new Set(all.map(w => w.type))];
  const pct = ic.length ? Math.round(got / ic.length * 100) : 0;
  $("#v-weapons").innerHTML = `
  <div class="panel"><div class="ph"><h2>Iconic weapons</h2><span class="meta">${all.length} weapons in total</span></div><div class="pb">
    <div class="prog one"><div><small>Collected</small><b class="num">${got}<span>/${ic.length}</span></b><i><em style="width:${pct}%"></em></i></div></div>
    ${missLeft || loweLeft ? `<p class="hint" style="margin:4px 0 0">${missLeft ? `<b style="color:var(--red)">${missLeft} can be lost for good</b> if you miss them in their mission.` : ""} ${loweLeft ? `${loweLeft} more are missable, but Herold Lowe in Dogtown (Phantom Liberty) sells them if you miss them (marked *).` : ""}</p>` : ""}
  </div></div>
  <div class="panel"><div class="ph"><h2>Arsenal</h2><span class="meta">tick the iconics you own</span></div><div class="pb">
    <div class="search"><input id="wq" type="search" placeholder="Search name, effect, where to get…" value="${esc(U.q || "")}" aria-label="Search weapons" autocomplete="off"></div>
    <div class="seg jmode" role="group" aria-label="Show">${[["iconic", "Iconic"], ["all", "All weapons"]].map(([k, l]) => `<button data-wshow="${k}" class="${U.show === k ? "on" : ""}" aria-pressed="${U.show === k}">${l}</button>`).join("")}</div>
    <div class="field" style="padding-top:0"><label class="k" for="wType">Type</label><div class="v"><select id="wType" class="sel">${[["all", "All types"], ...types.map(t => [t, t])].map(([v, l]) => `<option value="${esc(v)}" ${U.type === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div></div>
    <div class="field" style="padding-top:0"><div class="k">Hide iconics I own</div><div class="v"><button class="tog ${U.hideOwned ? "on" : ""}" id="wHide" aria-pressed="${!!U.hideOwned}" aria-label="Hide iconics I own"></button></div></div>
    <div id="wList"></div>
  </div></div>
  <p class="hint">Stats are the wiki's base values; in game they scale with the weapon's tier. Pictures: Cyberpunk Wiki / CD PROJEKT RED.</p>`;
  renderList();
}
function renderList() {
  const el = $("#wList"); if (!el) return;
  const U = S.ui.weapons; const q = (U.q || "").trim().toLowerCase();
  const list = (DATA.weapons || []).filter(w =>
    (U.show === "all" || w.iconic) && (U.type === "all" || w.type === U.type) && !(U.hideOwned && w.iconic && owned(w.id)) &&
    (!q || [w.name, w.type, w.mfr, w.effect, w.get].some(x => (x || "").toLowerCase().includes(q))));
  let html = "", cur = null;
  for (const w of list) {
    if (w.type !== cur) { cur = w.type; const n = list.filter(x => x.type === cur); const o = n.filter(x => x.iconic && owned(x.id)).length, ni = n.filter(x => x.iconic).length; html += `<div class="msec"><b>${esc(cur)}</b><small>${n.length} shown${ni ? ` · ${o}/${ni} iconics owned` : ""}</small></div>`; }
    html += row(w);
  }
  el.innerHTML = html || `<p class="hint">Nothing matches.</p>`;
}

function openWeapon(id) {
  const w = (DATA.weapons || []).find(x => x.id === id); if (!w) return;
  const o = owned(w.id);
  const ms = (w.from || []).map(mission).filter(Boolean);
  const stats = STATS.filter(([k]) => w.stats && w.stats[k] !== undefined).map(([k, l]) => `<div><small>${l}</small><b class="num">${w.stats[k]}</b></div>`).join("");
  openSheet((w.iconic ? "Iconic · " : "") + w.type, `
    <div class="detail">
      ${w.img ? `<figure class="wimg"><img src="${esc(w.img)}" alt="${esc(w.name)}" loading="lazy" onerror="this.parentNode.classList.add('noimg')"><figcaption>Image: Cyberpunk Wiki / CD PROJEKT RED</figcaption></figure>` : ""}
      <div class="name">${w.iconic ? `<span class="ic-d">◆</span> ` : ""}${esc(w.name)}</div>
      <div class="line">${[w.type, w.tech && `${TECH[w.tech]}`, w.mfr].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("<span>·</span>")}</div>
      ${w.iconic ? (o ? `<div class="okbox">Owned ✓</div>` : lostForGood(w) ? `<div class="warnbox"><b>⚠ Missable.</b> If you don't pick it up where it's offered, it's gone for this run.</div>` : w.miss ? `<div class="warnbox" style="border-color:var(--yellow);color:var(--yellow);background:rgba(245,230,13,.05)"><b>⚠ Missable in its mission</b>, but Herold Lowe in Dogtown (Phantom Liberty) sells it if you miss it.</div>` : "") : ""}
      ${w.dep ? `<p class="hint" style="margin:0 0 6px">Depends on choices you make.</p>` : ""}
      ${w.effect ? `<div class="k-h">${w.iconic ? "Iconic effect" : "Effect"}</div><div class="eff">${esc(w.effect)}</div>` : ""}
      ${w.intrinsic ? `<div class="k-h">Built in</div><p style="margin:0 0 8px;white-space:pre-wrap">${esc(w.intrinsic)}</p>` : ""}
      ${w.get ? `<div class="k-h">Where to get it</div><p style="margin:0 0 8px;white-space:pre-wrap">${esc(w.get.replace(/ · /g, "\n• ").replace(/^/, "• "))}</p>` : ""}
      ${ms.length ? `<div class="k-h">From</div><p style="margin:0 0 8px">${ms.map(m => `<button class="lnk" data-mission="${m.id}">${esc(m.name)}</button>${isDone(m.id) ? " ✓" : ""}`).join(", ")}</p>` : ""}
      ${stats ? `<div class="k-h">Base stats</div><div class="wstats">${stats}</div>` : ""}
      ${w.iconic ? `<div class="btnrow"><button class="btn ${o ? "" : "pri"}" data-wown="${w.id}">${o ? "Mark not owned" : "I own this"}</button></div>` : ""}
      <p class="hint" style="margin-top:10px"><a href="${esc(w.src)}" target="_blank" rel="noopener">Wiki page ↗</a> · Game id <kbd>${esc(w.id)}</kbd></p>
    </div>`);
}

function refresh(id) { save(); renderWeapons(); if (id && sheetOpen()) openWeapon(id); }

export function click(t) {
  const ds = t.dataset;
  if (ds.weapon) { openWeapon(ds.weapon); return true; }
  if (ds.wown) {
    const P = S.playthrough.weapons; const w = DATA.weapons.find(x => x.id === ds.wown);
    if (P[ds.wown]) delete P[ds.wown]; else P[ds.wown] = Date.now();
    refresh(sheetOpen() ? ds.wown : null); toast(P[ds.wown] ? "Owned: " + w.name : "Marked not owned"); return true;
  }
  if (ds.wshow) { S.ui.weapons.show = ds.wshow; refresh(); return true; }
  if (t.id === "wHide") { S.ui.weapons.hideOwned = !S.ui.weapons.hideOwned; refresh(); return true; }
  return false;
}
export function input(t) {
  if (t.id === "wq") { S.ui.weapons.q = t.value; renderList(); return true; }
  return false;
}
export function change(t) {
  if (t.id === "wType") { S.ui.weapons.type = t.value; save(); renderList(); return true; }
  if (t.id === "wq") { save(); return true; }
  return false;
}
