/* ============================ Coming-soon tabs ============================
   Placeholders so the navigation shows the whole plan. Each gets replaced by
   its real module (see the roadmap in CLAUDE.md).
   ========================================================================= */
import { $, esc } from "../ui.js";

const PLANS = {
  collection: {
    title: "Collection", next: "Planned",
    lead: "Everything collectible, with where and how to get it.",
    items: ["Unique vehicles and how to unlock them", "Tarot graffiti, Cyberpsycho Sightings, Phantom Liberty airdrops", "Apartments, romances and endings", "A completion dashboard across everything, iconic weapons included"]
  },
  wardrobe: {
    title: "Wardrobe", next: "Planned",
    lead: "Plan outfits on a V silhouette and see where to find each piece.",
    items: ["Complete clothing list by slot, with stats", "Where each piece is found — exact spots for static loot", "Wiki images to see what goes together", "Save outfits and mark pieces you own"]
  }
};

export function renderSoon(id) {
  const p = PLANS[id];
  $("#v-" + id).innerHTML = `
  <div class="panel soon"><div class="ph"><h2>${esc(p.title)}</h2><span class="meta"><span class="pill on">${esc(p.next)}</span></span></div><div class="pb">
    <p style="margin:2px 0 10px">${esc(p.lead)}</p>
    <ul class="plan">${p.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
  </div></div>`;
}
