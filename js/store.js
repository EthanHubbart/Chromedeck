/* ============================ state & storage ============================
   Everything the user owns lives in one object `S`, saved as JSON under one
   localStorage key. Game data `DATA` = the shipped SEED + the user's edits,
   which are stored as differences (S.dataEdits), not a full copy.
   ======================================================================== */
import { SEED, EXAMPLE_BUILDS } from "../data/index.js";
import { slotCount, cw } from "./rules.js";

const KEY = "chromedeck.v1";
const UI_TABS = ["character", "gear", "collection", "journal", "system"];   // must match TABS in app.js          // never change: existing saves live here
const mem = {};
export const store = {
  get() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return mem.state || null; } },
  set(v) { mem.state = v; try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } },
  persistent() { try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); return true; } catch (e) { return false; } }
};

export let DATA = null;   // active game data
export let S = null;      // app state
export const uid = () => Math.random().toString(36).slice(2, 9);
export const clone = o => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isIdList = v => Array.isArray(v) && v.length > 0 && v.every(x => x && typeof x === "object" && typeof x.id === "string");

/* ---------- data edits as diffs over SEED ----------
   dataEdits = { <key>: {set:{id: entry}, del:[id]} }  for id'd lists (perks, cyberware, shards…)
             | { <key>: {replace: value} }            for everything else (capacity, progression…) */
export function computeEdits(seed, data) {
  const edits = {};
  for (const k of Object.keys(data || {})) {
    if (k === "version") continue;
    const s = seed[k], d = data[k];
    if (s === undefined) { edits[k] = { replace: d }; continue; }
    if (same(s, d)) continue;
    if (isIdList(s) && Array.isArray(d) && d.every(x => x && typeof x.id === "string")) {
      const byId = new Map(s.map(x => [x.id, x])); const keep = new Set(d.map(x => x.id));
      const set = {}; d.forEach(x => { const o = byId.get(x.id); if (!o || !same(o, x)) set[x.id] = x; });
      const del = s.filter(x => !keep.has(x.id)).map(x => x.id);
      if (Object.keys(set).length || del.length) edits[k] = { set, del };
    } else edits[k] = { replace: d };
  }
  return edits;
}
export function applyEdits(seed, edits) {
  const out = clone(seed);
  for (const [k, e] of Object.entries(edits || {})) {
    if (e && "replace" in e) { out[k] = clone(e.replace); continue; }
    if (!Array.isArray(out[k]) || !e) continue;
    const del = new Set(e.del || []), set = e.set || {}, seen = new Set();
    out[k] = out[k].filter(x => !del.has(x.id)).map(x => { seen.add(x.id); return set[x.id] ? clone(set[x.id]) : x; });
    Object.values(set).forEach(x => { if (!seen.has(x.id)) out[k].push(clone(x)); });
  }
  out.version = seed.version + (Object.keys(edits || {}).length ? " · edited" : "");
  return out;
}
export const hasEdits = () => !!(S && S.dataEdits && Object.keys(S.dataEdits).length);

/* Replace game data with a full edited copy (raw editor, data import, item edit). */
export function setData(d) { S.dataEdits = computeEdits(SEED, d); DATA = applyEdits(SEED, S.dataEdits); normalize(); }
export function resetData() { S.dataEdits = {}; DATA = clone(SEED); normalize(); }

export function validateData(d) {
  if (!d || !Array.isArray(d.slots) || !Array.isArray(d.cyberware) || !d.capacity || !Array.isArray(d.shards) || !Array.isArray(d.perks) || !Array.isArray(d.attributes) || !d.progression) return "Needs slots, cyberware, shards, capacity, attributes, progression and perks.";
  const pids = new Set(d.perks.map(p => p.id));
  for (const p of d.perks) {
    if (!p.id || !p.attr || !p.name || !Array.isArray(p.lv) || !p.max) return `Perk "${p.name || p.id || "?"}" needs id, attr, name, max and lv[].`;
    if (p.req && !pids.has(p.req)) return `"${p.name}" requires unknown perk "${p.req}".`;
    if (!d.attributes.find(a => a.id === p.attr)) return `"${p.name}" points at unknown attribute "${p.attr}".`;
  }
  const ids = new Set();
  for (const c of d.cyberware) {
    if (!c.id || !c.slot || !c.name || typeof c.cap !== "number") return `Cyberware "${c.name || c.id || "?"}" needs id, slot, name and a numeric cap.`;
    if (ids.has(c.id)) return `Duplicate id "${c.id}".`; ids.add(c.id);
    if (!d.slots.find(s => s.id === c.slot)) return `"${c.name}" points at unknown slot "${c.slot}".`;
  }
  // missions are optional in hand-edited data (older exports don't have them)
  if (d.missions !== undefined) {
    if (!Array.isArray(d.missions) || !Array.isArray(d.missionSections)) return "missions and missionSections must be lists.";
    const secs = new Set(d.missionSections.map(s => s.id)), mids = new Set();
    for (const m of d.missions) {
      if (!m.id || !m.name || !m.type || !m.sec) return `Mission "${m.name || m.id || "?"}" needs id, name, type and sec.`;
      if (mids.has(m.id)) return `Duplicate mission id "${m.id}".`; mids.add(m.id);
      if (!secs.has(m.sec)) return `"${m.name}" points at unknown section "${m.sec}".`;
    }
    for (const m of d.missions) for (const r of [...(m.after || []), ...(m.any || [])]) if (!mids.has(r)) return `"${m.name}" requires unknown mission "${r}".`;
  }
  return null;
}

/* ---------- builds ---------- */
export function newBuild(name) {
  const b = {
    id: uid(), name: name || "New build", notes: "",
    level: 60, engineering: 30, shardMode: "max", ccBonus: 70, bonusPerk: DATA.progression.perkBonus,
    attrs: Object.fromEntries(DATA.attributes.filter(a => !a.relic).map(a => [a.id, DATA.progression.attrBase])),
    perks: {}, equipped: {}, created: Date.now(), updated: Date.now()
  };
  DATA.slots.forEach(s => { b.equipped[s.id] = Array(slotCount(s, b)).fill(null); });
  return b;
}
export function build() { return S.builds.find(b => b.id === S.active) || S.builds[0]; }

/* ---------- load ---------- */
let loadNote = "";
export const takeLoadNote = () => { const n = loadNote; loadNote = ""; return n; };

function hydrate(saved) {
  // v1 single-file saves kept a full copy of edited data; turn it into a diff once.
  if (saved && saved.dataOverride && !saved.dataEdits) saved.dataEdits = computeEdits(SEED, saved.dataOverride);
  if (saved) delete saved.dataOverride;
  const edits = (saved && saved.dataEdits) || {};
  DATA = applyEdits(SEED, edits);
  const err = validateData(DATA);
  if (err) { DATA = clone(SEED); loadNote = "Your data edits no longer fit this version and were set aside: " + err; }
  if (saved && Array.isArray(saved.builds) && saved.builds.length) {
    S = saved; S.dataEdits = err ? {} : edits;
    if (err) S.dataEditsSetAside = edits;
  } else {
    S = { builds: [], active: null, playthrough: { shards: {} }, dataEdits: err ? {} : edits };
    EXAMPLE_BUILDS.forEach(ex => { S.builds.push(Object.assign(newBuild(), clone(ex), { id: uid() })); });
    S.active = S.builds[0].id;
  }
  normalize();
}
export function loadState() { hydrate(store.get()); }

/* Restore a full backup. Rolls back if the backup can't be loaded. */
export function restoreBackup(state) {
  const prev = { DATA, S };
  try { hydrate(clone(state)); save(true); return true; }
  catch (e) { DATA = prev.DATA; S = prev.S; console.error(e); return false; }
}
export function importBuild(b) {
  if (!b || typeof b !== "object") return false;
  const nb = clone(b); nb.id = uid(); S.builds.push(nb); S.active = nb.id; normalize(); return true;
}

/* Phase-1 builds stored capacity perks as toggles; turn those into real perks once. */
function migrateFlags(b) {
  if (!("renPunk" in b) && !("atc" in b) && !("licenseToChrome" in b) && !("ambidextrous" in b) && !("edgerunner" in b)) return;
  b.perks = b.perks || {}; b.attrs = b.attrs || {}; const L = DATA.capacity.perkLinks; const bump = (a, v) => { if ((b.attrs[a] || 3) < v) b.attrs[a] = v; };
  if (b.atc >= 2 || b.renPunk) { b.perks[L.allThingsCyber] = Math.max(b.perks[L.allThingsCyber] | 0, 2); bump("tech", 9); }
  if (b.renPunk) { b.perks[L.renaissance] = 1; }
  if (b.licenseToChrome || b.ambidextrous || b.edgerunner) { b.perks[L.licenseToChrome] = Math.max(b.perks[L.licenseToChrome] | 0, b.licenseToChrome ? L.licenseSlotLevel : 1); b.perks[L.allThingsCyber] = Math.max(b.perks[L.allThingsCyber] | 0, 1); bump("tech", 15); }
  if (b.ambidextrous) b.perks[L.ambidextrous] = 1;
  if (b.edgerunner) { b.perks[L.edgerunner] = 1; bump("tech", 20); }
  let need = (b.renAttrs | 0) - DATA.attributes.filter(a => !a.relic && (b.attrs[a.id] || 3) >= 9).length;
  ["body", "reflexes", "cool", "int"].forEach(a => { if (need > 0 && (b.attrs[a] || 3) < 9) { b.attrs[a] = 9; need--; } });
  ["renPunk", "renAttrs", "atc", "licenseToChrome", "ambidextrous", "edgerunner"].forEach(k => delete b[k]);
}

/* Fill in missing fields and fit equipped arrays to the slot counts — after load, import, or data edits. */
export function normalize() {
  if (!S.playthrough) S.playthrough = { shards: {} };
  if (!S.playthrough.shards) S.playthrough.shards = {};
  const P = S.playthrough;
  if (!P.missions || typeof P.missions !== "object") P.missions = {};          // {missionId: timestamp done}
  if (!P.choices) P.choices = { lifepath: null, pl: null, plEnd: null };     // story branches taken this run
  if (!Array.isArray(P.order)) P.order = [];                                // user's custom mission order (ids), empty = recommended
  if (DATA.missions) { const ok = new Set(DATA.missions.map(m => m.id)); for (const id in P.missions) if (!ok.has(id)) delete P.missions[id]; P.order = P.order.filter(id => ok.has(id)); }
  if (!S.dataEdits) S.dataEdits = {};
  // UI position. v0.3.0 kept one `sub` (Character only) and had Wardrobe as its own tab.
  if (!S.ui) S.ui = { tab: "character" };
  if (!S.ui.subs) S.ui.subs = { character: S.ui.sub || "cyberware" };
  delete S.ui.sub;
  if (S.ui.tab === "wardrobe") { S.ui.tab = "gear"; S.ui.subs.gear = "wardrobe"; }
  if (!UI_TABS.includes(S.ui.tab)) S.ui.tab = "character";
  if (!S.ui.journal) S.ui.journal = { hideDone: true };
  if (!S.builds.length) { S.builds.push(newBuild("Build 1")); }
  const d = newBuild();
  S.builds.forEach(b => {
    if (typeof b.id !== "string") b.id = uid();
    for (const k in d) { if (b[k] === undefined && k !== "id") b[k] = clone(d[k]); }
    migrateFlags(b);
    b.equipped = b.equipped || {};
    DATA.slots.forEach(sl => { const n = slotCount(sl, b); const arr = (b.equipped[sl.id] || []).slice(0, n); while (arr.length < n) arr.push(null); b.equipped[sl.id] = arr.map(id => id && cw(id) ? id : null); });
  });
  if (!S.builds.find(b => b.id === S.active)) S.active = S.builds[0].id;
}

let asked = false;
export function save() {
  const ok = store.set(S);
  // Ask the browser not to evict our storage (helps on some browsers; iOS home-screen apps are already exempt from the 7-day wipe).
  if (ok && !asked && navigator.storage && navigator.storage.persist) { asked = true; navigator.storage.persist().catch(() => {}); }
  return ok;
}
