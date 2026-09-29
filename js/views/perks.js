/* ============================ Character › Perks ============================
   Attribute levels, point budgets and the hex perk trees (drawn as SVG).
   ========================================================================== */
import { DATA, current, isLive, build, save } from "../store.js";
import { perk, attrMeta, attrVal, perkLevel, perkGate, budgets, dependents, addPerkPoint, removePerkPoint, setAttr, fixPerkSlots, reqsOf } from "../rules.js";
import { $, esc, openSheet } from "../ui.js";
import { renderAll } from "../app.js";

export const UI = { perkAttr: "body", perkBranch: 0, scrollX: {} };   // scrollX: sideways position per attribute, kept while the app is open
/* In Live, the planner build shows through: its perk levels and attributes are the goal. */
const goal = () => isLive() ? build() : null;
const wantPerk = (g, b, id) => g ? Math.max(0, perkLevel(g, id) - perkLevel(b, id)) : 0;
function toGo(g, b) {
  if (!g) return null;
  let perks = 0, attrs = 0; const B = budgets(b), G = budgets(g);
  DATA.perks.forEach(p => { perks += wantPerk(g, b, p.id) * (p.cost ? 0 : 1); });
  DATA.attributes.filter(a => !a.relic).forEach(a => { attrs += Math.max(0, attrVal(g, a.id) - attrVal(b, a.id)); });
  const relic = Math.max(0, G.relicSpent - B.relicSpent);
  return { perks, attrs, relic, level: Math.max(0, G.lvl - B.lvl) };
}
function hexPath(x,y,r){ const pts=[]; for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; pts.push((x+r*Math.cos(a)).toFixed(1)+","+(y+r*Math.sin(a)).toFixed(1)); } return "M"+pts.join("L")+"Z"; }
function wrapLabel(s, max){ const words=s.split(" "); const lines=[]; let cur=""; words.forEach(w=>{ if((cur+" "+w).trim().length>max && cur){ lines.push(cur); cur=w; } else cur=(cur+" "+w).trim(); }); if(cur) lines.push(cur); if(lines.length>3){ lines[2]=lines.slice(2).join(" "); lines.length=3; if(lines[2].length>max+2) lines[2]=lines[2].slice(0,max)+"…"; } return lines; }

export function renderPerks(){
  const b=current(); const B=budgets(b); const P=DATA.progression; const g=goal(); const T=toGo(g,b);
  const attr=attrMeta(UI.perkAttr)||DATA.attributes[0]; UI.perkAttr=attr.id;
  if(UI.perkBranch>=attr.branches.length) UI.perkBranch=0;
  const av = attr.relic ? null : attrVal(b,attr.id);
  const chips = DATA.attributes.map(a=>{ const up = g && !a.relic && attrVal(g,a.id)>attrVal(b,a.id);
    return `<button class="achip ${a.id===attr.id?"on":""}" data-pattr="${a.id}"><b>${a.short}</b><span class="num">${a.relic?B.relicSpent+"/"+B.relicTotal:attrVal(b,a.id)}${up?`<em class="goalv">◆${attrVal(g,a.id)}</em>`:""}</span></button>`; }).join("");
  const TR = renderTree(attr, b);   // all branches side by side; the tabs follow the one on screen
  const branches = attr.branches.length>1 ? `<div class="seg wide" id="pTabs">${TR.L.order.map(i=>`<button data-pbranch="${i}" class="${UI.perkBranch===i?"on":""}" aria-pressed="${UI.perkBranch===i}">${esc(attr.branches[i])}</button>`).join("")}</div>` : "";
  const spent = B.byAttr[attr.id]||0;
  const tierMarks = attr.relic ? "" : `<div class="tiers">${P.tiers.map(t=>`<span class="${av>=t?"on":""}"><b>${t}</b>${P.tierNames[t]}</span>`).join("")}</div>`;
  const bad = c => c<0 ? ' style="color:var(--red)"' : '';
  $("#v-perks").innerHTML = `
  <div class="panel"><div class="ph"><h2>Points</h2><span class="meta">level ${B.lvl}</span></div><div class="pb">
    <div class="pts"><div><small>Attribute</small><b class="num"${bad(B.attrFree)}>${B.attrSpent}<span>/${B.attrTotal}</span></b></div><div><small>Perk</small><b class="num"${bad(B.perkFree)}>${B.perkSpent}<span>/${B.perkTotal}</span></b></div><div><small>Relic</small><b class="num"${bad(B.relicFree)}>${B.relicSpent}<span>/${B.relicTotal}</span></b></div></div>
    <div class="field" style="border:0;padding-top:4px"><div class="k">Bonus perk points<small>on top of 1 per level: 10 from skills at 15/35, the rest from Perk Shards (count varies by patch)</small></div><div class="v"><input type="number" min="0" max="40" value="${b.bonusPerk===undefined?P.perkBonus:b.bonusPerk}" data-f="bonusPerk" aria-label="Bonus perk points"></div></div>
    ${T?`<p class="hint goalline" style="margin:6px 0 0">◆ Planner "${esc(g.name)}": ${T.perks||T.attrs||T.relic?[T.perks&&`${T.perks} perk point${T.perks>1?"s":""}`,T.attrs&&`${T.attrs} attribute point${T.attrs>1?"s":""}`,T.relic&&`${T.relic} Relic point${T.relic>1?"s":""}`].filter(Boolean).join(", ")+" still to go"+(T.level?` (planned at level ${budgets(g).lvl})`:""):"everything matched ✓"}</p>`:""}
  </div></div>
  <div class="achips">${chips}</div>
  <div class="panel"><div class="ph"><h2>${esc(attr.name)}</h2><span class="meta"><b class="num">${spent}</b> pts in tree</span></div><div class="pb">
    ${attr.relic ? `<p class="hint" style="margin:0 0 6px">${esc(attr.perPoint)}</p>` : `
    <div class="field" style="border:0;padding-top:2px"><div class="k">${esc(attr.name)} level<small>${esc(attr.perPoint)} · ${esc(attr.skill)} skill</small></div>
      <div class="v"><button class="step" data-attr="${attr.id}" data-d="-1" ${av<=P.attrBase?"disabled":""}>−</button><span class="n num" style="font-size:22px">${av}</span><button class="step" data-attr="${attr.id}" data-d="1" ${av>=P.attrMax?"disabled":""}>+</button></div></div>
    ${tierMarks}`}
    ${branches}
  </div></div>
  <div class="tree" id="tree"><div class="treescroll" id="treeScroll">${TR.svg}</div></div>
  <p class="hint">Swipe sideways to move between trees; the tabs follow. Yellow = taken, white = available, red (dashed) = locked. A double outline marks a perk that links two trees; it needs every perk it's connected to. Tap a perk for details and to add or remove points.${isLive()?" ◆ with a dashed ring = in your planner build, not taken yet.":""} Perk pictures: Cyberpunk Wiki / CD PROJEKT RED.</p>`;
  hookScroll(attr, TR.L);
}
/* Keep the tabs in step with the tree on screen, and remember where the tree was scrolled. */
let TREE = null;
function hookScroll(attr, L) {
  const el = $("#treeScroll"); if (!el) return; TREE = { attr: attr.id, L };
  el.scrollLeft = UI.scrollX[attr.id] ?? branchScrollX(L, UI.perkBranch, el.clientWidth);
  const onScroll = () => {
    UI.scrollX[attr.id] = el.scrollLeft;
    const mid = el.scrollLeft + el.clientWidth / 2;
    const c = L.order.reduce((best, k) => Math.abs(L.cx[k] - mid) < Math.abs(L.cx[best] - mid) ? k : best, L.order[0]);
    if (c !== UI.perkBranch) { UI.perkBranch = c; document.querySelectorAll("#pTabs button").forEach(bt => { const on = +bt.dataset.pbranch === c; bt.classList.toggle("on", on); bt.setAttribute("aria-pressed", on); }); }
  };
  el.addEventListener("scroll", onScroll, { passive: true });
}
function scrollToBranch(c) {
  const el = $("#treeScroll"); if (!el || !TREE) return;
  el.scrollTo({ left: branchScrollX(TREE.L, c, el.clientWidth), behavior: "smooth" });
}
/* ---------- the tree: one canvas per attribute, laid out like the game ----------
   Every perk sits at its position on the official CD PROJEKT RED build planner (x, y in
   data/perks.js), scaled down: Rookie at the bottom, Legend across the top, the three trees
   side by side and bridge perks between them. The tabs follow the part of the canvas on screen. */
const SCALE = .46, PAD_X = 64, HEAD_H = 34, PAD_TOP = 62, PAD_BOT = 72, R_CORE = 24, R_SAT = 20;
const ICON = "https://static.wikia.nocookie.net/cyberpunk/images/";
export const perkIconUrl = p => p.icon ? `${ICON}${p.icon}/revision/latest/scale-to-width-down/100` : null;
const COL = { taken: "#f5e60d", open: "#eef6f7", locked: "#ff3d5e" };   // in-game: selected yellow, available white, locked red

const parentsOf = p => reqsOf(p).map(perk).filter(Boolean);
const bridgeCols = p => { const bs = [...new Set(parentsOf(p).filter(q => q.attr === p.attr).map(q => q.br))]; return bs.length > 1 ? bs : null; };
function layoutAttr(attr) {
  const P = DATA.perks.filter(p => p.attr === attr.id && p.x !== undefined);
  const minX = Math.min(...P.map(p => p.x)), maxX = Math.max(...P.map(p => p.x)), minY = Math.min(...P.map(p => p.y)), maxY = Math.max(...P.map(p => p.y));
  const pos = {}; P.forEach(p => { pos[p.id] = { x: PAD_X + (p.x - minX) * SCALE, y: HEAD_H + PAD_TOP + (p.y - minY) * SCALE }; });
  const W = Math.round(PAD_X * 2 + (maxX - minX) * SCALE), H = Math.round(HEAD_H + PAD_TOP + (maxY - minY) * SCALE + PAD_BOT);
  // tier bands: boundaries halfway between one tier's lowest perk and the next tier's highest
  const tiers = [...new Set(P.map(p => p.tier))].sort((m, n) => n - m);   // top (highest) first
  const ys = t => P.filter(p => p.tier === t).map(p => pos[p.id].y);
  const bands = tiers.map((t, i) => ({ tier: t,
    top: i ? (Math.max(...ys(tiers[i - 1])) + Math.min(...ys(t))) / 2 : HEAD_H,
    bottom: i < tiers.length - 1 ? (Math.max(...ys(t)) + Math.min(...ys(tiers[i + 1]))) / 2 : H }));
  // branch areas: the middle of each branch's perks (bridges and Legend perks left out), left to right
  const own = c => P.filter(p => p.br === c && !bridgeCols(p) && p.tier !== Math.max(...tiers));
  const cx = {}, x0 = {}; attr.branches.forEach((_, c) => { const xs = (own(c).length ? own(c) : P.filter(p => p.br === c)).map(p => pos[p.id].x); cx[c] = xs.reduce((a, v) => a + v, 0) / xs.length; x0[c] = Math.min(...xs); });
  const order = attr.branches.map((_, c) => c).sort((m, n) => cx[m] - cx[n]);
  return { P, order, cx, x0, W, H, bands, pos };
}
/* distance from point o to the segment a–z */
function segDist(o, a, z) { const dx = z.x - a.x, dy = z.y - a.y, t = Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.y - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(a.x + t * dx - o.x, a.y + t * dy - o.y); }
export function branchScrollX(L, c, viewW) { return Math.max(0, L.cx[c] - viewW / 2); }

function renderTree(attr, b) {
  const L = layoutAttr(attr); const Pr = DATA.progression; const gb = goal();
  const av = attr.relic ? 99 : attrVal(b, attr.id);
  let s = `<svg width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}" style="display:block" font-family="inherit">
    <defs>${Object.entries(COL).map(([k, c]) => `<filter id="pk-${k}" x="0" y="0" width="1" height="1"><feFlood flood-color="${c}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`).join("")}
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#1a2a32" stroke-width="2"/></pattern></defs>`;
  // branch names over their part of the canvas
  if (L.order.length > 1) L.order.forEach(c => { s += `<text x="${L.cx[c]}" y="22" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1.4" fill="var(--cyan)">${esc(attr.branches[c].toUpperCase())}</text>`; });
  // tier bands
  L.bands.forEach((bd, i) => {
    const locked = !attr.relic && bd.tier > av;
    s += `<rect x="0" y="${bd.top}" width="${L.W}" height="${bd.bottom - bd.top}" fill="${i % 2 ? "rgba(91,231,242,.025)" : "transparent"}"/><line x1="0" y1="${bd.top + .5}" x2="${L.W}" y2="${bd.top + .5}" stroke="var(--line)"/>`;
    const lbl = attr.relic ? (["", "Emergency Cloaking", "Vulnerability Analytics", "Jailbreak"][bd.tier] || "") : `${Pr.tierNames[bd.tier]} · ${attr.short} ${bd.tier}`;
    // repeat the tier label where each tab's view starts on a phone, so it's always on screen
    [...new Set([8, ...L.order.map(c => Math.round(branchScrollX(L, c, 366)) + 8)])].forEach(tx => { s += `<text x="${tx}" y="${bd.top + 18}" font-size="11" font-weight="700" letter-spacing="1.2" fill="${locked ? "var(--red)" : "var(--cyan)"}">${esc(lbl.toUpperCase())}${locked ? "  ·  LOCKED" : ""}</text>`; });
    if (locked) s += `<rect x="0" y="${bd.top}" width="${L.W}" height="${bd.bottom - bd.top}" fill="url(#hatch)" opacity=".45"/>`;
  });
  // links: straight from each parent to the perk, like the game (drawn first, under the nodes)
  L.P.forEach(p => parentsOf(p).forEach(q => {
    const a = L.pos[q.id], z = L.pos[p.id]; if (!a || !z) return;
    const pl = perkLevel(b, q.id), cl = perkLevel(b, p.id);
    const col = cl ? "var(--yellow)" : pl ? "var(--text)" : "var(--line2)";
    // a straight line that would run through another perk bends over the row instead
    const hits = L.P.some(o => o !== p && o !== q && L.pos[o.id] && segDist(L.pos[o.id], a, z) < R_CORE + 2);
    const d = hits ? `M${a.x},${a.y} V${Math.min(a.y, z.y) - R_CORE - 12} H${z.x} V${z.y}` : `M${a.x},${a.y} L${z.x},${z.y}`;
    s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${cl ? 2.4 : 1.6}" ${cl || pl ? "" : 'stroke-dasharray="4 4"'}/>`;
  }));
  // nodes
  L.P.forEach(p => {
    const n = L.pos[p.id]; if (!n) return;
    const r = p.core ? R_CORE : R_SAT, l = perkLevel(b, p.id), g = perkGate(b, p), maxed = l >= p.max;
    const st = l ? "taken" : g.ok ? "open" : "locked"; const c = COL[st];
    const want = wantPerk(gb, b, p.id); const url = perkIconUrl(p); const br = bridgeCols(p);
    s += `<g class="node" data-perk="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)}, ${l}/${p.max}, ${st === "taken" ? "taken" : st === "open" ? "available" : "locked"}${br ? ", links two trees" : ""}${want ? `, planner wants ${perkLevel(gb, p.id)}` : ""}">`;
    if (want) { s += `<path d="${hexPath(n.x, n.y, r + 7)}" fill="none" stroke="var(--yellow)" stroke-width="1.4" stroke-dasharray="3 3"/>`; const dx = n.x + r * .95, dy = n.y - r * .95; s += `<path d="M${dx},${dy - 6}L${dx + 6},${dy}L${dx},${dy + 6}L${dx - 6},${dy}Z" fill="var(--yellow)" stroke="var(--panel)" stroke-width="1.5"/>`; }
    if (br) s += `<path d="${hexPath(n.x, n.y, r + 4)}" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="1.2"/>`;   // double outline marks a bridge
    s += `<path d="${hexPath(n.x, n.y, r)}" fill="${st === "taken" ? "rgba(245,230,13,.16)" : "#081015"}" stroke="${c}" stroke-width="${p.core ? 2.4 : 1.8}" ${st === "locked" ? 'stroke-dasharray="4 3"' : ""}/>`;
    if (url) s += `<image href="${esc(url)}" x="${n.x - r * .72}" y="${n.y - r * .72}" width="${r * 1.44}" height="${r * 1.44}" filter="url(#pk-${st})" preserveAspectRatio="xMidYMid meet"/>`;
    if (p.max > 1 || p.cost) { const t = p.max > 1 ? `${l}/${p.max}` : l ? "✓" : `${p.cost} pt`; s += `<text x="${n.x + r + 5}" y="${n.y + 4}" font-size="11.5" font-weight="700" paint-order="stroke" stroke="var(--panel)" stroke-width="3" fill="${c}">${t}</text>`; }
    wrapLabel(p.name, 13).forEach((ln, i) => { s += `<text x="${n.x}" y="${n.y + r + 13 + i * 11}" text-anchor="middle" font-size="10.5" font-weight="${l ? 700 : 600}" paint-order="stroke" stroke="var(--panel)" stroke-width="3" stroke-linejoin="round" fill="${c}">${esc(ln)}</text>`; });
    s += `</g>`;
  });
  return { svg: s + `</svg>`, L };
}

function openPerk(id){
  const b=current(); const p=perk(id); const l=perkLevel(b,id); const g=perkGate(b,p); const a=attrMeta(p.attr); const gb=goal(); const gl=gb?perkLevel(gb,id):0;
  const deps = l===1 ? dependents(id).filter(d=>perkLevel(b,d)>0) : [];
  const lvls = p.lv.map((t,i)=>`<div class="lvl ${i<l?"on":""}"><span class="num">${p.max>1?`Lv ${i+1}`:(p.cost?`${p.cost} pt`:"")}</span><span>${esc(t)}</span></div>`).join("");
  openSheet(a.name + (a.relic?"":" · "+DATA.progression.tierNames[p.tier]+" "+p.tier), `
    <div class="detail">
      ${perkIconUrl(p)?`<img class="perkic" src="${esc(perkIconUrl(p))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`:""}
      <div class="name">${esc(p.name)}</div>
      <div class="line"><span>${p.core?"Core perk":"Perk"} · ${p.max>1?`${p.max} levels`:"1 level"}${p.cost?` · ${p.cost} Relic pt${p.cost>1?"s":""}`:""}</span>${p.only?`<span>· only ${esc(p.only)}</span>`:""}</div>
      ${reqsOf(p).map(r=>`<div class="${perkLevel(b,r)?"okbox":"warnbox"}" style="margin-top:0">Requires ${esc(perk(r).name)}${perk(r).attr!==p.attr||perk(r).br!==p.br?` <small>(${esc(attrMeta(perk(r).attr).name)}${perk(r).attr===p.attr?", other branch":""})</small>`:""}${perkLevel(b,r)?" ✓":""}</div>`).join("")}
      ${!g.ok && reqsOf(p).every(r=>perkLevel(b,r))?`<div class="warnbox" style="margin-top:0">${esc(g.why)}</div>`:""}
      ${p.verified===false?`<div class="warnbox"><b>Open question:</b> ${esc(p.check||"")}</div>`:""}
      ${gb&&gl?`<div class="${gl>l?"warnbox goalbox":"okbox"}" style="margin-top:0">◆ Planner "${esc(gb.name)}": ${p.max>1?`level ${gl}`:"taken"}${gl>l?"":" ✓ matched"}</div>`:""}
      <div class="lvls">${lvls}</div>
      ${deps.length?`<p class="hint">Removing the last point also clears: ${esc(deps.map(d=>perk(d).name).join(", "))}.</p>`:""}
      ${p.src?`<p class="hint" style="margin:0 0 6px"><a href="${esc(p.src)}" target="_blank" rel="noopener">Wiki page ↗</a></p>`:""}
      <div class="btnrow"><button class="btn pri" data-padd="${id}" ${(!g.ok||l>=p.max)?"disabled":""}>Add point</button><button class="btn warn" data-prem="${id}" ${l?"":"disabled"}>Remove point</button></div>
    </div>`);
}

/* ---------- events ---------- */
export function click(t, b) {
  const ds = t.dataset;
  if (ds.pattr) { UI.perkAttr = ds.pattr; if (UI.scrollX[ds.pattr] === undefined) UI.perkBranch = 0; renderPerks(); return true; }
  if (ds.pbranch !== undefined) { scrollToBranch(+ds.pbranch); return true; }
  if (ds.perk) { openPerk(ds.perk); return true; }
  if (ds.padd) { if (addPerkPoint(b, ds.padd)) { save(); openPerk(ds.padd); renderAll(); } return true; }
  if (ds.prem) { if (removePerkPoint(b, ds.prem)) { fixPerkSlots(b); save(); openPerk(ds.prem); renderAll(); } return true; }
  if (ds.attr) { setAttr(b, ds.attr, attrVal(b, ds.attr) + +ds.d); save(); renderAll(); return true; }
  return false;
}
export function change(t, b) {
  if (t.dataset.f === "bonusPerk") { b.bonusPerk = Math.max(0, parseInt(t.value) || 0); b.updated = Date.now(); save(); renderPerks(); return true; }
  return false;
}
export function keydown(e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.perk) { e.preventDefault(); openPerk(e.target.dataset.perk); return true; }
  return false;
}
