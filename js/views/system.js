/* ============================ System ============================
   Backup & restore, installing the app, offline pictures, the game-data editor, and About.
   ================================================================ */
import { SEED } from "../../data/index.js";
import { S, DATA, store, save, setData, resetData, validateData, hasEdits } from "../store.js";
import * as pics from "../offline.js";
import { saveStrip } from "./saves.js";

/* Open questions to confirm in the game: every data entry marked verified:false, plus rules
   that aren't tied to one entry. */
const GENERAL_CHECKS = [
  // (bridge perks needing every connected perk: confirmed in game by the owner, 2026-09-29)
  { text: "Cool's three trees: the app shows them as Handguns & rifles · Stealth · Throwables, so Style Over Substance (which links Stealth and Throwables) can sit between its two trees. Is Stealth the middle tree in the game too?", perk: "style_over_substance" }
];
function checksHtml() {
  const rows = [
    ...GENERAL_CHECKS.map(c => ({ label: "Perk rule", text: c.text, attr: c.perk ? `data-perk="${c.perk}"` : "" })),
    ...DATA.perks.filter(p => p.verified === false).map(p => ({ label: "Perk · " + p.name, text: p.check, attr: `data-perk="${p.id}"` })),
    ...(DATA.missions || []).filter(m => m.verified === false).map(m => ({ label: "Mission · " + m.name, text: m.check, attr: `data-mission="${m.id}"` })),
    ...(DATA.clothing || []).filter(c => c.verified === false).map(c => ({ label: "Clothing · " + c.name, text: c.check, attr: `data-cwitem="${c.id}"` }))
  ];
  return `<div class="panel"><div class="ph"><h2>To check in game</h2><span class="meta">${rows.length} open</span></div><div class="pb">
    <p class="hint" style="margin:0 0 6px">Things the wiki doesn't settle. Tell me what you see and I'll fix the data.</p>
    ${rows.map(r => `<button class="chk" ${r.attr}><b>${esc(r.label)}</b><small>${esc(r.text || "")}</small></button>`).join("")}
  </div></div>`;
}
import { $, esc, toast, download, readFile } from "../ui.js";
import { renderAll, restoreFromFile, APP_VERSION } from "../app.js";

const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function renderSystem() {
  const edited = hasEdits();
  const persistent = store.persistent();
  const counts = Object.entries(S.dataEdits || {}).map(([k, e]) => e.replace !== undefined ? `${k} (replaced)` : `${k}: ${Object.keys(e.set || {}).length} changed/added, ${(e.del || []).length} removed`);
  const install = standalone()
    ? `<div class="okbox">Installed — you're running Chromedeck as an app. It works offline.</div>`
    : isIOS()
      ? `<ol class="steps"><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (square with an arrow).</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open Chromedeck from the new icon. Your data lives with the installed app, so use a backup if you already made builds in Safari.</li></ol>`
      : `<p class="hint" style="margin:0">On iPhone: open this page in Safari → Share → <b>Add to Home Screen</b>. On a PC: use the install icon in Chrome or Edge's address bar, or just bookmark it.</p>`;

  $("#v-system").innerHTML = `
  <div class="panel"><div class="ph"><h2>Saves</h2><span class="meta">${S.saves.length} of 5</span></div><div class="pb">${saveStrip()}
    <p class="hint" style="margin:6px 0 0">Start a new playthrough, switch between up to 5, or rename one. Builds are shared by all saves.</p></div></div>

  <div class="panel"><div class="ph"><h2>Backup</h2><span class="meta">${S.builds.length} build${S.builds.length > 1 ? "s" : ""}</span></div><div class="pb">
    <p class="hint" style="margin:0 0 8px">${persistent ? "Everything saves on this device automatically. Export a backup now and then — it's the only copy if the device or browser clears its storage." : "This browser isn't allowing storage, so nothing survives closing it. Export a backup to keep your work."}</p>
    <div class="btnrow"><button class="btn pri" id="sExport">Export everything</button><button class="btn" id="sImport">Restore a backup</button></div>
    <input type="file" id="sFile" accept="application/json,.json" hidden>
  </div></div>

  ${checksHtml()}

  <div class="panel"><div class="ph"><h2>Install on your phone</h2></div><div class="pb">${install}</div></div>

  <div class="panel"><div class="ph"><h2>Offline pictures</h2><span class="meta" id="picMeta"></span></div><div class="pb" id="picBody"><p class="hint" style="margin:0">Checking…</p></div></div>

  <div class="panel"><div class="ph"><h2>Game data</h2><span class="meta">${edited ? "with your edits" : "as shipped"}</span></div><div class="pb">
    <p class="hint" style="margin:0 0 8px">${esc(DATA.version)} · ${DATA.cyberware.length} cyberware · ${DATA.perks.length} perks · ${DATA.shards.length} shard sources · ${(DATA.missions || []).length} missions. Cyberware capacity costs came from the Cyberpunk wiki's 2.31 table; effect text is paraphrased. Quick fixes: open any implant in Character › Cyberware and tap Edit.</p>
    ${edited ? `<p class="hint" style="margin:0 0 8px">Your edits: ${esc(counts.join(" · "))}. Updates to everything else still come through.</p>` : ""}
    ${S.dataEditsSetAside ? `<div class="warnbox">Some older data edits didn't fit this version and were set aside. Export everything to keep a copy of them.</div>` : ""}
    <div class="btnrow"><button class="btn" id="dExport">Export data</button><button class="btn" id="dImport">Import data</button><button class="btn warn" id="dReset" ${edited ? "" : "disabled"}>Undo all edits</button></div>
    <input type="file" id="dFile" accept="application/json,.json" hidden>
  </div></div>

  <details class="panel adv"><summary class="ph"><h2>Raw data editor</h2><span class="meta">advanced</span></summary><div class="pb">
    <textarea id="dRaw" rows="14" spellcheck="false" aria-label="Game data as JSON"></textarea>
    <div class="btnrow"><button class="btn pri" id="dApply">Apply</button><button class="btn" id="dReload">Reload from current</button></div>
    <div id="dMsg"></div>
    <p class="hint" style="margin-top:8px">Fields per perk: <kbd>id</kbd> <kbd>attr</kbd> <kbd>tier</kbd> <kbd>br</kbd> (branch index) <kbd>core</kbd> <kbd>max</kbd> <kbd>req</kbd> <kbd>cost</kbd> (Relic) <kbd>only</kbd> <kbd>lv</kbd> (one string per level). Fields per cyberware: <kbd>id</kbd> <kbd>slot</kbd> <kbd>name</kbd> <kbd>cap</kbd> <kbd>tier</kbd> <kbd>iconic</kbd> <kbd>type</kbd> (OS only) <kbd>effect</kbd> <kbd>armor</kbd> <kbd>req</kbd> <kbd>notes</kbd> <kbd>faceplate</kbd> <kbd>capBonus</kbd>. Keep ids stable or saved builds lose their items.</p>
  </div></details>

  <div class="panel"><div class="ph"><h2>About</h2><span class="meta">v${APP_VERSION}</span></div><div class="pb">
    <p class="hint" style="margin:0 0 6px">Chromedeck is an unofficial, free fan project for Cyberpunk 2077 (patch 2.31, Phantom Liberty included). It isn't affiliated with or endorsed by CD PROJEKT RED. Cyberpunk 2077 and related names are trademarks of CD PROJEKT S.A.</p>
    <p class="hint" style="margin:0">Game facts are checked against the <a href="https://cyberpunk.fandom.com/wiki/Cyberpunk_Wiki" target="_blank" rel="noopener">Cyberpunk Wiki</a>. Spot something wrong? Fix it in Game data or note it for the next update.</p>
  </div></div>`;
  // the full data is large (clothing alone is ~0.5 MB), so only fill the editor when it's opened
  $("details.adv").addEventListener("toggle", e => { if (e.target.open && !$("#dRaw").value) $("#dRaw").value = JSON.stringify(DATA, null, 1); });
  renderPictures();
}

/* ---- offline pictures ---- */
const mb = n => n >= 10 ? Math.round(n) + " MB" : n >= 1 ? n.toFixed(1) + " MB" : Math.max(0.1, n).toFixed(1) + " MB";
let picProgress = null;   // last progress while a download runs
async function renderPictures() {
  const el = $("#picBody"); if (!el) return;
  if (!pics.supported()) { el.innerHTML = `<p class="hint" style="margin:0">This browser can't keep pictures for offline use.</p>`; return; }
  const st = await pics.status(); const used = await pics.usedMB();
  if (!$("#picBody")) return;
  $("#picMeta").textContent = `${st.saved}/${st.total} saved`;
  const run = pics.isRunning() && picProgress;
  el.innerHTML = `
    <p class="hint" style="margin:0 0 8px">Pictures normally download the first time you open an item. Save them all at once on Wi-Fi so every picture shows without signal.${used ? ` Chromedeck uses about ${mb(used)} on this device right now.` : ""}</p>
    ${run ? `<div class="prog one"><div><small>Downloading</small><b class="num">${picProgress.done}<span>/${picProgress.total}</span></b><i><em style="width:${picProgress.total ? Math.round(picProgress.done / picProgress.total * 100) : 0}%"></em></i>${picProgress.failed ? `<small class="bad">${picProgress.failed} failed, tap Save again later to retry</small>` : ""}</div></div>
      <div class="btnrow"><button class="btn" id="picStop">Stop</button></div>`
    : `<div class="btnrow">
        <button class="btn pri" id="picSave" ${st.saved === st.total ? "disabled" : ""}>${st.saved === st.total ? "All pictures saved ✓" : st.saved ? `Save the other ${st.total - st.saved} (about ${mb(st.missingMB)})` : `Save all ${st.total} pictures (about ${mb(st.missingMB)})`}</button>
        <button class="btn warn" id="picRemove" ${st.saved ? "" : "disabled"}>Remove saved pictures</button>
      </div>`}`;
}
async function startPictures() {
  picProgress = { done: 0, total: 0, failed: 0 };
  const p = pics.saveAll(pr => { picProgress = pr; renderPictures(); });
  renderPictures();
  const res = await p;
  if (res) toast(res.failed ? `Saved ${res.done - res.failed} pictures, ${res.failed} failed` : res.done < res.total ? "Stopped. Tap Save to carry on." : `Saved ${res.done} pictures (${mb(res.bytes / 1048576)})`, 3000);
  renderPictures();
}

export function click(t) {
  switch (t.id) {
    case "sExport": download(`chromedeck-backup-${new Date().toISOString().slice(0, 10)}.json`, { chromedeck: 2, state: S }); return true;
    case "sImport": $("#sFile").click(); return true;
    case "dExport": download("chromedeck-data.json", DATA); return true;
    case "dImport": $("#dFile").click(); return true;
    case "dReset":
      if (!confirm(`Undo all your game-data edits and go back to the shipped ${SEED.version} data?`)) return true;
      resetData(); save(); renderAll(); toast("Shipped data restored"); return true;
    case "dApply": {
      let d; try { d = JSON.parse($("#dRaw").value); } catch (err) { $("#dMsg").innerHTML = `<div class="warnbox">JSON error: ${esc(err.message)}</div>`; return true; }
      const err = validateData(d); if (err) { $("#dMsg").innerHTML = `<div class="warnbox">${esc(err)}</div>`; return true; }
      setData(d); save(); renderAll(); toast("Data applied"); return true;
    }
    case "picSave": startPictures(); return true;
    case "picStop": pics.stop(); return true;
    case "picRemove":
      if (!confirm("Delete the pictures saved on this device? They'll download again when you open items.")) return true;
      pics.removeAll().then(() => { renderPictures(); toast("Saved pictures removed"); }); return true;
    case "dReload": $("#dRaw").value = JSON.stringify(DATA, null, 1); $("#dMsg").innerHTML = ""; return true;
  }
  return false;
}
export function change(t) {
  if (t.id === "sFile") {
    readFile(t, obj => {
      if (obj && obj.chromedeck && obj.state) restoreFromFile(obj);
      else if (obj && obj.chromedeck && obj.build) toast("That's a single build — import it from Character › Builds");
      else toast("Not a Chromedeck backup");
    });
    return true;
  }
  if (t.id === "dFile") {
    readFile(t, d => { const err = validateData(d); if (err) { toast(err, 3500); return; } setData(d); save(); renderAll(); toast("Data imported"); });
    return true;
  }
  return false;
}
