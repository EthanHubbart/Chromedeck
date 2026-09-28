/* =====================================================================
   SEED — the game data the app ships with, assembled from the files in
   data/. Bump `version` whenever any data file changes. Users' own edits
   (Data tab) are stored as differences on top of this, so updates here
   still reach them for everything they haven't edited.
   ===================================================================== */
import { core } from "./core.js";
import { perks } from "./perks.js";
import { cyberware } from "./cyberware.js";
import { missions, missionSections } from "./missions.js";
import { weapons } from "./weapons.js";
import { vehicles } from "./vehicles.js";
import { tarot, cyberpsychos, airdrops, relicTerminals, apartments } from "./collectibles.js";

export const SEED = {
  version: "2.31 seed 2026-09-28 · collectibles",
  ...core,
  perks,
  cyberware,
  missionSections,
  missions,
  weapons,
  vehicles,
  tarot,
  cyberpsychos,
  airdrops,
  relicTerminals,
  apartments
};

