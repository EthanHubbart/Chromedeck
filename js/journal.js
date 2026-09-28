/* ============================ journal rules ============================
   Mission availability, story branches, deadlines and the recommended order.

   Recommended order = a topological sort of the missions (nothing comes
   before what it needs), picking the next ready mission by priority:
   - the user's custom order if they've moved things;
   - otherwise side jobs first (so side content is done as soon as it
     unlocks, which keeps deadlines safe), then main jobs in story order.
   Extra ordering rules (they shape the plan, not what the game allows):
   - a point-of-no-return mission (pnr) waits for everything outside the
     ending sections;
   - a mission with a deadline (`before`) comes before the missions it
     must precede.
   Side jobs with no listed prerequisite get an estimated unlock point
   from where they are (see anchorOf).
   ======================================================================= */
import { DATA, S } from "./store.js";

export const ENDING_SECS = new Set(["end_hanako", "end_aldecaldos", "end_rogue", "end_secret", "end_tower", "epilogue"]);
export const isEnding = m => ENDING_SECS.has(m.sec);
const afterPnr = m => isEnding(m) || m.sec === "act3";

export const mission = id => DATA.missions.find(m => m.id === id);
export const isDone = id => !!S.playthrough.missions[id];
export const section = id => DATA.missionSections.find(s => s.id === id);
export const isMain = m => m.type === "main";

/* A mission applies to this run unless it's on a branch the player didn't take. */
export function applies(m) {
  if (!m.branch) return true;
  const [key, val] = m.branch; const c = S.playthrough.choices[key];
  if (key === "plEnd" && S.playthrough.choices.pl === "reed") return false;   // surrender/escape only exists on Songbird's path
  return !c || c === val;
}
export const applicable = () => DATA.missions.filter(applies);

/* Estimated unlock point for side jobs the wiki lists no prerequisite for (most start when you
   pass a location). Act 1 is Watson-only, the rest of the city opens in Playing for Time, and
   Dogtown in Dog Eat Dog. Only used when the mission has no `after`/`any` of its own. */
const ANCHOR = { watson: "q001_intro", city: "q101_resurrection", dogtown: "q301_crash" };
export function anchorOf(m) {
  if (isMain(m) || (m.after && m.after.length) || (m.any && m.any.length)) return null;
  const id = m.pl ? ANCHOR.dogtown : m.district === "Watson" ? ANCHOR.watson : ANCHOR.city;
  return mission(id) ? id : null;
}

/* Deadlines: missions that must be done before `id`, or they're lost. */
export const deadlinesFor = id => DATA.missions.filter(x => (x.before || []).includes(id) && applies(x));
export const isMissed = m => !isDone(m.id) && (m.before || []).some(isDone);

/* Requirements. Game mode = what the game needs (plus the estimated anchor).
   Plan mode adds the ordering-only rules: point of no return and deadlines. */
function reqs(m, planList) {
  const ok = id => { const r = mission(id); return r && applies(r); };
  const all = (m.after || []).filter(ok);
  const any = (m.any || []).filter(ok);
  const a = anchorOf(m); if (a) all.push(a);
  if (planList) {
    if (m.pnr) planList.forEach(x => { if (x.id !== m.id && !afterPnr(x) && !isMissed(x)) all.push(x.id); });
    deadlinesFor(m.id).forEach(x => { if (!isMissed(x)) all.push(x.id); });
  }
  return { all: [...new Set(all)], any };
}
const met = (r, ok) => r.all.every(ok) && (!r.any.length || r.any.some(ok));

/* Available = the game would let you do it now, as far as the app can tell. */
export function isAvailable(m) {
  if (isDone(m.id) || !applies(m) || isMissed(m) || (m.ext && m.ext.length)) return false;
  return met(reqs(m, null), isDone);
}
/* What's still blocking a mission (names), for the detail view. */
export function blockers(m) {
  const r = reqs(m, null);
  const out = r.all.filter(id => !isDone(id)).map(id => mission(id).name + (id === anchorOf(m) ? " (estimated)" : ""));
  if (r.any.length && !r.any.some(isDone)) out.push("one of: " + r.any.map(id => mission(id).name).join(" / "));
  return out;
}
/* Unfinished missions you'd lose access to by starting a point-of-no-return mission. */
export function lockedOutBy(m) { return m.pnr ? applicable().filter(x => x.id !== m.id && !afterPnr(x) && !isDone(x.id) && !isMissed(x)) : []; }
export function leadsTo(m) { return DATA.missions.filter(x => applies(x) && ((x.after || []).includes(m.id) || (x.any || []).includes(m.id))); }

/* The plan: every applicable, not-missed mission in recommended order (done ones included). */
export function plan() {
  const list = applicable().filter(m => !isMissed(m));
  const custom = S.playthrough.order;
  const prio = new Map(); const base = DATA.missions.map(m => m.id);
  const ranked = custom.length ? [...custom, ...base.filter(id => !custom.includes(id))] : base;
  ranked.forEach((id, i) => prio.set(id, i));
  // finished (and optional) missions go first, in story order, so the list reads as history, then what's left
  const key = m => isDone(m.id) || m.opt ? -2e6 + prio.get(m.id) : custom.length ? prio.get(m.id) : (isMain(m) ? 1e6 : 0) + prio.get(m.id);
  const R = new Map(list.map(m => [m.id, reqs(m, list)]));
  const placed = new Set(), out = [];
  let pending = [...list];
  while (pending.length) {
    // done missions count as satisfied wherever they sit, so checking one off never re-shuffles what's before it
    const ready = pending.filter(m => met(R.get(m.id), id => placed.has(id) || isDone(id)));
    const pick = (ready.length ? ready : pending).reduce((a, b) => key(a) <= key(b) ? a : b);
    out.push(pick); placed.add(pick.id); pending = pending.filter(m => m !== pick);
  }
  return out;
}
export const missed = () => applicable().filter(isMissed);

/* Move a mission one step in the plan. Returns null on success, or why it can't move. */
export function move(id, dir) {
  const full = plan();
  const p = full.filter(m => !isDone(m.id) || m.id === id);
  const i = p.findIndex(m => m.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= p.length) return "It's already at the " + (dir < 0 ? "top." : "bottom.");
  const a = p[i], b = p[j];
  const list = applicable().filter(m => !isMissed(m));
  const needs = (x, y) => { const r = reqs(x, list); return r.all.includes(y.id) || (r.any.length && r.any.every(z => z === y.id)); };
  const why = (x, y) => (y.before || []).includes(x.id) ? `${y.name} has to be done before ${x.name}, or it's lost.` : x.pnr ? `${x.name} is the point of no return; everything else goes first.` : `${x.name} needs ${y.name} first.`;
  if (dir < 0 && needs(a, b)) return why(a, b);
  if (dir > 0 && needs(b, a)) return why(b, a);
  const ids = full.map(m => m.id);
  const ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
  [ids[ia], ids[ib]] = [ids[ib], ids[ia]];
  S.playthrough.order = ids;
  return null;
}
export const resetOrder = () => { S.playthrough.order = []; };

/* Mark a mission done, plus everything it (transitively) requires. Picks the branch it implies.
   Estimated anchors and ordering-only rules are never followed. */
export function markWithPrereqs(id) {
  const seen = new Set();
  const walk = mid => {
    if (seen.has(mid)) return; seen.add(mid);
    const m = mission(mid); if (!m) return;
    if (m.branch && !S.playthrough.choices[m.branch[0]]) setChoice(m.branch[0], m.branch[1]);
    S.playthrough.missions[mid] = S.playthrough.missions[mid] || Date.now();
    (m.after || []).forEach(r => { const x = mission(r); if (x && applies(x)) walk(r); });
    const any = (m.any || []).filter(r => { const x = mission(r); return x && applies(x); });
    if (any.length === 1) walk(any[0]);
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

/* Progress: main story (before the ending paths), side jobs, and ending paths finished. */
export function progress() {
  const list = applicable();
  const story = list.filter(m => isMain(m) && !isEnding(m));
  const side = list.filter(m => m.type === "side");
  const ends = DATA.missions.filter(isEnding);
  const endPaths = [...new Set(ends.map(m => m.sec))].filter(s => s !== "epilogue");
  const pathDone = endPaths.filter(s => ends.filter(m => m.sec === s).every(m => isDone(m.id))).length;
  const n = xs => xs.filter(m => isDone(m.id)).length;
  return { storyDone: n(story), storyTotal: story.length, sideDone: n(side), sideTotal: side.length, sideMissed: side.filter(isMissed).length, pathDone, pathTotal: endPaths.length };
}
