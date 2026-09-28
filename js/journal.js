/* ============================ journal rules ============================
   Mission availability, story branches and the recommended order.

   Recommended order = a topological sort of the missions (nothing comes
   before what it needs), picking the next mission by priority: the user's
   custom order if they've moved things, otherwise the order of data/missions.js.
   A point-of-no-return mission (pnr) also waits for every mission outside
   the ending sections, so free-roam content always lands before it.
   ======================================================================= */
import { DATA, S } from "./store.js";

export const ENDING_SECS = new Set(["end_hanako", "end_aldecaldos", "end_rogue", "end_secret", "end_tower", "epilogue"]);
export const isEnding = m => ENDING_SECS.has(m.sec);
const afterPnr = m => isEnding(m) || m.sec === "act3";

export const mission = id => DATA.missions.find(m => m.id === id);
export const isDone = id => !!S.playthrough.missions[id];
export const section = id => DATA.missionSections.find(s => s.id === id);

/* A mission applies to this run unless it's on a branch the player didn't take. */
export function applies(m) {
  if (!m.branch) return true;
  const [key, val] = m.branch; const c = S.playthrough.choices[key];
  if (key === "plEnd" && S.playthrough.choices.pl === "reed") return false;   // surrender/escape only exists on Songbird's path
  return !c || c === val;
}
export const applicable = () => DATA.missions.filter(applies);

/* Requirements as they apply this run: `any` lists drop options that don't apply. */
function reqs(m, list) {
  const all = (m.after || []).filter(id => { const r = mission(id); return r && applies(r); });
  const any = (m.any || []).filter(id => { const r = mission(id); return r && applies(r); });
  const extra = m.pnr ? list.filter(x => x.id !== m.id && !afterPnr(x)).map(x => x.id) : [];
  return { all: [...new Set([...all, ...extra])], any };
}
const met = (r, ok) => r.all.every(ok) && (!r.any.length || r.any.some(ok));

/* Availability uses the game's real requirements only. The point-of-no-return rule
   shapes the recommended order (see plan) but doesn't lock anything in the game. */
export function isAvailable(m) {
  if (isDone(m.id) || !applies(m)) return false;
  return met(reqs(m, []), isDone);
}
/* What's still blocking a mission (names), for the detail view. */
export function blockers(m) {
  const r = reqs(m, []);
  const out = r.all.filter(id => !isDone(id)).map(id => mission(id).name);
  if (r.any.length && !r.any.some(isDone)) out.push("one of: " + r.any.map(id => mission(id).name).join(" / "));
  return out;
}
/* Unfinished missions you'd lose access to by starting a point-of-no-return mission. */
export function lockedOutBy(m) { return m.pnr ? applicable().filter(x => x.id !== m.id && !afterPnr(x) && !isDone(x.id)) : []; }
export const isOptional = m => !!m.opt;
export function leadsTo(m) { return DATA.missions.filter(x => applies(x) && ((x.after || []).includes(m.id) || (x.any || []).includes(m.id))); }

/* The plan: every applicable mission in recommended order (done ones included, where they were). */
export function plan() {
  const list = applicable();
  const custom = S.playthrough.order;
  const prio = new Map(); const base = DATA.missions.map(m => m.id);
  const ranked = custom.length ? [...custom, ...base.filter(id => !custom.includes(id))] : base;
  ranked.forEach((id, i) => prio.set(id, i));
  const R = new Map(list.map(m => [m.id, reqs(m, list)]));
  const placed = new Set(), out = [];
  const ok = id => placed.has(id);
  let pending = [...list];
  while (pending.length) {
    // done missions count as satisfied wherever they sit, so checking one off never re-shuffles what's before it
    const ready = pending.filter(m => met(R.get(m.id), id => ok(id) || isDone(id)));
    const pick = (ready.length ? ready : pending).reduce((a, b) => prio.get(a.id) <= prio.get(b.id) ? a : b);
    out.push(pick); placed.add(pick.id); pending = pending.filter(m => m !== pick);
  }
  return out;
}

/* Move a mission one step in the plan. Returns null on success, or why it can't move. */
export function move(id, dir) {
  const p = plan().filter(m => !isDone(m.id) || m.id === id);
  const i = p.findIndex(m => m.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= p.length) return "It's already at the " + (dir < 0 ? "top." : "bottom.");
  const a = p[i], b = p[j];
  const list = applicable();
  const needs = (x, y) => { const r = reqs(x, list); return r.all.includes(y.id) || (r.any.length && r.any.every(z => z === y.id)); };
  if (dir < 0 && needs(a, b)) return `${a.name} needs ${b.name} first.`;
  if (dir > 0 && needs(b, a)) return `${b.name} needs ${a.name} first.`;
  const ids = plan().map(m => m.id);
  const ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
  [ids[ia], ids[ib]] = [ids[ib], ids[ia]];
  S.playthrough.order = ids;
  return null;
}
export const resetOrder = () => { S.playthrough.order = []; };

/* Mark a mission done, plus everything it (transitively) requires. Picks the branch it implies. */
export function markWithPrereqs(id) {
  const seen = new Set();
  const walk = mid => {
    if (seen.has(mid)) return; seen.add(mid);
    const m = mission(mid); if (!m) return;
    if (m.branch && !S.playthrough.choices[m.branch[0]]) setChoice(m.branch[0], m.branch[1]);
    S.playthrough.missions[mid] = S.playthrough.missions[mid] || Date.now();
    const r = reqs(m, []);   // no pnr expansion: finishing Nocturne doesn't mean you did every side job
    r.all.forEach(walk);
    if (r.any.length === 1) walk(r.any[0]);
  };
  walk(id);
  return seen.size;
}
export function toggleDone(id) {
  const m = mission(id);
  if (isDone(id)) { delete S.playthrough.missions[id]; return false; }
  if (m.branch && !S.playthrough.choices[m.branch[0]]) setChoice(m.branch[0], m.branch[1]);
  S.playthrough.missions[id] = Date.now(); return true;
}
export function setChoice(key, val) {
  S.playthrough.choices[key] = val || null;
  if (key === "pl" && val !== "songbird") S.playthrough.choices.plEnd = null;
}

/* Progress: main story (everything before the ending paths) and ending paths finished. */
export function progress() {
  const list = applicable();
  const story = list.filter(m => !isEnding(m));
  const ends = DATA.missions.filter(isEnding);
  const endPaths = [...new Set(ends.map(m => m.sec))].filter(s => s !== "epilogue");
  const pathDone = endPaths.filter(s => ends.filter(m => m.sec === s).every(m => isDone(m.id))).length;
  return { storyDone: story.filter(m => isDone(m.id)).length, storyTotal: story.length, pathDone, pathTotal: endPaths.length };
}
