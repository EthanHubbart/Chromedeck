/* ============================ Character › Capacity ============================
   Where cyberware capacity comes from, the character inputs that feed it, and
   the playthrough shard tracker.
   ============================================================================= */
import { DATA, S, current, isLive, build, save } from "../store.js";
import { calc, derived } from "../rules.js";
import { $, esc, groupBy } from "../ui.js";
import { renderAll, renderHeader, go } from "../app.js";
import { UI as PERK_UI } from "./perks.js";

export function renderCapacity(){
  const b = current(); const r = calc(b); const C = DATA.capacity;
  const shardCards = groupBy(DATA.shards, s=>s.group);
  let shardHtml = "";
  for(const [g, list] of shardCards){
    shardHtml += `<div class="panel"><div class="ph"><h2>${esc(g)}</h2><span class="meta"><b class="num">${list.reduce((a,s)=>a+s.each*Math.min(S.playthrough.shards[s.id]||0,s.max),0)}</b> / ${list.reduce((a,s)=>a+s.each*s.max,0)}</span></div><div class="pb">` +
      list.map(s=>{
        const n = Math.min(S.playthrough.shards[s.id]||0, s.max);
        const pips = Array.from({length:s.max},(_,i)=>`<i class="${i<n?"on":""}${s.pl?" pl":""}"></i>`).join("");
        return `<div class="shard"><div class="k"><b>${esc(s.name)}</b><small><span class="num" style="color:var(--cyan);font-weight:700">+${s.each} each.</span> ${esc(s.note)}</small><div class="pips">${pips}</div></div>
          <div class="v"><button class="step" data-shard="${s.id}" data-d="-1" ${n<=0?"disabled":""}>−</button><span class="n num">${n}/${s.max}</span><button class="step" data-shard="${s.id}" data-d="1" ${n>=s.max?"disabled":""}>+</button></div></div>`;
      }).join("") + `</div></div>`;
  }
  const engIdx = (b.engineering|0)>=30?2:(b.engineering|0)>=10?1:0; const D=derived(b);
  $("#v-capacity").innerHTML = `
  <div class="panel"><div class="ph"><h2>Capacity sources</h2><span class="meta">${isLive()?"live, this save":"this build"}</span></div><div class="pb">
    ${isLive()?(()=>{ const pb=build(), pr=calc(pb); return `<p class="hint goalline" style="margin:0 0 6px">◆ Planner "${esc(pb.name)}" needs ${pr.used} of ${pr.normal} capacity at level ${pr.lvl}; you have ${r.normal} now.</p>`; })():""}
    <table class="sum">
      <tr><td>Level ${r.lvl} <span class="hint">(${C.base} + ${C.perLevel} × level)</span></td><td class="num">${r.base}</td></tr>
      <tr class="${r.eng?"":"dim"}"><td>Engineering skill</td><td class="num">+${r.eng}</td></tr>
      <tr class="${r.ren?"":"dim"}"><td>Renaissance Punk</td><td class="num">+${r.ren}</td></tr>
      <tr class="${r.shards.used?"":"dim"}"><td>Capacity shards <span class="hint">(${b.shardMode==="max"?"assuming all found":"as tracked below"})</span></td><td class="num">+${r.shards.used}</td></tr>
      <tr class="${r.cc?"":"dim"}"><td>Chrome Compressor</td><td class="num">+${r.cc}</td></tr>
      <tr class="total"><td>Capacity</td><td class="num">${r.normal}</td></tr>
      <tr class="${r.over?"":"dim"}"><td>Edgerunner overcap <span class="hint">(−0.5% max health per point used)</span></td><td class="num">+${r.over}</td></tr>
      <tr class="${r.invalid?"bad":""}"><td>Installed</td><td class="num">${r.used}</td></tr>
    </table>
    ${r.normal>=C.hardCap?`<div class="okbox">Hard cap of ${C.hardCap} reached.</div>`:""}
  </div></div>

  <div class="panel"><div class="ph"><h2>Character</h2></div><div class="pb">
    <div class="field"><div class="k">Level<small>${C.minLevel}–${C.maxLevel} · also sets attribute and perk budgets</small></div><div class="v"><input type="range" min="${C.minLevel}" max="${C.maxLevel}" value="${r.lvl}" data-f="level" aria-label="Level"><span class="n num" id="lvlN">${r.lvl}</span></div></div>
    <div class="field"><div class="k">Engineering skill<small>+5 at 10, +10 at 30</small></div><div class="v"><div class="seg" data-f="engineering">
      <button data-v="0" class="${engIdx===0?"on":""}">&lt;10</button><button data-v="10" class="${engIdx===1?"on":""}">10</button><button data-v="30" class="${engIdx===2?"on":""}">30</button></div></div></div>
    <div class="field"><div class="k">Chrome Compressor bonus<small>only counts while it's in the OS slot. T2 40 … T5++ 70</small></div><div class="v"><input type="number" min="40" max="70" step="1" value="${b.ccBonus}" data-f="ccBonus" aria-label="Chrome Compressor bonus"></div></div>
    ${isLive()?"":`<div class="field"><div class="k">Shards in this build<small>plan against the maximum, or against what you've actually found</small></div><div class="v"><div class="seg" data-f="shardMode"><button data-v="max" class="${b.shardMode==="max"?"on":""}">Max</button><button data-v="tracked" class="${b.shardMode==="tracked"?"on":""}">Tracked</button></div></div></div>`}
  </div></div>

  <div class="panel"><div class="ph"><h2>Perks that change capacity</h2><span class="meta">from the Perks tab</span></div><div class="pb">
    ${[
      ["Renaissance Punk", D.renPunk, `Tech 9 · +${C.renaissancePerAttr} per attribute at 9+ (${D.renAttrs} now)`],
      ["All Things Cyber rank 2", D.atc>=2, `Tech 9 · −${C.allThingsCyberPct}% cost on Skeleton and Integumentary`],
      ["License to Chrome rank 3", D.licenseToChrome, "Tech 15 · +1 Skeleton slot"],
      ["Ambidextrous", D.ambidextrous, "Tech 15 · +1 Hands slot"],
      ["Edgerunner", D.edgerunner, `Tech 20 · up to +${C.edgerunner} over capacity`]
    ].map(([n,on,sub])=>`<div class="field"><div class="k">${n}<small>${sub}</small></div><div class="v"><span class="pill ${on?"on":""}">${on?"Taken":"Not taken"}</span></div></div>`).join("")}
    <div class="btnrow"><button class="btn" id="goTech">Open Technical Ability tree</button></div>
  </div></div>

  <div class="panel"><div class="ph"><h2>Shard tracker</h2><span class="meta">playthrough · <b class="num">${r.shards.tracked}</b> / ${r.shards.max}</span></div><div class="pb"><p class="hint" style="margin:0 0 4px">Shared across builds — this is your current playthrough, not the plan. Drops are random but capped per tier and rate-limited by level, so keep looting bodies and containers until each row is full.</p></div></div>
  ${shardHtml}`;
}

/* ---------- events ---------- */
export function click(t, b) {
  const ds = t.dataset;
  if (t.id === "goTech") { PERK_UI.perkAttr = "tech"; PERK_UI.perkBranch = 1; go("character", "perks"); return true; }
  if (ds.shard) { const sh = DATA.shards.find(x => x.id === ds.shard); const cur = S.playthrough.shards[sh.id] || 0; S.playthrough.shards[sh.id] = Math.max(0, Math.min(sh.max, cur + +ds.d)); save(); renderHeader(); renderCapacity(); return true; }
  if (ds.v !== undefined) { const seg = t.closest(".seg"); const f = seg.dataset.f; b[f] = f === "shardMode" ? ds.v : parseInt(ds.v); b.updated = Date.now(); save(); renderHeader(); renderCapacity(); return true; }
  return false;
}
export function input(t, b) {
  if (t.dataset.f === "level") { b.level = +t.value; $("#lvlN").textContent = b.level; b.updated = Date.now(); renderHeader(); return true; }
  if (t.dataset.f === "ccBonus") { b.ccBonus = Math.max(0, parseInt(t.value) || 0); b.updated = Date.now(); renderHeader(); return true; }
  return false;
}
export function change(t) {
  if (t.dataset.f === "level" || t.dataset.f === "ccBonus") { save(); renderAll(); return true; }
  return false;
}
