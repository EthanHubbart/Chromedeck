/* ============================ offline pictures ============================
   "Save all pictures": downloads every wiki picture the app can show into the
   same cache the service worker fills as you browse, so they're all there
   without signal. Pictures already saved are skipped, so stopping and starting
   again carries on where it left off.
   ========================================================================= */
import { DATA } from "./store.js";
import { wikiThumb } from "./ui.js";

const CACHE = "chromedeck-images-2";   // must match IMAGES in sw.js
const AT_ONCE = 4;                     // downloads in parallel
// rough size of one picture per list (KB), measured on the wiki at the reduced width; only for the estimate
const AVG_KB = { weapons: 8, vehicles: 30, tarot: 120 };

/* Every picture URL the app shows, as it asks for it (the reduced-width copy).
   New lists with pictures get added here. */
function pictures() {
  const out = new Map();   // url -> list key
  for (const k of Object.keys(AVG_KB)) for (const x of DATA[k] || []) if (x.img) out.set(wikiThumb(x.img), k);
  return out;
}
export const allPictures = () => [...pictures().keys()];

export const supported = () => "caches" in window;

/* How many are saved on this device already. */
export async function status() {
  const pics = pictures(); const have = new Set();
  if (supported()) (await (await caches.open(CACHE)).keys()).forEach(r => have.add(r.url));
  const missing = [...pics].filter(([u]) => !have.has(u));
  return { total: pics.size, saved: pics.size - missing.length, missingMB: missing.reduce((s, [, k]) => s + AVG_KB[k], 0) / 1024 };
}

/* Storage this app uses on the device (app files + pictures + saves), in MB, when the browser says. */
export async function usedMB() {
  try { const e = await navigator.storage.estimate(); return e.usage ? e.usage / 1048576 : null; } catch (e) { return null; }
}

let stopFlag = false, running = false;
export const isRunning = () => running;
export const stop = () => { stopFlag = true; };

/* Download what's missing. onProgress({done, total, failed, bytes}) after each picture. */
export async function saveAll(onProgress) {
  if (running || !supported()) return;
  running = true; stopFlag = false;
  const cache = await caches.open(CACHE); const have = new Set((await cache.keys()).map(r => r.url));
  const todo = allPictures().filter(u => !have.has(u));
  const p = { done: 0, total: todo.length, failed: 0, bytes: 0 };
  let next = 0;
  async function worker() {
    while (!stopFlag && next < todo.length) {
      const url = todo[next++];
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
        // no referrer: Fandom answers other sites' referrers with a "not found" placeholder
        const r = await fetch(url, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", signal: ctl.signal }).finally(() => clearTimeout(t));
        if (!r.ok) throw new Error(r.status);
        const blob = await r.clone().blob(); p.bytes += blob.size;
        // the service worker usually stores it on the way through; store it here if it didn't
        if (!(await cache.match(url))) await cache.put(url, r);
      } catch (e) { p.failed++; }
      p.done++; onProgress(p);
    }
  }
  try { await Promise.all(Array.from({ length: AT_ONCE }, worker)); }
  finally { running = false; }
  return p;
}

export async function removeAll() { if (supported()) await caches.delete(CACHE); }
