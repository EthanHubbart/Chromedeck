/* ============================ app shell ============================
   Boot, navigation, the header, and event routing. Each view module exports
   a render function plus optional click / input / change handlers that return
   true when they handled the event.
   =================================================================== */
import { S, build, save, loadState, restoreBackup, takeLoadNote } from "./store.js";
import { calc } from "./rules.js";
import { $, $$, esc, toast, icon, closeSheet, sheetOpen } from "./ui.js";
import * as cyber from "./views/cyberware.js";
import * as perks from "./views/perks.js";
import * as capacity from "./views/capacity.js";
import * as builds from "./views/builds.js";
import * as system from "./views/system.js";
import * as journal from "./views/journal.js";
import * as weapons from "./views/weapons.js";
import * as collection from "./views/collection.js";
import * as collectibles from "./views/collectibles.js";
import * as overview from "./views/overview.js";
import { renderSoon } from "./views/soon.js";

export const APP_VERSION = "0.9.0";   // keep in step with CACHE in sw.js

/* ---------- navigation ---------- */
/* Bottom tabs, left to right. A tab with `subs` shows sub-tabs across the top
   and remembers which one you were on (S.ui.subs). Also listed in UI_TABS in store.js. */
const TABS = [
  { id: "character", label: "Character", subs: [["cyberware", "Cyberware"], ["perks", "Perks"], ["capacity", "Capacity"], ["builds", "Builds"]] },
  { id: "gear", label: "Gear", subs: [["weapons", "Weapons"], ["wardrobe", "Wardrobe"]] },
  { id: "collection", label: "Collection", subs: [["overview", "Overview"], ["vehicles", "Vehicles"], ["collectibles", "Collectibles"], ["homes", "Homes"]] },
  { id: "journal", label: "Journal" },
  { id: "system", label: "System" }
];
const VIEWS = {
  cyberware: cyber.renderCyberware, perks: perks.renderPerks, capacity: capacity.renderCapacity, builds: builds.renderBuilds,
  weapons: weapons.renderWeapons, wardrobe: () => renderSoon("wardrobe"),
  overview: overview.renderOverview, vehicles: collection.renderVehicles, collectibles: collectibles.renderCollectibles, homes: collectibles.renderHomes,
  journal: journal.renderJournal,
  system: system.renderSystem
};
const HANDLERS = [cyber, perks, capacity, builds, journal, weapons, collection, collectibles, overview, system];

const curTab = () => TABS.find(t => t.id === S.ui.tab) || TABS[0];
const curSub = () => { const t = curTab(); const s = S.ui.subs[t.id]; return t.subs.some(([id]) => id === s) ? s : t.subs[0][0]; };
const viewId = () => curTab().subs ? curSub() : curTab().id;

export function go(tab, sub) {
  S.ui.tab = tab; if (sub) S.ui.subs[tab] = sub;
  closeSheet(); save(); renderAll(); window.scrollTo(0, 0);
}

function renderNav() {
  $("#tabs").innerHTML = TABS.map(t => `<button data-tab="${t.id}" class="${S.ui.tab === t.id ? "on" : ""}" aria-current="${S.ui.tab === t.id ? "page" : "false"}">${icon(t.id)}<span>${t.label}</span></button>`).join("");
  const tab = curTab(), sub = tab.subs && curSub();
  $("#subnav").innerHTML = tab.subs ? tab.subs.map(([id, l]) => `<button data-sub="${id}" class="${sub === id ? "on" : ""}" aria-current="${sub === id ? "page" : "false"}">${l}</button>`).join("") : "";
  $("#subnav").setAttribute("aria-label", tab.label + " sections");
  $("#subnav").hidden = !tab.subs;
  $$(".view").forEach(v => v.classList.toggle("on", v.id === "v-" + viewId()));
}

/* ---------- header ---------- */
export function renderHeader() {
  const isChar = S.ui.tab === "character";
  $("#buildbar").hidden = !isChar; $("#gauge").hidden = !isChar;
  if (!isChar) return;
  const b = build(); const r = calc(b);
  $("#buildSel").innerHTML = S.builds.map(x => `<option value="${x.id}"${x.id === b.id ? " selected" : ""}>${esc(x.name)}</option>`).join("");
  const N = 40; const perSeg = r.limit / N;
  let segs = "";
  for (let i = 0; i < N; i++) {
    const lo = i * perSeg; let cls = "";
    if (r.used > lo + perSeg * 0.5) cls = (lo >= r.normal) ? "over" : "on";
    else if (lo >= r.normal) cls = "dead";
    segs += `<i class="${cls}"></i>`;
  }
  const status = r.invalid ? `<span class="bad">Over limit by ${r.used - r.limit} — won't install</span>`
    : r.overBy > 0 ? `<span class="bad">Edgerunner zone: +${r.overBy} over, −${r.healthPenalty}% max health</span>`
    : `<b>${r.free}</b> free`;
  const pct = r.limit ? Math.min(100, r.used / r.limit * 100) : 0, okPct = r.limit ? Math.min(100, r.normal / r.limit * 100) : 0;
  const old = $("#subnav .mini"); if (old) old.remove();
  $("#subnav").insertAdjacentHTML("beforeend", `<div class="mini ${r.overBy > 0 || r.invalid ? "bad" : ""}" aria-hidden="true" title="Capacity ${r.used} / ${r.normal}"><i style="width:${pct}%"></i><b style="left:${okPct}%"></b></div>`);
  $("#gauge").innerHTML = `
    <div class="row"><span class="title">Cyberware capacity</span><span class="val ${r.invalid ? "warn" : ""} num">${r.used} <small>/ ${r.normal}${r.over ? ` (+${r.over})` : ""}</small></span></div>
    <div class="segs" role="meter" aria-label="Cyberware capacity used" aria-valuemin="0" aria-valuemax="${r.limit}" aria-valuenow="${r.used}">${segs}</div>
    <div class="sub"><span>Level ${r.lvl} · ${r.shards.used} from shards${r.cc ? ` · +${r.cc} Chrome Compressor` : ""}</span><span class="num">${status}</span></div>`;
}

/* Re-render what's on screen. Hidden views render when you switch to them. */
export function renderAll() { renderNav(); renderHeader(); VIEWS[viewId()](); }

/* Restore a {chromedeck, state} backup file, with a confirm and rollback. */
export function restoreFromFile(obj) {
  if (!confirm("Replace all builds, progress and data edits on this device with this backup?")) return;
  if (restoreBackup(obj.state)) { renderAll(); toast("Backup restored"); const n = takeLoadNote(); if (n) setTimeout(() => toast(n, 4000), 1700); }
  else toast("Couldn't read that backup — nothing was changed", 3000);
}

/* ---------- events ---------- */
const dispatch = (fn, t, b) => HANDLERS.some(h => h[fn] && h[fn](t, b));
document.addEventListener("click", e => {
  const t = e.target.closest("button,[data-perk],#scrim,a[data-tab]");
  if (!t || t.disabled) return;
  if (t.dataset.tab) { go(t.dataset.tab); return; }
  if (t.dataset.sub) { go(S.ui.tab, t.dataset.sub); return; }
  if (t.id === "sheetClose" || t.id === "scrim") { closeSheet(); return; }
  if (t.id === "hdrSave") { toast(save() ? "Saved" : "Saved for this session only — this browser blocks storage"); return; }
  dispatch("click", t, build());
});
document.addEventListener("input", e => { dispatch("input", e.target, build()); });
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "buildSel") { S.active = t.value; save(); renderAll(); return; }
  dispatch("change", t, build());
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && sheetOpen()) { closeSheet(); return; }
  perks.keydown(e);
});

/* ---------- offline / updates ---------- */
function registerSW() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("./sw.js").then(reg => {
    const offer = w => { $("#update").hidden = false; $("#swReload").onclick = () => { w.postMessage("skipWaiting"); }; };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) offer(w); });
    });
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloading) { reloading = true; location.reload(); } });
}

/* ---------- boot ---------- */
loadState();
renderAll();
const note = takeLoadNote(); if (note) toast(note, 4000);
registerSW();
