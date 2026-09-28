/* ============================ ui helpers ============================ */
export const $ = (q, el = document) => el.querySelector(q);
export const $$ = (q, el = document) => [...el.querySelectorAll(q)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let toastT;
export function toast(m, ms = 1600) {
  const t = $("#toast"); t.textContent = m; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), ms);
}

export function tierBadge(it) { return `<span class="tb t${it.tier}${it.iconic ? " ic" : ""}" title="${it.iconic ? "Iconic, " : ""}tier ${it.tier} and up">T${it.tier}</span>`; }
export function rarityName(t) { return ["", "Common", "Uncommon", "Rare", "Epic", "Legendary"][t] || ""; }
export function firstLine(s) { return (s || "").split("\n")[0]; }
/* ---- wiki pictures ----
   Fandom's image server refuses requests that say they come from another site (it answers
   with a "not found" placeholder), so pictures load with no referrer. They're also asked for
   at a reduced width, which is a fraction of the download on a phone connection. */
export function wikiThumb(url, w = 400) {
  return /\/revision\/latest(?!\/scale)/.test(url) ? url.replace("/revision/latest", `/revision/latest/scale-to-width-down/${w}`) : url;
}
export function wikiImg(url, alt, cls = "") {
  return `<figure class="wimg ${cls}"><img src="${esc(wikiThumb(url))}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')"><figcaption>Image: Cyberpunk Wiki / CD PROJEKT RED</figcaption></figure>`;
}
export function groupBy(arr, f) { const m = new Map(); arr.forEach(x => { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; }

/* ---- the one shared bottom sheet ---- */
let lastFocus = null;
export function openSheet(title, html) {
  if (!$("#sheet").classList.contains("on")) lastFocus = document.activeElement;
  $("#sheetTitle").textContent = title; $("#sheetBody").innerHTML = html;
  $("#sheet").classList.add("on"); $("#scrim").classList.add("on"); $("#sheet").setAttribute("aria-hidden", "false");
  $("#sheetBody").scrollTop = 0;
  if (window.innerWidth > 720) $("#sheetClose").focus({ preventScroll: true });
}
export function closeSheet() {
  $("#sheet").classList.remove("on"); $("#scrim").classList.remove("on"); $("#sheet").setAttribute("aria-hidden", "true");
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}
export const sheetOpen = () => $("#sheet").classList.contains("on");

/* ---- files ---- */
export function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 500);
}
export function readFile(inp, cb) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { let obj; try { obj = JSON.parse(r.result); } catch (e) { toast("That file isn't valid JSON"); return; } cb(obj); };
  r.readAsText(f); inp.value = "";
}
export function safeName(s) { return s.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "build"; }

/* ---- small inline icons (stroke = currentColor) ---- */
const P = {
  character: '<path d="M12 3l7 4v10l-7 4-7-4V7z"/><circle cx="12" cy="10" r="2.6"/><path d="M8.2 16.2c.9-1.9 2.2-2.8 3.8-2.8s2.9.9 3.8 2.8"/>',
  journal: '<path d="M6 3h10l3 3v15H6z"/><path d="M9 9h7M9 13h7M9 17h4"/>',
  collection: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
  gear: '<path d="M3 7h16l2 2v3h-9l-1.5 1.5L9 20H5l1.5-8H3z"/><path d="M12 12v2.5h-2.2"/><path d="M19 7V5.5"/>',
  system: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
export const icon = (name, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${P[name] || ""}</svg>`;
