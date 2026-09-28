/* ======================= Collection › Collectibles & Homes =======================
   Checklists for Tarot graffiti, Cyberpsycho Sightings, Phantom Liberty airdrops and
   Relic terminals (one screen with a switch), and apartments (Homes). All share one
   row style and one detail sheet; KINDS says where each list's data and progress live.
   ================================================================================ */
import { S, DATA, save } from "../store.js";
import { mission, isDone } from "../journal.js";
import { $, esc, toast, openSheet, sheetOpen, wikiImg } from "../ui.js";

const eb = n => "€$" + n.toLocaleString("en-US");
const where = x => [x.sub, x.dist].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
const weapon = id => (DATA.weapons || []).find(w => w.id === id);

/* One entry per checklist. `state` = key under S.playthrough ({id: timestamp}).
   `counts` = entries included in the totals (the rest are listed but optional). */
export const KINDS = {
  tarot: {
    label: "Tarot", title: "Tarot graffiti", state: "tarot", data: () => DATA.tarot || [], noun: "found",
    group: x => x.pl ? "Phantom Liberty · Tomorrow Never Knows" : x.fool ? "Fool on the Hill" : "Endings only",
    sub: x => where(x),
    lead: "Scan each mural. The 20 for Fool on the Hill show up from Act 2; Judgement and The Devil only in endings; the four Kings are in Dogtown.",
    quests: [["Fool on the Hill", "mq033_tarot", x => x.fool], ["Tomorrow Never Knows", "mq033_ep1", x => x.pl]]
  },
  psychos: {
    label: "Psychos", title: "Cyberpsycho Sightings", state: "psychos", data: () => DATA.cyberpsychos || [], noun: "done",
    group: x => x.dist, sub: x => [x.who, x.sub, x.act === 1 ? "Act 1" : "Act 2"].filter(Boolean).join(" · "),
    lead: "Regina wants them alive: take them down with non-lethal damage. Killing one only changes her dialogue at the end of Psycho Killer, not the reward.",
    quests: [["Psycho Killer", "mq043_cyberpsychos", () => true]]
  },
  airdrops: {
    label: "Airdrops", title: "Airdrops", state: "airdrops", data: () => DATA.airdrops || [], noun: "looted",
    group: x => x.treasure ? "Treasure caches (loot once)" : "One-time airdrops", sub: x => x.sub,
    lead: "They start in Lucretia My Reflection and drop one at a time while you roam Dogtown. Each one-time drop is lost for good if you leave it to despawn, so loot it when you hear the AV."
  },
  relic: {
    label: "Relic", title: "Relic terminals", state: "relic", data: () => DATA.relicTerminals || [], noun: "used",
    group: () => "Operational Data Terminals · Dogtown", sub: x => x.loc,
    lead: "One Relic point each. Songbird gives 3 more in Dog Eat Dog and 3 in Birds with Broken Wings: 15 in all."
  },
  homes: {
    label: "Homes", title: "Apartments", state: "apartments", data: () => DATA.apartments || [], noun: "unlocked", counts: x => !x.dep,
    group: x => x.dep ? "Other places to stay (romance-dependent, not counted)" : "V's apartments",
    sub: x => [where(x), x.price && eb(x.price), x.pl && "PL"].filter(Boolean).join(" · "),
    lead: "Rentals appear on the EZEstates netpage after you talk with Takemura at Tom's Diner. Rent online, or visit the door. V's penthouse is only seen in the Path of Glory epilogue."
  }
};
export const COLLECT_KINDS = ["tarot", "psychos", "airdrops", "relic"];
const P = k => S.playthrough[KINDS[k].state];
const has = (k, id) => !!P(k)[id];
/* Totals for the Overview. */
export function tally(k) {
  const K = KINDS[k]; const list = K.data().filter(K.counts || (() => true));
  return { done: list.filter(x => has(k, x.id)).length, total: list.length };
}
export const killedCount = () => (DATA.cyberpsychos || []).filter(x => S.playthrough.psychoKilled[x.id]).length;

function tags(k, x) {
  const t = []; const d = has(k, x.id);
  if (k === "psychos" && S.playthrough.psychoKilled[x.id]) t.push(`<span class="tag bad">✕ Killed</span>`);
  else if (k === "psychos" && d) t.push(`<span class="tag ok">Alive</span>`);
  if (d) return t.join("");
  if (x.wpn) x.wpn.map(weapon).filter(Boolean).forEach(w => t.push(`<span class="tag warn">◆ ${esc(w.name)}</span>`));
  if (k === "airdrops" && !x.treasure) t.push(`<span class="tag bad">⚠ Missable</span>`);
  if (x.need && k === "psychos") t.push(`<span class="tag dim">Night only</span>`);
  if (x.dep) t.push(`<span class="tag dim">Romance</span>`);
  return t.join("");
}
function row(k, x) {
  const d = has(k, x.id);
  return `<div class="mrow ${d ? "done" : ""}">
    <button class="mchk" data-cown="${k}:${x.id}" aria-pressed="${d}" aria-label="${d ? "Mark not " : "Mark "}${KINDS[k].noun}: ${esc(x.name)}"><i></i></button>
    <button class="mmain" data-citem="${k}:${x.id}"><span class="nm">${esc(x.name)}<small>${esc(KINDS[k].sub(x) || "")}</small></span><span class="tags">${tags(k, x)}</span></button></div>`;
}

/* "All found — go finish the job" hints. */
function questHints(k) {
  const K = KINDS[k]; if (!K.quests) return "";
  return K.quests.map(([name, id, f]) => {
    const need = K.data().filter(f); if (!need.length || !mission(id)) return "";
    const got = need.filter(x => has(k, x.id)).length;
    if (isDone(id)) return `<p class="hint" style="margin:6px 0 0">✓ <button class="lnk" data-mission="${id}">${esc(name)}</button> is done.</p>`;
    return got === need.length ? `<div class="okbox" style="margin-top:8px">All ${need.length} done. Finish <button class="lnk" data-mission="${id}">${esc(name)}</button>.</div>`
      : `<p class="hint" style="margin:6px 0 0">${got}/${need.length} for <button class="lnk" data-mission="${id}">${esc(name)}</button>.</p>`;
  }).join("");
}

function listHtml(k) {
  const K = KINDS[k]; const hide = S.ui.collect.hideDone;
  let html = "", cur = null;
  for (const x of K.data()) {
    if (hide && has(k, x.id)) continue;
    const g = K.group(x); if (g !== cur) { cur = g; html += `<div class="msec"><b>${esc(g)}</b></div>`; }
    html += row(k, x);
  }
  return html || `<p class="hint">All done here.</p>`;
}

function panel(k) {
  const K = KINDS[k]; const { done, total } = tally(k); const pct = total ? Math.round(done / total * 100) : 0;
  const extra = k === "psychos" && killedCount() ? `<small class="bad">${killedCount()} killed</small>` : "";
  return `<div class="panel"><div class="ph"><h2>${esc(K.title)}</h2><span class="meta">${total} ${k === "homes" ? "apartments" : "to find"}</span></div><div class="pb">
    <div class="prog one"><div><small>${esc(K.noun)}</small><b class="num">${done}<span>/${total}</span></b><i><em style="width:${pct}%"></em></i>${extra}</div></div>
    <p class="hint" style="margin:4px 0 0">${esc(K.lead)}</p>${questHints(k)}
  </div></div>
  <div class="panel"><div class="ph"><h2>Checklist</h2><span class="meta">tap a name for details</span></div><div class="pb">
    <div class="field" style="padding-top:0"><div class="k">Hide what's done</div><div class="v"><button class="tog ${S.ui.collect.hideDone ? "on" : ""}" id="cHide" aria-pressed="${!!S.ui.collect.hideDone}" aria-label="Hide finished entries"></button></div></div>
    <div id="cList">${listHtml(k)}</div>
  </div></div>`;
}

export function renderCollectibles() {
  const U = S.ui.collect; if (!COLLECT_KINDS.includes(U.kind)) U.kind = "tarot";
  $("#v-collectibles").innerHTML = `
  <div class="seg jmode" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px" role="group" aria-label="Checklist">${COLLECT_KINDS.map(k => {
    const { done, total } = tally(k);
    return `<button data-ckind="${k}" class="${U.kind === k ? "on" : ""}" aria-pressed="${U.kind === k}">${KINDS[k].label}<small class="num">${done}/${total}</small></button>`;
  }).join("")}</div>
  ${panel(U.kind)}
  <p class="hint">Sources: the Cyberpunk Wiki pages linked in each entry. Tarot pictures: Cyberpunk Wiki / CD PROJEKT RED.</p>`;
}
export function renderHomes() { $("#v-homes").innerHTML = panel("homes"); }

function reqLinks(ids) {
  return ids.map(mission).filter(Boolean).map(m => `<button class="lnk" data-mission="${m.id}">${esc(m.name)}</button>${isDone(m.id) ? " ✓" : ""}`).join(", ");
}
function openItem(k, id) {
  const K = KINDS[k]; const x = K.data().find(e => e.id === id); if (!x) return;
  const d = has(k, x.id); const killed = k === "psychos" && S.playthrough.psychoKilled[x.id];
  const ws = (x.wpn || []).map(weapon).filter(Boolean);
  const verb = { tarot: "Found it", psychos: "Done", airdrops: "Looted it", relic: "Used it", homes: "Unlocked" }[k];
  openSheet(K.title, `
    <div class="detail">
      ${x.img ? `${wikiImg(x.img, x.name + " tarot card", "tarot")}` : ""}
      <div class="name">${esc(x.name)}</div>
      <div class="line">${[x.who && "Cyberpsycho: " + x.who, x.sub, x.dist].filter((v, i, a) => v && a.indexOf(v) === i).map(v => `<span>${esc(v)}</span>`).join("<span>·</span>")}</div>
      ${d ? `<div class="okbox">${esc(verb)} ✓${killed ? " · killed" : k === "psychos" ? " · taken alive" : ""}</div>` : ""}
      ${x.loc ? `<div class="k-h">Where</div><p style="margin:0 0 8px">${esc(x.loc)}</p>` : ""}
      ${x.price ? `<div class="k-h">Rent</div><p style="margin:0 0 8px">${eb(x.price)}, one-time${x.mission ? ` (${esc(x.mission)})` : ""}</p>` : ""}
      ${(x.after || []).length || x.need ? `<div class="k-h">Needs</div><p style="margin:0 0 8px">${[reqLinks(x.after || []), x.need && esc(x.need)].filter(Boolean).join(" · ")}</p>` : ""}
      ${(x.near || []).length ? `<div class="k-h">Location seen in</div><p style="margin:0 0 8px">${reqLinks(x.near)}</p>` : ""}
      ${ws.length ? `<div class="k-h">Iconic weapon</div><p style="margin:0 0 8px">${ws.map(w => `<button class="lnk" data-weapon="${w.id}">◆ ${esc(w.name)}</button>${S.playthrough.weapons[w.id] ? " (owned)" : ""}`).join(", ")}</p>` : ""}
      ${(x.loot || []).length ? `<div class="k-h">Notable loot</div><p style="margin:0 0 8px">${esc(x.loot.join(" · "))}${x.rtt ? `<br><span class="hint">Different contents once Run This Town is done (see the wiki).</span>` : ""}</p>` : ""}
      ${(x.items || []).length ? `<div class="k-h">Rewards</div><p style="margin:0 0 8px">${x.items.map(i => esc(i.n) + (i.miss ? " (missable)" : "")).join(" · ")}</p>` : ""}
      ${x.note ? `<p class="hint" style="margin:0 0 8px">${esc(x.note)}</p>` : ""}
      ${!d && k === "airdrops" && !x.treasure ? `<div class="warnbox" style="margin:0 0 8px">⚠ One time only: if it despawns before you loot it, it's gone for good.</div>` : ""}
      <div class="btnrow">
        <button class="btn ${d ? "" : "pri"}" data-cown="${k}:${x.id}">${d ? "Mark not " + K.noun : verb}</button>
        ${k === "psychos" ? `<button class="btn ${killed ? "" : "warn"}" data-ckill="${x.id}">${killed ? "Taken alive after all" : "I killed them"}</button>` : ""}
      </div>
      <p class="hint" style="margin-top:10px"><a href="${esc(x.src)}" target="_blank" rel="noopener">Wiki page ↗</a></p>
    </div>`);
}

function refresh(reopen) {
  save();
  if (S.ui.tab === "collection") { if ($("#v-collectibles").classList.contains("on")) renderCollectibles(); if ($("#v-homes").classList.contains("on")) renderHomes(); }
  if (reopen && sheetOpen()) openItem(...reopen);
}

export function click(t) {
  const ds = t.dataset;
  if (ds.citem) { const [k, id] = ds.citem.split(":"); openItem(k, id); return true; }
  if (ds.cown) {
    const [k, id] = ds.cown.split(":"); const st = P(k); const x = KINDS[k].data().find(e => e.id === id);
    if (st[id]) { delete st[id]; if (k === "psychos") delete S.playthrough.psychoKilled[id]; } else st[id] = Date.now();
    refresh(sheetOpen() ? [k, id] : null); toast(st[id] ? `${KINDS[k].noun[0].toUpperCase() + KINDS[k].noun.slice(1)}: ${x.name}` : "Unmarked"); return true;
  }
  if (ds.ckill) {
    const K = S.playthrough.psychoKilled; const id = ds.ckill;
    if (K[id]) delete K[id]; else { K[id] = true; S.playthrough.psychos[id] = S.playthrough.psychos[id] || Date.now(); }
    refresh(["psychos", id]); toast(K[id] ? "Marked killed" : "Marked taken alive"); return true;
  }
  if (ds.ckind) { S.ui.collect.kind = ds.ckind; refresh(); return true; }
  if (t.id === "cHide") { S.ui.collect.hideDone = !S.ui.collect.hideDone; refresh(); return true; }
  return false;
}
