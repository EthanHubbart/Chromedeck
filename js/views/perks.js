/* ============================ Character › Perks ============================
   Attribute levels, point budgets and the hex perk trees (drawn as SVG).
   ========================================================================== */
import { DATA, build, save } from "../store.js";
import { perk, attrMeta, attrVal, perkLevel, perkGate, budgets, dependents, addPerkPoint, removePerkPoint, setAttr, fixPerkSlots } from "../rules.js";
import { $, esc, openSheet } from "../ui.js";
import { renderAll } from "../app.js";

export const UI = { perkAttr: "body", perkBranch: 0 };
const TREE_W = 360, NODE_CORE = 25, NODE_SAT = 19, ROW_H = 86, BAND_PAD = 8, LABEL_H = 26, MAX_PER_ROW = 3;
function layoutBranch(attr, br, b){
  const P = DATA.perks.filter(p=>p.attr===attr && p.br===br);
  const tiers = attr==="relic" ? [...new Set(P.map(p=>p.tier))].sort((x,y)=>x-y) : DATA.progression.tiers;
  const nodes=[], bands=[]; let y=0;
  tiers.forEach(tier=>{
    const inTier = P.filter(p=>p.tier===tier); if(!inTier.length) return;
    const roots = inTier.filter(p=>!p.req || !inTier.find(q=>q.id===p.req));
    const clusters = roots.map(r=>{
      const rows=[[r]]; let frontier=[r];
      for(;;){ const next=inTier.filter(p=>frontier.some(f=>f.id===p.req)); if(!next.length) break; rows.push(next); frontier=next; }
      const wrapped=[]; rows.forEach(row=>{ const chunks=Math.ceil(row.length/MAX_PER_ROW), size=Math.ceil(row.length/chunks); for(let i=0;i<row.length;i+=size) wrapped.push(row.slice(i,i+size)); });
      return {rows:wrapped, w:Math.max(...wrapped.map(r=>r.length))};
    });
    const totalW = clusters.reduce((a,c)=>a+c.w,0);
    const top=y; y+=LABEL_H+BAND_PAD; let x0=0, maxRows=0;
    clusters.forEach(c=>{
      const cwid = TREE_W*c.w/totalW;
      c.rows.forEach((row,ri)=>row.forEach((p,i)=>nodes.push({p, x:x0+(i+0.5)*cwid/row.length, y:y+ri*ROW_H+NODE_CORE+2, r:p.core?NODE_CORE:NODE_SAT, row:ri, cx0:x0, cx1:x0+cwid})));
      maxRows=Math.max(maxRows,c.rows.length); x0+=cwid;
    });
    y += maxRows*ROW_H + BAND_PAD; bands.push({tier, top, bottom:y});
  });
  // edges (including links back to a core in an earlier band, same branch)
  const edges=[]; nodes.forEach(n=>{ if(!n.p.req) return; const par=nodes.find(m=>m.p.id===n.p.req); if(par) edges.push({from:par,to:n}); });
  return {nodes, edges, bands, h:y};
}
function hexPath(x,y,r){ const pts=[]; for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; pts.push((x+r*Math.cos(a)).toFixed(1)+","+(y+r*Math.sin(a)).toFixed(1)); } return "M"+pts.join("L")+"Z"; }
function wrapLabel(s, max){ const words=s.split(" "); const lines=[]; let cur=""; words.forEach(w=>{ if((cur+" "+w).trim().length>max && cur){ lines.push(cur); cur=w; } else cur=(cur+" "+w).trim(); }); if(cur) lines.push(cur); if(lines.length>3){ lines[2]=lines.slice(2).join(" "); lines.length=3; if(lines[2].length>max+2) lines[2]=lines[2].slice(0,max)+"…"; } return lines; }

export function renderPerks(){
  const b=build(); const B=budgets(b); const P=DATA.progression;
  const attr=attrMeta(UI.perkAttr)||DATA.attributes[0]; UI.perkAttr=attr.id;
  if(UI.perkBranch>=attr.branches.length) UI.perkBranch=0;
  const av = attr.relic ? null : attrVal(b,attr.id);
  const chips = DATA.attributes.map(a=>`<button class="achip ${a.id===attr.id?"on":""}" data-pattr="${a.id}"><b>${a.short}</b><span class="num">${a.relic?B.relicSpent+"/"+B.relicTotal:attrVal(b,a.id)}</span></button>`).join("");
  const branches = attr.branches.length>1 ? `<div class="seg wide">${attr.branches.map((n,i)=>`<button data-pbranch="${i}" class="${UI.perkBranch===i?"on":""}">${esc(n)}</button>`).join("")}</div>` : "";
  const spent = B.byAttr[attr.id]||0;
  const tierMarks = attr.relic ? "" : `<div class="tiers">${P.tiers.map(t=>`<span class="${av>=t?"on":""}"><b>${t}</b>${P.tierNames[t]}</span>`).join("")}</div>`;
  const bad = c => c<0 ? ' style="color:var(--red)"' : '';
  $("#v-perks").innerHTML = `
  <div class="panel"><div class="ph"><h2>Points</h2><span class="meta">level ${B.lvl}</span></div><div class="pb">
    <div class="pts"><div><small>Attribute</small><b class="num"${bad(B.attrFree)}>${B.attrSpent}<span>/${B.attrTotal}</span></b></div><div><small>Perk</small><b class="num"${bad(B.perkFree)}>${B.perkSpent}<span>/${B.perkTotal}</span></b></div><div><small>Relic</small><b class="num"${bad(B.relicFree)}>${B.relicSpent}<span>/${B.relicTotal}</span></b></div></div>
    <div class="field" style="border:0;padding-top:4px"><div class="k">Bonus perk points<small>on top of 1 per level: 10 from skills at 15/35, the rest from Perk Shards (count varies by patch)</small></div><div class="v"><input type="number" min="0" max="40" value="${b.bonusPerk===undefined?P.perkBonus:b.bonusPerk}" data-f="bonusPerk" aria-label="Bonus perk points"></div></div>
  </div></div>
  <div class="achips">${chips}</div>
  <div class="panel"><div class="ph"><h2>${esc(attr.name)}</h2><span class="meta"><b class="num">${spent}</b> pts in tree</span></div><div class="pb">
    ${attr.relic ? `<p class="hint" style="margin:0 0 6px">${esc(attr.perPoint)}</p>` : `
    <div class="field" style="border:0;padding-top:2px"><div class="k">${esc(attr.name)} level<small>${esc(attr.perPoint)} · ${esc(attr.skill)} skill</small></div>
      <div class="v"><button class="step" data-attr="${attr.id}" data-d="-1" ${av<=P.attrBase?"disabled":""}>−</button><span class="n num" style="font-size:22px">${av}</span><button class="step" data-attr="${attr.id}" data-d="1" ${av>=P.attrMax?"disabled":""}>+</button></div></div>
    ${tierMarks}`}
    ${branches}
  </div></div>
  <div class="tree" id="tree">${renderTree(attr.id, UI.perkBranch, b)}</div>
  <p class="hint">Tap a node for details and to add or remove points. Removing a core perk clears everything that hangs off it.</p>`;
}
function renderTree(attr, br, b){
  const L=layoutBranch(attr, br, b); const P=DATA.progression; const av=attr==="relic"?99:attrVal(b,attr);
  let s=`<svg viewBox="0 0 ${TREE_W} ${L.h}" width="100%" style="display:block" font-family="inherit">`;
  L.bands.forEach((bd,i)=>{
    const locked = bd.tier>av && attr!=="relic";
    s+=`<rect x="0" y="${bd.top}" width="${TREE_W}" height="${bd.bottom-bd.top}" fill="${i%2?"rgba(91,231,242,.025)":"transparent"}"/>`;
    s+=`<line x1="0" y1="${bd.top+.5}" x2="${TREE_W}" y2="${bd.top+.5}" stroke="var(--line)"/>`;
    const lbl = attr==="relic" ? (["","Emergency Cloaking","Vulnerability Analytics","Jailbreak"][bd.tier]||"") : `${P.tierNames[bd.tier]} · ${attr==="relic"?"":attrMeta(attr).short+" "}${bd.tier}`;
    s+=`<text x="8" y="${bd.top+17}" font-size="11" font-weight="700" letter-spacing="1.2" fill="${locked?"var(--faint)":"var(--cyan)"}">${esc(lbl.toUpperCase())}${locked?"  ·  LOCKED":""}</text>`;
    if(locked) s+=`<rect x="0" y="${bd.top}" width="${TREE_W}" height="${bd.bottom-bd.top}" fill="url(#hatch)" opacity=".5"/>`;
  });
  L.edges.forEach(e=>{
    const pl=perkLevel(b,e.from.p.id), cl=perkLevel(b,e.to.p.id);
    const col = cl?"var(--yellow)":pl?"var(--cyan)":"var(--line2)";
    const y1=e.from.y+e.from.r, y2=e.to.y-e.to.r, ym=Math.min(e.from.y+e.from.r+LABEL_H+4, y2-6);
    const sameBand = e.from.cx0===e.to.cx0 && e.to.row-e.from.row>1;
    let d;
    if(sameBand){ // wrapped row: run a bus down the cluster's outer edge so it can't be read as a link through the row above
      const bx = e.to.x < (e.to.cx0+e.to.cx1)/2 ? e.to.cx0+6 : e.to.cx1-6;
      d=`M${e.from.x},${y1} V${ym} H${bx} V${y2-8} H${e.to.x} V${y2}`;
    } else d=`M${e.from.x},${y1} V${ym} H${e.to.x} V${y2}`;
    s+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="${cl?2:1.5}" ${cl||pl?"":'stroke-dasharray="3 3"'}/>`;
  });
  L.nodes.forEach(n=>{
    const p=n.p, l=perkLevel(b,p.id), g=perkGate(b,p), maxed=l>=p.max;
    const fill = l ? (maxed?"var(--yellow)":"rgba(245,230,13,.18)") : g.ok ? "var(--panel2)" : "var(--panel)";
    const stroke = l ? "var(--yellow)" : g.ok ? "var(--cyan)" : "var(--faint)";
    const txt = l ? (maxed?"#111":"var(--yellow)") : g.ok ? "var(--text)" : "var(--faint)";
    s+=`<g class="node" data-perk="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)}, ${l}/${p.max}">`;
    s+=`<path d="${hexPath(n.x,n.y,n.r+3)}" fill="none" stroke="${stroke}" stroke-opacity=".35" stroke-width="1"/>`;
    s+=`<path d="${hexPath(n.x,n.y,n.r)}" fill="${fill}" stroke="${stroke}" stroke-width="${p.core?2.2:1.6}" ${g.ok||l?"":'stroke-dasharray="4 3"'}/>`;
    if(p.max>1) s+=`<text x="${n.x}" y="${n.y+5}" text-anchor="middle" font-size="${p.core?14:12}" font-weight="700" fill="${txt}">${l}/${p.max}</text>`;
    else if(p.cost) s+=`<text x="${n.x}" y="${n.y+5}" text-anchor="middle" font-size="12" font-weight="700" fill="${txt}">${l?"✓":p.cost}</text>`;
    else s+=`<text x="${n.x}" y="${n.y+5}" text-anchor="middle" font-size="13" font-weight="700" fill="${txt}">${l?"✓":""}</text>`;
    const lines=wrapLabel(p.name, p.core?17:15);
    lines.forEach((ln,i)=>{ s+=`<text x="${n.x}" y="${n.y+n.r+12+i*11}" text-anchor="middle" font-size="10.5" font-weight="${l?700:600}" paint-order="stroke" stroke="var(--panel)" stroke-width="3" stroke-linejoin="round" fill="${l?"var(--yellow)":g.ok?"var(--text)":"var(--faint)"}">${esc(ln)}</text>`; });
    s+=`</g>`;
  });
  s+=`<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#1a2a32" stroke-width="2"/></pattern></defs></svg>`;
  return s;
}
function openPerk(id){
  const b=build(); const p=perk(id); const l=perkLevel(b,id); const g=perkGate(b,p); const a=attrMeta(p.attr);
  const deps = l===1 ? dependents(id).filter(d=>perkLevel(b,d)>0) : [];
  const lvls = p.lv.map((t,i)=>`<div class="lvl ${i<l?"on":""}"><span class="num">${p.max>1?`Lv ${i+1}`:(p.cost?`${p.cost} pt`:"")}</span><span>${esc(t)}</span></div>`).join("");
  openSheet(a.name + (a.relic?"":" · "+DATA.progression.tierNames[p.tier]+" "+p.tier), `
    <div class="detail">
      <div class="name">${esc(p.name)}</div>
      <div class="line"><span>${p.core?"Core perk":"Perk"} · ${p.max>1?`${p.max} levels`:"1 level"}${p.cost?` · ${p.cost} Relic pt${p.cost>1?"s":""}`:""}</span>${p.only?`<span>· only ${esc(p.only)}</span>`:""}</div>
      ${p.req?`<div class="${perkLevel(b,p.req)?"okbox":"warnbox"}" style="margin-top:0">Requires ${esc(perk(p.req).name)}${perkLevel(b,p.req)?" ✓":""}</div>`:""}
      ${!g.ok && (!p.req || perkLevel(b,p.req))?`<div class="warnbox" style="margin-top:0">${esc(g.why)}</div>`:""}
      <div class="lvls">${lvls}</div>
      ${deps.length?`<p class="hint">Removing the last point also clears: ${esc(deps.map(d=>perk(d).name).join(", "))}.</p>`:""}
      <div class="btnrow"><button class="btn pri" data-padd="${id}" ${(!g.ok||l>=p.max)?"disabled":""}>Add point</button><button class="btn warn" data-prem="${id}" ${l?"":"disabled"}>Remove point</button></div>
    </div>`);
}

/* ---------- events ---------- */
export function click(t, b) {
  const ds = t.dataset;
  if (ds.pattr) { UI.perkAttr = ds.pattr; UI.perkBranch = 0; renderPerks(); return true; }
  if (ds.pbranch !== undefined) { UI.perkBranch = +ds.pbranch; renderPerks(); return true; }
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
