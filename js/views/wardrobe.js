/* ============================ Gear › Wardrobe ============================
   Two modes. Clothing list: every piece by slot, with colour/finish variants
   of one model grouped under it (ids like Jacket_22_basic_01 / _old_03 share
   model Jacket_22). Outfits: named looks on the V silhouette, one piece per
   slot, shared by every save; owned ticks come from the current save.
   Pictures are the wiki's item renders for V's body type (Saves › V setup).
   ======================================================================== */
import { S, DATA, save, uid } from "../store.js";
import { mission, isDone } from "../journal.js";
import { $, esc, toast, openSheet, closeSheet, sheetOpen } from "../ui.js";

export const SLOTS = [["head", "Head"], ["face", "Face"], ["outer", "Outer torso"], ["inner", "Inner torso"], ["legs", "Legs"], ["feet", "Feet"], ["special", "Full body"]];
const slotName = s => (SLOTS.find(x => x[0] === s) || [, s])[1];
const IMG = "https://static.wikia.nocookie.net/cyberpunk/images/";

/* ---------- data helpers ---------- */
const VARIANT = /^([A-Za-z]+_\d+)_(basic|old|rich)_\d+$/;
export const modelOf = c => { const m = VARIANT.exec(c.id); return m ? m[1] : c.id; };
export const counts = c => !c.temp && !c.limited;          // included in totals and the outfit picker
const owned = id => !!S.playthrough.clothes[id];
const cloth = id => (DATA.clothing || []).find(c => c.id === id);
export const body = () => S.playthrough.v.body || "m";
export const picUrl = (c, b = body()) => `${IMG}${c[b]}/revision/latest/scale-to-width-down/400`;
/* lazy only for the long clothing list; pictures in the sheet and the outfit load right away */
const pic = (c, cls = "", lazy = false) => `<img class="${cls}" src="${esc(picUrl(c))}" alt=""${lazy ? ' loading="lazy"' : ""} referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'nopic ${cls}',textContent:'◇'}))">`;

let MODELS = null, MODELS_FOR = null;   // cached per DATA object
/* Models: [{key, slot, items:[…], label}] in data order. */
export function models() {
  if (MODELS && MODELS_FOR === DATA) return MODELS;
  const map = new Map();
  for (const c of DATA.clothing || []) { const k = modelOf(c); if (!map.has(k)) map.set(k, { key: k, slot: c.slot, items: [] }); map.get(k).items.push(c); }
  MODELS = [...map.values()]; MODELS.forEach(m => { m.label = m.items.length > 1 ? label(m.items) : m.items[0].name; });
  MODELS_FOR = DATA; return MODELS;
}
/* A name for a group of variants: the longest word run (up to 3 words) that most names share,
   e.g. "harem pants", "flat cap"; falls back to the first name. */
function label(items) {
  const names = items.map(c => c.name.toLowerCase().split(/\s+/));
  let best = null, bestScore = 0;
  for (const n of [3, 2, 1]) for (const w of names) for (let i = 0; i + n <= w.length; i++) {
    const g = w.slice(i, i + n).join(" "); if (/^(with|and|of|the|a)$/.test(g) || g.length < 3) continue;
    const hits = names.filter(x => (" " + x.join(" ") + " ").includes(" " + g + " ")).length;
    const score = hits * 10 + n * 3;
    if (hits >= Math.max(2, Math.ceil(items.length * 0.6)) && score > bestScore) { best = g; bestScore = score; }
  }
  return best ? best[0].toUpperCase() + best.slice(1) : items[0].name;
}
export function clothingTally() {
  const list = (DATA.clothing || []).filter(counts);
  return { done: list.filter(c => owned(c.id)).length, total: list.length };
}
export const clothesFrom = missionId => (DATA.clothing || []).filter(c => (c.from || []).includes(missionId));

function tags(c) {
  const t = [];
  if (c.iconic) t.push(`<span class="tag warn">◆ Iconic</span>`);
  if (c.temp) t.push(`<span class="tag dim">Not kept</span>`);
  else if (c.limited) t.push(`<span class="tag dim">${esc(c.limited)}</span>`);
  if (!owned(c.id) && c.miss) t.push(`<span class="tag bad">⚠ Missable</span>`);
  if (!owned(c.id) && c.dep) t.push(`<span class="tag dim">Choice-based</span>`);
  return t.join("");
}
/* "David Walker (EBM Petrochem Stadium, Dogtown) / Clothing Vendor (Kabuki)" */
const withPlace = get => (get || "").split(" / ").map(v => { const at = (DATA.clothingVendors || {})[v.trim()]; return at ? `${v} (${at})` : v; }).join(" / ");
const whereShort = c => c.from && c.from.length ? c.from.map(mission).filter(Boolean).map(m => m.name).join(" / ") : (c.get || "");

/* ---------- clothing list ---------- */
function matches(c, q) { return [c.name, c.get, c.how, c.mfr, c.style].some(x => (x || "").toLowerCase().includes(q)); }
function modelRow(m, q) {
  const vis = q ? m.items.filter(c => matches(c, q)) : m.items;
  if (m.items.length === 1) {
    const c = m.items[0]; const o = owned(c.id); const can = !c.temp;
    return `<div class="mrow ${o ? "done" : ""}">${can ? `<button class="mchk" data-cwown="${c.id}" aria-pressed="${o}" aria-label="${o ? "Mark not owned" : "Mark owned"}: ${esc(c.name)}"><i></i></button>` : `<span class="mchk nochk" aria-hidden="true"></span>`}
      <button class="mmain" data-cwitem="${c.id}">${pic(c, "th", true)}<span class="nm">${esc(c.name)}<small>${esc(whereShort(c))}</small></span><span class="tags">${tags(c)}</span></button></div>`;
  }
  const n = m.items.filter(counts).length, got = m.items.filter(c => counts(c) && owned(c.id)).length;
  return `<div class="mrow ${n && got === n ? "done" : ""}"><span class="mchk vcount" aria-hidden="true">${got ? `<b>${got}</b>/` : ""}${n}</span>
    <button class="mmain" data-cwmodel="${m.key}">${pic(m.items[0], "th", true)}<span class="nm">${esc(m.label)}<small>${[`${m.items.length} variants`, q && vis.length < m.items.length && `${vis.length} match`, m.items[0].style].filter(Boolean).map(esc).join(" · ")}</small></span><span class="tags"><span class="tag ok">${got}/${n} owned</span></span></button></div>`;
}
function listHtml() {
  const U = S.ui.wardrobe; const q = (U.q || "").trim().toLowerCase();
  let html = "", cur = null;
  for (const m of models()) {
    if (U.slot !== "all" && m.slot !== U.slot) continue;
    if (q && !m.items.some(c => matches(c, q)) && !m.label.toLowerCase().includes(q)) continue;
    if (U.hideOwned && m.items.every(c => !counts(c) || owned(c.id))) continue;
    if (m.slot !== cur) { cur = m.slot; html += `<div class="msec"><b>${esc(slotName(cur))}</b></div>`; }
    html += modelRow(m, q);
  }
  return html || `<p class="hint">Nothing matches.</p>`;
}
function renderList() { const el = $("#cwList"); if (el) el.innerHTML = listHtml(); }

/* ---------- sheets: a model's variants, one item ---------- */
function openModel(key) {
  const m = models().find(x => x.key === key); if (!m) return;
  const pick = picking;
  openSheet(pick ? `Pick · ${slotName(m.slot)}` : slotName(m.slot), `
    <div class="detail"><div class="name">${esc(m.label)}</div>
      <p class="hint" style="margin:0 0 8px">${m.items.length} variants of one model, in different colours and finishes. ${pick ? "Tap one to wear it." : "Tick the ones you own; tap a picture for details."}</p>
      <div class="vgrid">${m.items.map(c => { const o = owned(c.id);
        return `<div class="vtile ${o ? "own" : ""}"><button class="vpic" data-cwitem="${c.id}" aria-label="${esc(c.name)}">${pic(c)}</button>
          <small>${esc(c.name)}</small>
          ${pick ? `<button class="btn pri" data-cwwear="${c.id}">Wear</button>` : counts(c) ? `<button class="vown" data-cwown="${c.id}" aria-pressed="${o}">${o ? "✓ Owned" : "Own it?"}</button>` : `<span class="tag dim">${c.temp ? "Not kept" : esc(c.limited)}</span>`}</div>`; }).join("")}</div>
      ${pick ? `<div class="btnrow"><button class="btn" data-cwpick="${pick}">Back to ${esc(slotName(pick))}</button></div>` : ""}
    </div>`);
}
function openItem(id) {
  const c = cloth(id); if (!c) return;
  const o = owned(c.id); const ms = (c.from || []).map(mission).filter(Boolean); const m = models().find(x => x.key === modelOf(c));
  const intr = c.intr && (DATA.clothingIntrinsics || {})[c.intr];
  openSheet(slotName(c.slot), `
    <div class="detail">
      <figure class="wimg cloth">${pic(c)}<figcaption>Image: Cyberpunk Wiki / CD PROJEKT RED</figcaption></figure>
      <div class="name">${esc(c.name)}</div>
      <div class="line">${[slotName(c.slot), c.style, c.mfr, c.pl && "Phantom Liberty"].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("<span>·</span>")}</div>
      ${c.temp ? `<div class="warnbox" style="border-color:var(--muted);color:var(--muted);background:none">Only worn during a mission. The game doesn't let V keep it, so it isn't counted.</div>` : ""}
      ${c.limited ? `<div class="warnbox" style="border-color:var(--muted);color:var(--muted);background:none">${esc(c.limited)}: not part of the normal game, so it isn't counted.</div>` : ""}
      ${o ? `<div class="okbox">Owned ✓</div>` : c.miss ? `<div class="warnbox">⚠ Missable: get it during the mission.</div>` : ""}
      ${intr ? `<div class="k-h">Intrinsic mod</div><p style="margin:0 0 8px">${esc(intr)}</p>` : ""}
      ${ms.length ? `<div class="k-h">From</div><p style="margin:0 0 8px">${ms.map(x => `<button class="lnk" data-mission="${x.id}">${esc(x.name)}</button>${isDone(x.id) ? " ✓" : ""}`).join(", ")}</p>` : ""}
      ${c.get && !ms.length ? `<div class="k-h">Where to get it</div><p style="margin:0 0 8px">${esc(withPlace(c.get))}</p>` : ""}
      ${c.how ? `<p style="margin:0 0 8px">${esc(c.how)}</p>` : ""}
      ${c.check ? `<p class="hint" style="margin:0 0 8px">To check: ${esc(c.check)}</p>` : ""}
      <div class="btnrow">
        ${picking && counts(c) ? `<button class="btn pri" data-cwwear="${c.id}">Wear in outfit</button>` : ""}
        ${counts(c) ? `<button class="btn ${o || picking ? "" : "pri"}" data-cwown="${c.id}">${o ? "Mark not owned" : "I own this"}</button>` : ""}
        ${m && m.items.length > 1 ? `<button class="btn" data-cwmodel="${m.key}">All ${m.items.length} variants</button>` : ""}
      </div>
      <p class="hint" style="margin-top:10px"><a href="${esc(c.src)}" target="_blank" rel="noopener">Wiki page ↗</a></p>
    </div>`);
}

/* ---------- outfits ---------- */
let picking = null;   // slot being filled from the outfit builder, or null
const outfit = () => S.outfits.find(o => o.id === S.ui.wardrobe.outfit) || S.outfits[0];
export function newOutfit(name) { const o = { id: uid(), name: name || `Outfit ${S.outfits.length + 1}`, slots: {} }; S.outfits.push(o); S.ui.wardrobe.outfit = o.id; return o; }

function silhouette(b) {
  const fem = b === "f"; const sh = fem ? 30 : 36, wa = fem ? 21 : 26, hip = fem ? 29 : 27;
  return `<svg viewBox="0 0 120 300" class="sil" role="img" aria-label="${fem ? "Feminine" : "Masculine"} V silhouette"><g fill="rgba(91,231,242,.07)" stroke="var(--cyan-dim)" stroke-width="1.4" stroke-linejoin="round">
    <ellipse cx="60" cy="30" rx="15" ry="19"/><path d="M53 48h14v10H53z"/>
    <path d="M${60 - sh} 62 Q60 54 ${60 + sh} 62 L${60 + wa} 130 L${60 + hip} 160 L${60 - hip} 160 L${60 - wa} 130 Z"/>
    <path d="M${60 - sh} 64 L${48 - sh} 150 L${54 - sh} 176 L${62 - sh} 150 L${68 - sh} 90"/><path d="M${60 + sh} 64 L${72 + sh} 150 L${66 + sh} 176 L${58 + sh} 150 L${52 + sh} 90"/>
    <path d="M${60 - hip} 160 L43 284 L58 284 L60 176 L62 284 L77 284 L${60 + hip} 160 Z"/></g></svg>`;
}
function slotBox(o, s) {
  const c = o.slots[s] && cloth(o.slots[s]);
  return `<button class="wslot ${c && owned(c.id) ? "own" : ""}" data-cwpick="${s}" aria-label="${slotName(s)}: ${c ? esc(c.name) : "empty"}"><small>${slotName(s)}</small>
    <span class="box">${c ? pic(c) : `<span class="empty">＋</span>`}</span><b>${c ? esc(c.name) : "Empty"}</b>${c ? `<em>${owned(c.id) ? "✓ Owned" : "Not owned"}</em>` : ""}</button>`;
}
function outfitsHtml() {
  const o = outfit(); const b = body(); const worn = SLOTS.map(([s]) => o.slots[s]).filter(Boolean).map(cloth).filter(Boolean);
  const have = worn.filter(c => owned(c.id)).length;
  return `
  <div class="panel"><div class="ph"><h2>Outfit</h2><span class="meta">${worn.length ? `${have} of ${worn.length} owned` : "empty"}</span></div><div class="pb">
    <div class="orow"><select id="cwOutfit" aria-label="Outfit">${S.outfits.map(x => `<option value="${x.id}"${x.id === o.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
      <button class="btn" id="cwNew">New</button><button class="btn" id="cwRename">Rename</button>${S.outfits.length > 1 ? `<button class="btn warn" id="cwDel">Delete</button>` : ""}</div>
    <div class="seg jmode" style="grid-template-columns:1fr 1fr" role="group" aria-label="Body type for pictures">${[["f", "Feminine body"], ["m", "Masculine body"]].map(([k, l]) => `<button data-cwbody="${k}" class="${b === k ? "on" : ""}" aria-pressed="${b === k}">${l}</button>`).join("")}</div>
    ${!S.playthrough.v.body ? `<p class="hint" style="margin:-2px 0 6px">Showing masculine pictures until you pick. This sets the body type of the current save.</p>` : ""}
    <div class="doll"><div class="col">${["head", "face", "outer"].map(s => slotBox(o, s)).join("")}</div>
      <div class="mid">${silhouette(b)}</div>
      <div class="col">${["inner", "legs", "feet"].map(s => slotBox(o, s)).join("")}</div></div>
    <div class="outfit1">${slotBox(o, "special")}</div>
    <div class="btnrow"><button class="btn pri" id="cwShop" ${worn.length && have < worn.length ? "" : "disabled"}>Shopping list</button>${worn.length ? `<button class="btn" id="cwClear">Clear outfit</button>` : ""}</div>
    <p class="hint" style="margin:8px 0 0">Tap a slot to pick a piece. Outfits are shared by all saves; "owned" is for the save you have loaded.</p>
  </div></div>`;
}
function openPicker(s) {
  picking = s; const o = outfit(); const cur = o.slots[s] && cloth(o.slots[s]);
  const ms = models().filter(m => m.slot === s && m.items.some(counts));
  const q = (S.ui.wardrobe.pq || "").trim().toLowerCase();
  openSheet(`Pick · ${slotName(s)}`, `
    <div class="detail">
      ${cur ? `<div class="okbox" style="display:flex;align-items:center;gap:8px">Wearing: ${esc(cur.name)} <button class="btn" data-cwwear="" style="margin-left:auto">Remove</button></div>` : ""}
      <div class="search"><input id="cwPq" type="search" placeholder="Search ${esc(slotName(s).toLowerCase())}…" value="${esc(S.ui.wardrobe.pq || "")}" autocomplete="off" aria-label="Search"></div>
      <div id="cwPick">${pickList(ms, q)}</div>
    </div>`);
}
function pickList(ms, q) {
  const rows = ms.filter(m => !q || m.label.toLowerCase().includes(q) || m.items.some(c => matches(c, q))).map(m => {
    const got = m.items.filter(c => owned(c.id)).length;
    return m.items.length === 1
      ? `<div class="mrow ${owned(m.items[0].id) ? "own" : ""}"><button class="mmain" data-cwwear="${m.items[0].id}">${pic(m.items[0], "th")}<span class="nm">${esc(m.label)}<small>${owned(m.items[0].id) ? "✓ Owned" : esc(whereShort(m.items[0]))}</small></span></button></div>`
      : `<div class="mrow"><button class="mmain" data-cwmodel="${m.key}">${pic(m.items[0], "th")}<span class="nm">${esc(m.label)}<small>${m.items.length} variants${got ? ` · ${got} owned` : ""}</small></span><span class="tags"><span class="tag ok">Pick ›</span></span></button></div>`;
  });
  return rows.join("") || `<p class="hint">Nothing matches.</p>`;
}
function openShop() {
  const o = outfit(); const need = SLOTS.map(([s]) => o.slots[s]).filter(Boolean).map(cloth).filter(c => c && !owned(c.id));
  openSheet("Shopping list", `<div class="detail"><div class="name">${esc(o.name)}</div>
    ${need.map(c => `<div class="mrow"><button class="mmain" data-cwitem="${c.id}">${pic(c, "th")}<span class="nm">${esc(c.name)}<small>${esc(slotName(c.slot))} · ${esc(whereShort(c))}</small></span><span class="tags">${tags(c)}</span></button></div>`).join("")}
  </div>`);
}

/* ---------- render ---------- */
export function renderWardrobe() {
  const U = S.ui.wardrobe; const { done, total } = clothingTally();
  $("#v-wardrobe").innerHTML = `
  <div class="seg jmode" role="group" aria-label="Wardrobe">${[["outfits", "Outfits"], ["list", "Clothing list"]].map(([k, l]) => `<button data-cwmode="${k}" class="${U.mode === k ? "on" : ""}" aria-pressed="${U.mode === k}">${l}</button>`).join("")}</div>
  ${U.mode === "outfits" ? outfitsHtml() : `
  <div class="panel"><div class="ph"><h2>Clothing</h2><span class="meta">${done}/${total} owned</span></div><div class="pb">
    <div class="search"><input id="cwq" type="search" placeholder="Search name, maker, where to get it…" value="${esc(U.q || "")}" aria-label="Search clothing" autocomplete="off"></div>
    <div class="chips" role="group" aria-label="Slot">${[["all", "All"], ...SLOTS].map(([k, l]) => `<button class="chip ${U.slot === k ? "on" : ""}" data-cwslot="${k}" aria-pressed="${U.slot === k}">${l}</button>`).join("")}</div>
    <div class="field" style="padding-top:0"><div class="k">Hide what I own</div><div class="v"><button class="tog ${U.hideOwned ? "on" : ""}" id="cwHide" aria-pressed="${!!U.hideOwned}" aria-label="Hide owned clothing"></button></div></div>
    <div id="cwList">${listHtml()}</div>
  </div></div>
  <p class="hint">A number on the left = how many variants (colours and finishes) of that model you own. Pieces only worn during a mission, and Twitch/GOG extras, are listed but not counted. Pictures: Cyberpunk Wiki / CD PROJEKT RED.</p>`}`;
}

function refresh(reopen) {
  save(); if (S.ui.tab === "gear" && $("#v-wardrobe").classList.contains("on")) renderWardrobe();
  if (reopen && sheetOpen()) reopen();
}
export function click(t) {
  const ds = t.dataset, U = S.ui.wardrobe;
  if (ds.cwmode) { U.mode = ds.cwmode; picking = null; refresh(); return true; }
  if (ds.cwslot) { U.slot = ds.cwslot; refresh(); return true; }
  if (t.id === "cwHide") { U.hideOwned = !U.hideOwned; refresh(); return true; }
  if (ds.cwmodel) { if (!sheetOpen()) picking = null; openModel(ds.cwmodel); return true; }
  if (ds.cwitem) { if (!sheetOpen()) picking = null; openItem(ds.cwitem); return true; }
  if (ds.cwown) {
    const P = S.playthrough.clothes; const c = cloth(ds.cwown); const inSheet = sheetOpen() && t.closest("#sheet");
    if (P[c.id]) delete P[c.id]; else P[c.id] = Date.now();
    const isModel = inSheet && $("#sheet .vgrid");
    refresh(inSheet ? (isModel ? () => openModel(modelOf(c)) : () => openItem(c.id)) : null);
    if (!inSheet) renderList();
    toast(P[c.id] ? "Owned: " + c.name : "Marked not owned"); return true;
  }
  if (ds.cwpick !== undefined && ds.cwpick) { S.ui.wardrobe.pq = ""; openPicker(ds.cwpick); return true; }
  if (ds.cwwear !== undefined && picking) {
    const o = outfit(); if (ds.cwwear) o.slots[picking] = ds.cwwear; else delete o.slots[picking];
    const c = ds.cwwear && cloth(ds.cwwear); picking = null; closeSheet(); refresh(); toast(c ? "Wearing: " + c.name : "Slot cleared"); return true;
  }
  if (ds.cwbody) { S.playthrough.v.body = ds.cwbody; refresh(); return true; }
  if (t.id === "cwNew") { const n = prompt("Name the new outfit", `Outfit ${S.outfits.length + 1}`); if (n === null) return true; newOutfit(n.trim()); refresh(); return true; }
  if (t.id === "cwRename") { const o = outfit(); const n = prompt("Rename outfit", o.name); if (n && n.trim()) { o.name = n.trim().slice(0, 40); refresh(); } return true; }
  if (t.id === "cwDel") { const o = outfit(); if (!confirm(`Delete the outfit "${o.name}"?`)) return true; S.outfits = S.outfits.filter(x => x !== o); U.outfit = S.outfits[0].id; refresh(); return true; }
  if (t.id === "cwClear") { const o = outfit(); if (!confirm(`Take everything off "${o.name}"?`)) return true; o.slots = {}; refresh(); return true; }
  if (t.id === "cwShop") { openShop(); return true; }
  return false;
}
export function input(t) {
  if (t.id === "cwq") { S.ui.wardrobe.q = t.value; renderList(); return true; }
  if (t.id === "cwPq" && picking) { S.ui.wardrobe.pq = t.value; $("#cwPick").innerHTML = pickList(models().filter(m => m.slot === picking && m.items.some(counts)), t.value.trim().toLowerCase()); return true; }
  return false;
}
export function change(t) {
  if (t.id === "cwOutfit") { S.ui.wardrobe.outfit = t.value; refresh(); return true; }
  if (t.id === "cwq") { save(); return true; }
  return false;
}
