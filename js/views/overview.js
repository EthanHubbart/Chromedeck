/* ============================ Collection › Overview ============================
   The completion dashboard: one progress bar per tracker across the app (Journal,
   Gear, Collection). Tapping a row jumps to that screen.
   ============================================================================== */
import { S, DATA } from "../store.js";
import { progress } from "../journal.js";
import { tally, killedCount, KINDS } from "./collectibles.js";
import { vehicleTally } from "./collection.js";
import { $, esc } from "../ui.js";
import { go } from "../app.js";

function rows() {
  const pr = progress();
  const ic = (DATA.weapons || []).filter(w => w.iconic);
  const t = k => ({ ...tally(k), go: k === "homes" ? "collection:homes" : `collection:collectibles:${k}` });
  return [
    { h: "Journal", items: [
      { label: "Main story", done: pr.storyDone, total: pr.storyTotal, go: "journal" },
      { label: "Side jobs", done: pr.sideDone, total: pr.sideTotal, go: "journal", bad: pr.sideMissed && `${pr.sideMissed} missed` },
      { label: "Gigs", done: pr.gigDone, total: pr.gigTotal, go: "journal" },
      { label: "Ending paths", done: pr.pathDone, total: pr.pathTotal, go: "journal" }
    ] },
    { h: "Gear", items: [
      { label: "Iconic weapons", done: ic.filter(w => S.playthrough.weapons[w.id]).length, total: ic.length, go: "gear:weapons" }
    ] },
    { h: "Collection", items: [
      { label: "Vehicles", ...vehicleTally(), go: "collection:vehicles" },
      { label: KINDS.tarot.title, ...t("tarot") },
      { label: KINDS.psychos.title, ...t("psychos"), bad: killedCount() && `${killedCount()} killed` },
      { label: KINDS.airdrops.title, ...t("airdrops") },
      { label: KINDS.relic.title, ...t("relic") },
      { label: KINDS.homes.title, ...t("homes") }
    ] }
  ];
}
const pct = (d, t) => t ? Math.round(d / t * 100) : 0;

export function renderOverview() {
  const groups = rows(); const all = groups.flatMap(g => g.items);
  const done = all.reduce((s, x) => s + x.done, 0), total = all.reduce((s, x) => s + x.total, 0);
  const full = all.filter(x => x.total && x.done === x.total).length;
  $("#v-overview").innerHTML = `
  <div class="panel"><div class="ph"><h2>Completion</h2><span class="meta">${full} of ${all.length} trackers at 100%</span></div><div class="pb">
    <div class="prog one"><div><small>Everything tracked</small><b class="num">${pct(done, total)}<span>%</span></b><i><em style="width:${pct(done, total)}%"></em></i><small>${done} of ${total} checked off</small></div></div>
  </div></div>
  ${groups.map(g => `<div class="panel"><div class="ph"><h2>${esc(g.h)}</h2></div><div class="pb dash">
    ${g.items.map(x => { const p = pct(x.done, x.total); const f = x.total && x.done === x.total;
      return `<button class="drow ${f ? "full" : ""}" data-go="${x.go}"><span class="dl">${esc(x.label)}${x.bad ? `<small class="bad">${esc(x.bad)}</small>` : ""}</span>
        <span class="dn num">${f ? "✓ " : ""}${x.done}<span>/${x.total}</span></span><i><em style="width:${p}%"></em></i></button>`; }).join("")}
  </div></div>`).join("")}
  <p class="hint">Only what applies to this run is counted (e.g. other lifepaths' jobs are left out). Romance-only places to stay aren't counted.</p>`;
}

export function click(t) {
  if (!t.dataset.go) return false;
  const [tab, sub, kind] = t.dataset.go.split(":");
  if (kind) S.ui.collect.kind = kind;
  go(tab, sub); return true;
}
