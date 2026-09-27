/* ============================ game rules ============================
   Pure-ish calculations on top of DATA: perk gates and budgets, what the
   perk tree unlocks for capacity, and the capacity math itself.
   ==================================================================== */
import { DATA, S } from "./store.js";
import { toast } from "./ui.js";

/* ---------- perks ---------- */
export function perk(id) { return DATA.perks.find(p => p.id === id); }
export function attrMeta(id) { return DATA.attributes.find(a => a.id === id); }
export function attrVal(b, a) { const P = DATA.progression; return Math.max(P.attrBase, Math.min(P.attrMax, (b.attrs && b.attrs[a]) || P.attrBase)); }
export function perkLevel(b, id) { return (b.perks && b.perks[id]) | 0; }
export function perkCost(p) { return p.cost || 1; }
export function perkGate(b, p) {
  if (p.attr !== "relic" && attrVal(b, p.attr) < p.tier) return { ok: false, why: `Needs ${attrMeta(p.attr).name} ${p.tier}` };
  if (p.req && perkLevel(b, p.req) < 1) return { ok: false, why: `Needs ${perk(p.req).name}` };
  return { ok: true };
}
export function budgets(b) {
  const P = DATA.progression, C = DATA.capacity;
  const lvl = Math.max(C.minLevel, Math.min(C.maxLevel, b.level | 0));
  const attrTotal = P.attrBase * 5 + P.attrFree + (lvl - 1);
  const attrSpent = DATA.attributes.filter(a => !a.relic).reduce((s, a) => s + attrVal(b, a.id), 0);
  const perkTotal = (lvl - 1) + ((b.bonusPerk === undefined ? P.perkBonus : b.bonusPerk) | 0);
  let perkSpent = 0, relicSpent = 0; const byAttr = {};
  DATA.perks.forEach(p => { const l = perkLevel(b, p.id); if (!l) return; const c = l * perkCost(p); byAttr[p.attr] = (byAttr[p.attr] || 0) + c; if (p.attr === "relic") relicSpent += c; else perkSpent += c; });
  return { lvl, attrTotal, attrSpent, attrFree: attrTotal - attrSpent, perkTotal, perkSpent, perkFree: perkTotal - perkSpent, relicTotal: P.relicPoints, relicSpent, relicFree: P.relicPoints - relicSpent, byAttr };
}
/* derived from the tree — the capacity math reads these instead of manual toggles */
export function derived(b) {
  const C = DATA.capacity; const ids = C.perkLinks || {};
  const attrs9 = DATA.attributes.filter(a => !a.relic && attrVal(b, a.id) >= 9).length;
  return {
    renPunk: perkLevel(b, ids.renaissance || "renaissance_punk") >= 1,
    renAttrs: attrs9,
    atc: perkLevel(b, ids.allThingsCyber || "all_things_cyber"),
    licenseToChrome: perkLevel(b, ids.licenseToChrome || "license_to_chrome") >= (ids.licenseSlotLevel || 3),
    ambidextrous: perkLevel(b, ids.ambidextrous || "ambidextrous") >= 1,
    edgerunner: perkLevel(b, ids.edgerunner || "edgerunner") >= 1
  };
}
export function dependents(id) { // every perk that (transitively) requires id
  const out = []; const walk = x => { DATA.perks.forEach(p => { if (p.req === x && !out.includes(p.id)) { out.push(p.id); walk(p.id); } }); }; walk(id); return out;
}
export function addPerkPoint(b, id) {
  const p = perk(id); const g = perkGate(b, p); if (!g.ok) { toast(g.why); return false; }
  const l = perkLevel(b, id); if (l >= p.max) { toast("Already maxed"); return false; }
  b.perks = b.perks || {}; b.perks[id] = l + 1; b.updated = Date.now();
  const B = budgets(b); if (p.attr === "relic" ? B.relicFree < 0 : B.perkFree < 0) toast(p.attr === "relic" ? `Over Relic budget by ${-B.relicFree}` : `Over perk budget by ${-B.perkFree}`);
  return true;
}
export function removePerkPoint(b, id) {
  const l = perkLevel(b, id); if (!l) return false;
  b.perks[id] = l - 1; if (!b.perks[id]) delete b.perks[id];
  if (!b.perks[id]) { const dropped = dependents(id).filter(d => perkLevel(b, d) > 0); dropped.forEach(d => delete b.perks[d]); if (dropped.length) toast(`Also removed ${dropped.map(d => perk(d).name).join(", ")}`); }
  b.updated = Date.now(); return true;
}
export function setAttr(b, a, val) {
  const P = DATA.progression; val = Math.max(P.attrBase, Math.min(P.attrMax, val | 0));
  b.attrs = b.attrs || {}; b.attrs[a] = val;
  const dropped = DATA.perks.filter(p => p.attr === a && p.tier > val && perkLevel(b, p.id) > 0).map(p => p.id);
  dropped.forEach(d => delete b.perks[d]);
  if (dropped.length) toast(`Removed ${dropped.length} perk${dropped.length > 1 ? "s" : ""} above ${attrMeta(a).name} ${val}`);
  fixPerkSlots(b); b.updated = Date.now();
}
/* if a perk-granted cyberware slot disappears, drop what was in it */
export function fixPerkSlots(b) {
  DATA.slots.forEach(sl => { const n = slotCount(sl, b); const arr = b.equipped[sl.id]; if (!arr) return; if (arr.length > n) { for (let i = n; i < arr.length; i++) { if (arr[i]) toast("Removed " + cw(arr[i]).name + " — that slot came from a perk"); } arr.length = n; } while (arr.length < n) arr.push(null); });
}

/* ---------- capacity ---------- */
export function slotCount(sl, b) {
  let n = sl.base;
  if (sl.faceplate) n += 1;
  if (sl.perkSlot && b && derived(b)[sl.perkSlot]) n += 1;
  return n;
}
export function cw(id) { return DATA.cyberware.find(c => c.id === id); }
export function itemCost(item, b) {
  if (!item) return 0;
  const C = DATA.capacity;
  if (derived(b).atc >= 2 && C.allThingsCyberSlots.includes(item.slot)) return Math.round(item.cap * (1 - C.allThingsCyberPct / 100));
  return item.cap;
}
export function shardTotals(b) {
  let max = 0, tracked = 0;
  DATA.shards.forEach(sh => { max += sh.each * sh.max; const n = Math.min(S.playthrough.shards[sh.id] || 0, sh.max); tracked += sh.each * n; });
  return { max, tracked, used: b.shardMode === "max" ? max : tracked };
}
export function calc(b) {
  const C = DATA.capacity;
  const lvl = Math.max(C.minLevel, Math.min(C.maxLevel, b.level | 0));
  const base = C.base + C.perLevel * lvl;
  const eng = C.engineering.reduce((a, e) => a + ((b.engineering | 0) >= e.skill ? e.bonus : 0), 0);
  const D = derived(b);
  const ren = D.renPunk ? C.renaissancePerAttr * D.renAttrs : 0;
  const sh = shardTotals(b);
  const osIds = (b.equipped.os || []);
  const cc = osIds.includes(C.chromeCompressorId) ? (b.ccBonus | 0) : 0;
  const normal = Math.min(C.hardCap, base + eng + ren + sh.used + cc);
  const over = D.edgerunner ? C.edgerunner : 0;
  const limit = Math.min(C.hardCap, normal + over);
  let used = 0;
  DATA.slots.forEach(sl => { (b.equipped[sl.id] || []).forEach(id => { const it = cw(id); if (it) used += itemCost(it, b); }); });
  const overBy = Math.max(0, used - normal);
  return { lvl, base, eng, ren, shards: sh, cc, normal, over, limit, used, overBy, invalid: used > limit, free: limit - used, healthPenalty: overBy * 0.5 };
}
export function countEquipped(b) { let n = 0; Object.values(b.equipped).forEach(a => a.forEach(id => { if (id) n++; })); return n; }
