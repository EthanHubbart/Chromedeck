/* ============================ Journal ============================
   Missions in recommended order, with check-offs, story choices,
   mission details (requirements, unique items, deadlines) and reordering.
   ================================================================= */
import { S, save, DATA } from "../store.js";
const DATA_MISSIONS = () => DATA.missions;
import { mission, isDone, isAvailable, isMissed, isMain, blockers, leadsTo, lockedOutBy, deadlinesFor, anchorOf, requirementsOf, missed, plan, move, resetOrder, markWithPrereqs, toggleDone, setChoice, progress, section, isEnding, applies } from "../journal.js";
import { $, esc, toast, openSheet, sheetOpen } from "../ui.js";
import { weaponsFrom } from "./weapons.js";

const TYPE = { main: "Main Job", side: "Side Job", gig: "Gig" };
const PATH = { hellman: "Anders Hellman thread", evelyn: "Evelyn Parker thread", alt: "Voodoo Boys (Evelyn thread, part 2)", takemura: "Goro Takemura thread" };
/* Act 2's concurrent threads. Evelyn's chain continues straight into the Voodoo Boys (M'ap Tann
   Pèlen needs Double Life), so those two wiki groups share one lane. */
const LANES = [
  { name: "Evelyn Parker → Voodoo Boys", who: "with Judy", paths: ["evelyn", "alt"], short: "Evelyn thread" },
  { name: "Anders Hellman", who: "with Panam", paths: ["hellman"], short: "Hellman thread" },
  { name: "Goro Takemura", who: "", paths: ["takemura"], short: "Takemura thread" }
];
const laneOf = m => LANES.find(l => l.paths.includes(m.path));
const CHOICES = {
  lifepath: { label: "Lifepath", opts: [["corpo", "Corpo"], ["nomad", "Nomad"], ["streetkid", "Streetkid"]] },
  pl: { label: "Phantom Liberty: at Firestarter you sided with", opts: [["", "Not yet"], ["songbird", "Songbird"], ["reed", "Reed"]] },
  plEnd: { label: "At The Killing Moon you", opts: [["", "Not yet"], ["surrender", "Surrendered her"], ["escape", "Helped her escape"]] }
};
const FILTERS = [["all", "All"], ["main", "Main"], ["side", "Side"], ["gig", "Gigs"]];
const matchFilter = (m, f) => f === "all" || m.type === f;
const missableLeft = m => !isDone(m.id) && (m.items || []).some(i => i.miss);
const hasDeadline = m => !isDone(m.id) && !isMissed(m) && (m.before || []).length > 0;
const typeLabel = m => TYPE[m.type] + (m.minor ? " (minor)" : "");

function tags(m, inNext) {
  const t = [];
  if (isMissed(m)) t.push(`<span class="tag bad">✕ Missed</span>`);
  if (m.pnr && !isDone(m.id)) t.push(`<span class="tag bad">⛔ No return</span>`);
  if (hasDeadline(m)) t.push(`<span class="tag warn">⏳ Deadline</span>`);
  if (missableLeft(m)) t.push(`<span class="tag warn">⚠ Missable</span>`);
  if (!inNext && isAvailable(m)) t.push(`<span class="tag ok">▶ Available</span>`);
  if (m.ext && m.ext.length && !isDone(m.id)) t.push(`<span class="tag dim">Other reqs</span>`);
  if (m.opt && !isDone(m.id)) t.push(`<span class="tag dim">Optional</span>`);
  if (m.verified === false) t.push(`<span class="tag dim">? Check</span>`);
  return t.join("");
}
function row(m, inNext) {
  const d = isDone(m.id);
  const lane = m.path && laneOf(m);
  const sub = [typeLabel(m), lane ? lane.short : m.line || m.giver, m.tier && `Tier ${m.tier}`, m.district, m.pl && "PL"].filter(Boolean).map(esc).join(" · ");
  return `<div class="mrow ${d ? "done" : ""} ${isMissed(m) ? "missed" : ""}">
    <button class="mchk" data-mdone="${m.id}" aria-pressed="${d}" aria-label="${d ? "Mark not done" : "Mark done"}: ${esc(m.name)}"><i></i></button>
    <button class="mmain" data-mission="${m.id}"><span class="nm">${esc(m.name)}<small>${sub}</small></span><span class="tags">${tags(m, inNext)}</span></button>
  </div>`;
}
function seg(key) {
  const c = CHOICES[key]; const cur = S.playthrough.choices[key] || "";
  return `<div class="field stack"><div class="k">${c.label}</div><div class="v"><div class="seg" style="grid-template-columns:repeat(${c.opts.length},1fr)" role="group" aria-label="${esc(c.label)}">${c.opts.map(([v, l]) => `<button data-choice="${key}:${v}" class="${cur === v ? "on" : ""}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div></div></div>`;
}
/* Rows with section headers. Headers follow the main story (side jobs sit under the
   story point where they unlock), so the section is tracked across hidden rows too. */
function withHeaders(all, visible, lanes) {
  let sec = null, printed = null, html = ""; const seen = new Set();
  for (const m of all) {
    if (isMain(m)) sec = m.sec;
    if (!visible(m)) continue;
    if (sec && sec !== printed) {
      printed = sec; const s = section(sec);
      // story sections can interleave (Phantom Liberty opens mid-Act 2): a section that resumes says so
      if (seen.has(sec)) html += `<div class="msec cont"><b>${esc(s.name)} (continued)</b></div>`;
      else {
        seen.add(sec);
        html += `<div class="msec"><b>${esc(s.name)}</b>${s.note ? `<small>${esc(s.note)}</small>` : ""}</div>`;
        if (sec === "act2" && lanes) html += threadCard();
      }
    }
    html += row(m);
  }
  return html;
}
/* Act 2 threads: one lane per concurrent storyline, with a step bar and its next job. */
function threadCard() {
  const act2 = DATA_MISSIONS().filter(m => m.sec === "act2" && m.path);
  const cross = [];
  const lanes = LANES.map(l => {
    const steps = act2.filter(m => l.paths.includes(m.path));
    const done = steps.filter(m => isDone(m.id)).length;
    const next = steps.find(m => !isDone(m.id));
    steps.forEach(m => (m.after || []).forEach(r => { const x = mission(r); if (x && x.path && !l.paths.includes(x.path)) cross.push(`${m.name} also needs ${x.name} (${laneOf(x).short})`); }));
    const bar = steps.map(m => `<i class="${isDone(m.id) ? "on" : m === next ? "nx" : ""}" title="${esc(m.name)}${isDone(m.id) ? " ✓" : ""}"></i>`).join("");
    const nextHtml = !next ? `<span class="okt">Done ✓</span>` : `Next: <button class="lnk" data-mission="${next.id}">${esc(next.name)}</button>${isAvailable(next) ? "" : ` <span class="hint">(locked)</span>`}`;
    return `<div class="lane"><div class="lt"><b>${esc(l.name)}</b>${l.who ? `<small>${esc(l.who)}</small>` : ""}<span class="num">${done}/${steps.length}</span></div>
      <div class="lbar" role="img" aria-label="${esc(l.name)}: ${done} of ${steps.length} done">${bar}</div><div class="lnext">${nextHtml}</div></div>`;
  }).join("");
  return `<div class="threads"><div class="th">Act 2 threads · run side by side</div>${lanes}
    <p class="hint" style="margin:6px 0 0">Play them in any order; all three lead into Tapeworm and Act 3.${cross.length ? " " + esc(cross.join("; ")) + "." : ""}</p></div>`;
}

export function renderJournal() {
  const J = S.ui.journal; const hide = J.hideDone; const f = J.filter || "all";
  const P = plan(); const pr = progress(); const lost = missed();
  const avail = P.filter(m => isAvailable(m) && !m.opt);
  // Up next: the first few available, and always the next main job so the story stays visible
  let next = avail.slice(0, 5);
  const nextMain = avail.find(isMain);
  if (nextMain && !next.includes(nextMain)) next = [...next.slice(0, 4), nextMain];
  const byFilter = m => matchFilter(m, f);
  const visible = m => byFilter(m) && !(hide && isDone(m.id));
  const story = P.filter(m => !isEnding(m)), ends = P.filter(isEnding);
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const stat = (label, a, b, extra) => `<div><small>${label}</small><b class="num">${a}<span>/${b}</span></b><i><em style="width:${pct(a, b)}%"></em></i>${extra || ""}</div>`;
  const custom = S.playthrough.order.length > 0;
  const ch = S.playthrough.choices;
  const deadlines = P.filter(hasDeadline);
  const count = k => P.filter(m => matchFilter(m, k) && !isDone(m.id)).length;

  $("#v-journal").innerHTML = `
  <div class="panel"><div class="ph"><h2>Your run</h2><span class="meta">${P.length + lost.length} missions</span></div><div class="pb">
    <div class="prog">${stat("Main story", pr.storyDone, pr.storyTotal)}${stat("Side jobs", pr.sideDone, pr.sideTotal, pr.sideMissed ? `<small class="bad">${pr.sideMissed} missed</small>` : "")}${stat("Gigs", pr.gigDone, pr.gigTotal)}${stat("Endings", pr.pathDone, pr.pathTotal)}</div>
    ${seg("lifepath")}${seg("pl")}${ch.pl === "songbird" ? seg("plEnd") : ""}
    ${!ch.lifepath ? `<p class="hint" style="margin:6px 0 0">Pick your lifepath so the right lifepath jobs count.</p>` : ""}
  </div></div>

  <div class="panel"><div class="ph"><h2>Up next</h2><span class="meta">${avail.length} available now</span></div><div class="pb">
    ${next.length ? next.map(m => row(m, true)).join("") : `<p class="hint" style="margin:4px 0">Nothing available — everything's done, or check your choices above.</p>`}
    ${deadlines.length ? `<p class="hint" style="margin:8px 0 0">⏳ ${deadlines.length} job${deadlines.length > 1 ? "s have" : " has"} a deadline: ${deadlines.map(m => `<button class="lnk" data-mission="${m.id}">${esc(m.name)}</button>`).join(", ")}.</p>` : ""}
    ${!pr.storyDone ? `<p class="hint" style="margin:8px 0 0">Mid-playthrough? Open the last main job you finished and tap <b>Done, plus everything before it</b>, then tick off side jobs.</p>` : ""}
  </div></div>

  <div class="panel"><div class="ph"><h2>All missions</h2><span class="meta">${J.mode === "lines" ? "by storyline" : custom ? `custom order · <button class="lnk" id="jReset">reset</button>` : "recommended order"}</span></div><div class="pb">
    <div class="search"><input id="jq" type="search" placeholder="Search missions, characters, fixers…" value="${esc(J.q || "")}" aria-label="Search missions" autocomplete="off"></div>
    <div class="seg jmode" role="group" aria-label="List layout">${[["order", "Order"], ["lines", "By storyline"]].map(([k, l]) => `<button data-jmode="${k}" class="${(J.mode || "order") === k ? "on" : ""}" aria-pressed="${(J.mode || "order") === k}">${l}</button>`).join("")}</div>
    <div class="chips" role="group" aria-label="Show">${FILTERS.map(([k, l]) => `<button class="chip ${f === k ? "on" : ""}" data-jfilter="${k}" aria-pressed="${f === k}">${l} <span class="num">${count(k)}</span></button>`).join("")}</div>
    <div class="field" style="padding-top:0"><div class="k">Hide finished missions</div><div class="v"><button class="tog ${hide ? "on" : ""}" id="jHide" aria-pressed="${hide}" aria-label="Hide finished missions"></button></div></div>
    <div id="jList"></div>
  </div></div>
  <p class="hint" style="margin-top:0">Side jobs and gigs come first in the order: doing them as soon as they unlock keeps deadlines safe. NCPD Scanner Hustles aren't tracked. Data from the <a href="https://cyberpunk.fandom.com/wiki/Cyberpunk_2077_Side_Jobs" target="_blank" rel="noopener">Cyberpunk Wiki</a>; tap a mission for its source.</p>`;
  renderList();
}

/* ---------- the list: search results, recommended order, or grouped by storyline ---------- */
const norm = t => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function groupOf(m) {
  if (isMain(m)) {
    if (["prologue", "act1", "interlude"].includes(m.sec)) return "Prologue & Act 1";
    if (isEnding(m)) return "Endings · " + section(m.sec).name.replace(/^Ending path · /, "");
    return section(m.sec).name;
  }
  if (m.type === "gig") return `Gigs · ${m.giver}` + (m.giver === "Rogue Amendiares" ? "" : m.pl ? " · Dogtown" : ` · ${m.district}`);
  if (m.line) return "Side jobs · " + m.line;
  if (m.minor) return "Minor side jobs · " + (m.pl ? "Dogtown" : (m.district || "Anywhere").split(",")[0].trim());
  return "Side jobs · Early jobs";
}
/* Browsing order for storyline groups: main story, Phantom Liberty, Act 3, character side jobs,
   early and minor side jobs, gigs, endings. Within a rank, groups keep plan order. */
function groupRank(m) {
  if (isMain(m)) return isEnding(m) ? 7 : m.sec === "act3" ? 2 : m.sec.startsWith("pl") ? 1 : 0;
  if (m.type === "gig") return 6;
  return m.line ? 3 : m.minor ? 5 : 4;
}
function renderList() {
  const el = $("#jList"); if (!el) return;
  const J = S.ui.journal; const hide = J.hideDone; const f = J.filter || "all";
  const P = plan(); const lost = missed();
  const q = norm((J.q || "").trim());
  if (q) {
    const hits = [...P, ...lost].filter(m => matchFilter(m, f) && [m.name, m.giver, m.line, m.district, m.obj, m.id].some(x => norm(x).includes(q)));
    el.innerHTML = `<p class="hint" style="margin:4px 0">${hits.length} match${hits.length === 1 ? "" : "es"}${hits.length > 60 ? " (first 60)" : ""} · finished ones included</p>` + hits.slice(0, 60).map(m => row(m)).join("");
    return;
  }
  const visible = m => matchFilter(m, f) && !(hide && isDone(m.id));
  if (J.mode === "lines") {
    const groups = new Map();
    const rank = new Map();
    for (const m of P) { if (!matchFilter(m, f)) continue; const g = groupOf(m); if (!groups.has(g)) { groups.set(g, []); rank.set(g, groupRank(m)); } groups.get(g).push(m); }
    const sorted = [...groups].map((e, i) => [e, i]).sort((a, b) => rank.get(a[0][0]) - rank.get(b[0][0]) || a[1] - b[1]).map(x => x[0]);
    const open = new Set(J.open || []);
    let html = "";
    for (const [g, ms] of sorted) {
      const done = ms.filter(m => isDone(m.id)).length, left = ms.filter(visible);
      const avail = ms.filter(isAvailable).length, dl = ms.filter(hasDeadline).length;
      const pct = Math.round(done / ms.length * 100);
      html += `<details class="grp" data-grp="${esc(g)}" ${open.has(g) ? "open" : ""}><summary><span class="gt"><b>${esc(g)}</b><small>${done}/${ms.length} done${avail ? ` · ${avail} available` : ""}${dl ? ` · ⏳ ${dl}` : ""}</small></span><i class="gbar"><em style="width:${pct}%"></em></i></summary>
        ${g === "Act 2" && (f === "all" || f === "main") ? threadCard() : ""}${left.map(m => row(m)).join("") || `<p class="hint" style="margin:6px 0">All done ✓</p>`}</details>`;
    }
    if (lost.length && f !== "main") html += `<details class="grp"><summary><span class="gt"><b>Missed</b><small>${lost.length} · their deadline mission is done</small></span></summary>${lost.map(m => row(m)).join("")}</details>`;
    el.innerHTML = `<div class="btnrow" style="margin:0 0 6px"><button class="btn sm" id="jOpenAll">Expand all</button><button class="btn sm" id="jCloseAll">Collapse all</button></div>` + (html || `<p class="hint">Nothing here.</p>`);
    return;
  }
  const story = P.filter(m => !isEnding(m)), ends = P.filter(isEnding);
  el.innerHTML = `
    ${withHeaders(story, visible, f === "all" || f === "main") || `<p class="hint">Nothing left here.</p>`}
    ${ends.some(visible) ? `<details class="mends"><summary><b>Ending paths</b><small>You pick one at the end of Nocturne Op55N1. Each is its own run; completionists reload to see them all.</small></summary>${withHeaders(ends, visible)}</details>` : ""}
    ${lost.length && f !== "main" ? `<details class="mends"><summary><b>Missed · ${lost.length}</b><small>Their deadline mission is done. If you actually did one, tick it.</small></summary>${lost.map(m => row(m)).join("")}</details>` : ""}`;
}
/* remember which storyline groups are open */
document.addEventListener("toggle", e => {
  const d = e.target; if (!d.matches || !d.matches("details.grp[data-grp]")) return;
  const J = S.ui.journal; const set = new Set(J.open || []);
  d.open ? set.add(d.dataset.grp) : set.delete(d.dataset.grp);
  J.open = [...set]; save();
}, true);

function openMission(id) {
  const m = mission(id); const d = isDone(id);
  const s = m.sec ? section(m.sec) : null; const blk = blockers(m); const nx = leadsTo(m);
  const rq = requirementsOf(m);
  const reqNames = [...rq.all, ...rq.any].map(mission).filter(x => x && applies(x));
  const anc = anchorOf(m) && mission(anchorOf(m));
  const status = d ? `<div class="okbox">Done ✓</div>`
    : isMissed(m) ? `<div class="warnbox"><b>✕ Missed.</b> ${esc((m.before || []).map(mission).filter(Boolean).filter(x => isDone(x.id)).map(x => x.name).join(", "))} is done, so this is no longer available.</div>`
    : isAvailable(m) ? `<div class="okbox">Available now</div>`
    : !applies(m) ? `<div class="warnbox">Not part of this run (different branch or lifepath).</div>`
    : blk.length ? `<div class="warnbox">Locked. Still needs: ${esc(blk.join(", "))}</div>`
    : m.ext && m.ext.length ? `<div class="warnbox">Depends on things the app doesn't track yet (see below).</div>` : "";
  const items = (m.items || []).map(i => `<li>${esc(i.n)}${i.miss ? ` <span class="tag warn">⚠ Missable</span>` : ""}${i.dep ? ` <span class="tag dim">Depends on choices</span>` : ""}${i.opt ? ` <span class="tag dim">Optional</span>` : ""}${i.note ? ` <span class="tag dim">${esc(i.note)}</span>` : ""}</li>`).join("");
  const plist = xs => xs.map(x => `<button class="lnk" data-mission="${x.id}">${esc(x.name)}</button>${isDone(x.id) ? " ✓" : ""}`).join(", ");
  const firsts = deadlinesFor(id).filter(x => !isDone(x.id));
  const before = (m.before || []).map(mission).filter(Boolean);
  openSheet(typeLabel(m) + (s ? " · " + s.name : m.line ? " · " + m.line : m.pl ? " · Phantom Liberty" : ""), `
    <div class="detail">
      <div class="name">${esc(m.name)}</div>
      <div class="line">${[m.giver && `${m.type === "gig" ? "Fixer" : "Given by"} <b>${esc(m.giver)}</b>`, m.tier && `Tier ${m.tier}`, m.district && esc(m.district), m.path && esc(PATH[m.path]), m.line && m.line !== m.giver && `${esc(m.line)}'s story`, m.pl && "Phantom Liberty"].filter(Boolean).map(x => `<span>${x}</span>`).join("<span>·</span>")}</div>
      ${status}
      ${before.length && !d && !isMissed(m) ? `<div class="warnbox"><b>⏳ Deadline.</b> Do this before ${plist(before)}, or it's lost.</div>` : ""}
      ${firsts.length && !d ? `<div class="warnbox"><b>⏳ Finish these first</b> — starting or finishing ${esc(m.name)} makes them unavailable: ${plist(firsts)}.</div>` : ""}
      ${m.pnr && !d ? (() => { const lo = lockedOutBy(m); return `<div class="warnbox"><b>⛔ Point of no return.</b> ${lo.length ? `${lo.length} unfinished mission${lo.length > 1 ? "s" : ""} can't be done after this${lo.length <= 8 ? ": " + esc(lo.map(x => x.name).join(", ")) : ""}.` : "Everything else is finished."}</div>`; })() : ""}
      ${m.obj ? `<div class="k-h">Objective</div><p style="margin:0 0 8px">${esc(m.obj)}</p>` : ""}
      ${m.note ? `<div class="eff">${esc(m.note)}</div>` : ""}
      ${items ? `<div class="k-h">Rewards & unique items</div><ul class="ilist">${items}</ul>${(m.items || []).some(i => i.miss) ? `<p class="hint" style="margin:0 0 8px">Missable items can only be picked up during this mission.</p>` : ""}` : ""}
      ${(() => { const ws = weaponsFrom(m.id).filter(w => w.iconic); return ws.length ? `<div class="k-h">Iconic weapons here</div><p style="margin:0 0 8px">${ws.map(w => `<button class="lnk" data-weapon="${w.id}">${esc(w.name)}</button>${S.playthrough.weapons[w.id] ? " ✓" : w.miss && !w.lowe ? " ⚠" : ""}`).join(", ")}</p>` : ""; })()}
      ${reqNames.length ? `<div class="k-h">${rq.any.length && !rq.all.length ? "Follows one of" : m.type === "gig" && !(m.after || []).length ? `Unlocks after tier ${m.tier - 1}` : "Requires"}</div><p style="margin:0 0 8px">${plist(reqNames)}</p>` : ""}
      ${anc ? `<div class="k-h">Opens up</div><p style="margin:0 0 8px">After ${plist([anc])} <span class="hint">(estimated: the wiki lists no prerequisite, and this is when its area opens)</span></p>` : ""}
      ${m.ext && m.ext.length ? `<div class="k-h">Also needs</div><p style="margin:0 0 8px">${esc(m.ext.join("; "))} <span class="hint">(not tracked in the app yet)</span></p>` : ""}
      ${nx.length ? `<div class="k-h">Leads to</div><p style="margin:0 0 8px">${plist(nx)}</p>` : ""}
      ${m.verified === false ? `<div class="warnbox"><b>Open question:</b> ${esc(m.check || "not yet checked")} If your in-game Journal shows otherwise, let's fix it.</div>` : ""}
      <div class="btnrow">
        <button class="btn ${d ? "" : "pri"}" data-mdone="${id}">${d ? "Mark not done" : "Mark done"}</button>
        ${!d ? `<button class="btn" data-mprev="${id}">Done, plus everything before it</button>` : ""}
      </div>
      ${!d && !isMissed(m) ? `<div class="btnrow"><button class="btn sm" data-mmove="${id}:-1" aria-label="Move earlier in the order">▲ Earlier</button><button class="btn sm" data-mmove="${id}:1" aria-label="Move later in the order">▼ Later</button></div>` : ""}
      <p class="hint" style="margin-top:10px"><a href="${esc(m.src)}" target="_blank" rel="noopener">Wiki page ↗</a> · Image and walkthrough there. Game id <kbd>${esc(m.id)}</kbd></p>
    </div>`);
}

function refresh(id) { save(); renderJournal(); if (id && sheetOpen()) openMission(id); }

export function click(t) {
  const ds = t.dataset;
  if (ds.mission) { openMission(ds.mission); return true; }
  if (ds.mdone) { const nowDone = toggleDone(ds.mdone); refresh(sheetOpen() ? ds.mdone : null); toast(nowDone ? "Done: " + mission(ds.mdone).name : "Marked not done"); return true; }
  if (ds.mprev) { const n = markWithPrereqs(ds.mprev); refresh(ds.mprev); toast(`Marked ${n} mission${n > 1 ? "s" : ""} done`); return true; }
  if (ds.mmove) { const [id, d] = ds.mmove.split(":"); const why = move(id, +d); if (why) toast(why, 2800); else { refresh(id); toast(+d < 0 ? "Moved earlier" : "Moved later"); } return true; }
  if (ds.choice) { const [k, v] = ds.choice.split(":"); setChoice(k, v); refresh(); return true; }
  if (ds.jfilter) { S.ui.journal.filter = ds.jfilter; refresh(); return true; }
  if (ds.jmode) { S.ui.journal.mode = ds.jmode; refresh(); return true; }
  if (t.id === "jOpenAll" || t.id === "jCloseAll") {
    const all = t.id === "jOpenAll"; document.querySelectorAll("#jList details.grp[data-grp]").forEach(d => { d.open = all; });
    S.ui.journal.open = all ? [...document.querySelectorAll("#jList details.grp[data-grp]")].map(d => d.dataset.grp) : []; save(); return true;
  }
  if (t.id === "jHide") { S.ui.journal.hideDone = !S.ui.journal.hideDone; refresh(); return true; }
  if (t.id === "jReset") { if (confirm("Go back to the recommended order? Your manual moves will be undone.")) { resetOrder(); refresh(); toast("Recommended order restored"); } return true; }
  return false;
}

export function input(t) {
  if (t.id === "jq") { S.ui.journal.q = t.value; renderList(); return true; }
  return false;
}
export function change(t) {
  if (t.id === "jq") { save(); return true; }
  return false;
}
