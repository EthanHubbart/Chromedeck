/* ============================ Character › Cyberware ============================
   The loadout (one panel per body slot), the cyberware picker, item details
   and the quick item editor.
   ============================================================================== */
import { DATA, S, build, save, setData, clone } from "../store.js";
import { slotCount, cw, itemCost, derived } from "../rules.js";
import { $, esc, toast, tierBadge, rarityName, firstLine, openSheet, closeSheet } from "../ui.js";
import { renderAll } from "../app.js";

export function renderCyberware() {
  const b = build(); const D = derived(b);
  const html = DATA.slots.map(sl => {
    const n = slotCount(sl, b);
    const arr = b.equipped[sl.id];
    let used = 0; arr.forEach(id => { const it = cw(id); if (it) used += itemCost(it, b); });
    const rows = arr.map((id, i) => {
      const it = cw(id);
      const isFaceplate = sl.faceplate && i === n - 1;
      if (!it) return `<button class="slot empty" data-pick="${sl.id}:${i}"><span class="add">+</span><span class="nm">${isFaceplate ? "Faceplate slot" : "Empty slot"}<small>${isFaceplate ? "Unlocked in Birds with Broken Wings (PL)" : "Tap to choose cyberware"}</small></span></button>`;
      const c = itemCost(it, b);
      const disc = c !== it.cap ? `<s>${it.cap}</s>` : "";
      return `<button class="slot" data-detail="${it.id}" data-from="${sl.id}:${i}">${tierBadge(it)}<span class="nm">${esc(it.name)}<small>${esc(firstLine(it.effect))}</small></span><span class="cap num">${disc}${c}</span></button>`;
    }).join("");
    const perkNote = sl.perkSlot ? (D[sl.perkSlot] ? `${n} slots, 1 from ${sl.perkName}` : `${n} slot${n > 1 ? "s" : ""} · +1 with ${sl.perkName}`) : (sl.faceplate ? `1 + faceplate` : `${n} slot${n > 1 ? "s" : ""}`);
    return `<div class="panel"><div class="ph"><h2>${esc(sl.name)}</h2><span class="meta"><b class="num">${used}</b> cap · ${perkNote}</span></div><div class="pb">${rows}</div></div>`;
  }).join("");
  $("#v-cyberware").innerHTML = html + `<p class="hint">Costs shown after All Things Cyber (rank 2) where it applies. Strikethrough = list price. Tap an installed item for details, swap, or removal.</p>`;
}

/* ---------- picker ---------- */
let pick = null; // {slot, idx, q, chip, faceplate}
function openPicker(slotId, idx) {
  const sl = DATA.slots.find(s => s.id === slotId); const b = build();
  const n = slotCount(sl, b); const isFaceplate = sl.faceplate && idx === n - 1;
  pick = { slot: slotId, idx, q: "", chip: "all", faceplate: isFaceplate };
  const current = b.equipped[slotId][idx];
  openSheet(sl.name + (isFaceplate ? " — faceplate" : ""), `
    <div class="search"><input id="pq" type="search" placeholder="Search name or effect" aria-label="Search cyberware" autocomplete="off">${current ? `<button class="btn sm warn" data-remove="1">Remove</button>` : ""}</div>
    <div class="chips" id="pchips"></div>
    <div id="plist"></div>
    <p class="hint" style="margin-top:8px">Each implant can only be installed once. Sorted by type, then cost.</p>`);
  renderPicker();
  setTimeout(() => { const i = $("#pq"); if (i && window.innerWidth > 720) i.focus(); }, 50);
}
function renderPicker() {
  const b = build();
  const installed = new Set(); Object.values(b.equipped).forEach(a => a.forEach(id => { if (id) installed.add(id); }));
  const current = b.equipped[pick.slot][pick.idx];
  let items = DATA.cyberware.filter(c => c.slot === pick.slot && (!!c.faceplate === !!pick.faceplate));
  const types = [...new Set(items.map(c => c.type).filter(Boolean))];
  if (pick.chip === "iconic") items = items.filter(c => c.iconic);
  else if (pick.chip !== "all") items = items.filter(c => c.type === pick.chip);
  const q = pick.q.trim().toLowerCase();
  if (q) items = items.filter(c => (c.name + " " + c.effect + " " + (c.notes || "")).toLowerCase().includes(q));
  items.sort((a, b2) => (a.type || "").localeCompare(b2.type || "") || a.cap - b2.cap || a.name.localeCompare(b2.name));
  $("#pchips").innerHTML = [["all", "All"], ...types.map(t => [t, t]), ["iconic", "Iconic"]].map(([v, l]) => `<button class="chip ${pick.chip === v ? "on" : ""}" data-chip="${esc(v)}" aria-pressed="${pick.chip === v}">${esc(l)}</button>`).join("");
  $("#plist").innerHTML = items.map(c => {
    const used = installed.has(c.id) && c.id !== current;
    const cost = itemCost(c, b);
    return `<div class="item ${used ? "used" : ""} ${c.id === current ? "sel" : ""}"><button class="main" data-install="${c.id}" ${used ? 'data-used="1"' : ""}>${tierBadge(c)}<span class="nm">${esc(c.name)}<small>${esc(firstLine(c.effect))}${c.req ? ` · needs ${esc(c.req)}` : ""}</small>${c.id === current ? '<span class="st">Installed here</span>' : used ? '<span class="st" style="color:var(--muted)">Installed elsewhere</span>' : ""}</span><span class="cap num">${cost}</span></button><button class="info" data-info="${c.id}" aria-label="Details for ${esc(c.name)}">ⓘ</button></div>`;
  }).join("") || `<p class="hint">Nothing matches.</p>`;
}

/* ---------- details & edit ---------- */
function openDetail(id, from) {
  const it = cw(id); const b = build(); const cost = itemCost(it, b);
  const inSlot = from ? from.split(":") : null;
  if (inSlot) pick = null;
  openSheet(DATA.slots.find(s => s.id === it.slot).name, `
    <div class="detail">
      <div class="name">${esc(it.name)}</div>
      <div class="line">${tierBadge(it)} <span>${it.iconic ? "Iconic · " : ""}${rarityName(it.tier)} and up</span>${it.type ? `<span>· ${esc(it.type)}</span>` : ""}<span>· capacity <b class="num">${cost}</b>${cost !== it.cap ? ` <s>${it.cap}</s>` : ""}</span>${it.armor ? `<span>· armor <b>${esc(it.armor)}</b></span>` : ""}</div>
      ${it.req ? `<div class="req">Requires perk: ${esc(it.req)}</div>` : ""}
      <div class="eff">${esc(it.effect)}</div>
      ${it.notes ? `<div class="notes">${esc(it.notes)}</div>` : ""}
      ${it.get ? `<div class="line"><span>Where to get it: <b>${esc(it.get)}</b></span></div>` : ""}
      ${it.src ? `<p class="hint" style="margin:0 0 6px"><a href="${esc(it.src)}" target="_blank" rel="noopener">Wiki page ↗</a></p>` : ""}
      <div class="btnrow">
        ${inSlot ? `<button class="btn" data-swap="${from}">Swap</button><button class="btn warn" data-uninstall="${from}">Remove</button>` : `<button class="btn pri" data-install="${it.id}">Install</button>`}
        <button class="btn" data-edit="${it.id}">Edit</button>
      </div>
    </div>`);
}
function openEdit(id) {
  const it = cw(id);
  openSheet("Edit " + it.name, `
    <div class="detail">
      <div class="field"><label class="k" for="eName">Name</label><div class="v" style="flex:1"><input type="text" id="eName" value="${esc(it.name)}"></div></div>
      <div class="field"><label class="k" for="eCap">Capacity cost</label><div class="v"><input type="number" id="eCap" value="${it.cap}" min="0"></div></div>
      <div class="field"><label class="k" for="eTier">Starting tier</label><div class="v"><input type="number" id="eTier" value="${it.tier}" min="1" max="5"></div></div>
      <div class="field"><div class="k">Iconic</div><div class="v"><button class="tog ${it.iconic ? "on" : ""}" id="eIconic" aria-pressed="${!!it.iconic}" aria-label="Iconic"></button></div></div>
      <div class="field"><label class="k" for="eArmor">Armor range</label><div class="v"><input type="text" id="eArmor" value="${esc(it.armor || "")}" placeholder="e.g. 25–130"></div></div>
      <div class="field"><label class="k" for="eReq">Required perk</label><div class="v" style="flex:1"><input type="text" id="eReq" value="${esc(it.req || "")}"></div></div>
      <div style="padding:8px 0"><label class="hint" for="eEff">Effect</label><textarea id="eEff" class="notes">${esc(it.effect)}</textarea></div>
      <div style="padding:0 0 8px"><label class="hint" for="eNotes">Your notes</label><textarea id="eNotes" class="notes" style="min-height:60px">${esc(it.notes || "")}</textarea></div>
      <div class="btnrow"><button class="btn pri" data-savedit="${it.id}">Save changes</button><button class="btn" data-detail="${it.id}">Cancel</button></div>
    </div>`);
}
function commitEdit(id) {
  const d = clone(DATA); const it = d.cyberware.find(c => c.id === id);
  it.name = $("#eName").value.trim() || it.name; it.cap = Math.max(0, parseInt($("#eCap").value) || 0); it.tier = Math.min(5, Math.max(1, parseInt($("#eTier").value) || 1));
  it.iconic = $("#eIconic").classList.contains("on"); it.armor = $("#eArmor").value.trim(); it.req = $("#eReq").value.trim(); it.effect = $("#eEff").value; it.notes = $("#eNotes").value;
  if (!it.armor) delete it.armor; if (!it.req) delete it.req; if (!it.notes) delete it.notes; if (!it.iconic) delete it.iconic;
  setData(d); save(); toast("Data updated"); closeSheet(); renderAll();
}

function installAt(slotId, idx, id) {
  const b = build();
  // remove from anywhere else first (unique per character)
  Object.keys(b.equipped).forEach(k => { b.equipped[k] = b.equipped[k].map(x => x === id ? null : x); });
  b.equipped[slotId][idx] = id; b.updated = Date.now(); save(); closeSheet(); renderAll(); toast("Installed");
}

/* ---------- events ---------- */
export function click(t, b) {
  const ds = t.dataset;
  if (ds.info) { openDetail(ds.info); return true; }
  if (ds.pick) { const [s, i] = ds.pick.split(":"); openPicker(s, +i); return true; }
  if (ds.detail) { openDetail(ds.detail, ds.from); return true; }
  if (ds.chip) { pick.chip = ds.chip; renderPicker(); return true; }
  if (ds.install) {
    if (ds.used) { toast("Already installed in another slot — tap ⓘ to see where it fits"); return true; }
    if (pick) installAt(pick.slot, pick.idx, ds.install);
    else { // from detail with no picker: put in first free slot of its type
      const it = cw(ds.install); const sl = DATA.slots.find(s => s.id === it.slot); const arr = b.equipped[it.slot]; const n = slotCount(sl, b);
      let i = arr.findIndex((x, ix) => !x && !(sl.faceplate && (ix === n - 1) !== !!it.faceplate)); if (i < 0) i = it.faceplate ? n - 1 : 0;
      installAt(it.slot, i, ds.install);
    }
    return true;
  }
  if (ds.remove) { b.equipped[pick.slot][pick.idx] = null; b.updated = Date.now(); save(); closeSheet(); renderAll(); toast("Removed"); return true; }
  if (ds.uninstall) { const [s, i] = ds.uninstall.split(":"); b.equipped[s][+i] = null; b.updated = Date.now(); save(); closeSheet(); renderAll(); toast("Removed"); return true; }
  if (ds.swap) { const [s, i] = ds.swap.split(":"); openPicker(s, +i); return true; }
  if (ds.edit) { openEdit(ds.edit); return true; }
  if (ds.savedit) { commitEdit(ds.savedit); return true; }
  if (t.id === "eIconic") { t.classList.toggle("on"); t.setAttribute("aria-pressed", t.classList.contains("on")); return true; }
  return false;
}
export function input(t) {
  if (t.id === "pq") { pick.q = t.value; renderPicker(); return true; }
  return false;
}
