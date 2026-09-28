# Chromedeck

A completionist companion app for **Cyberpunk 2077, patch 2.31** (Phantom Liberty included), used on a phone or PC while playing. The goal is to have everything the in-game character menus show, plus the tracking the game doesn't do: missables, collectibles, capacity sources, outfits, vehicles and mission order. It should look and feel like it belongs in the game.

The owner has no coding or UI design background. Explain decisions briefly in plain terms, and ask before any choice that changes how the app looks or behaves.

## Platform decisions

- **Installable web app (PWA)**, hosted on GitHub Pages and added to the iPhone home screen. It must work offline and on a PC browser. Home-screen install matters on iPhone because Safari can clear website storage after 7 days without a visit; installed apps are exempt from that.
- **No build step.** Plain HTML, CSS and native ES modules (`<script type="module">`), so editing a file and pushing is the whole deploy. No npm, bundler or framework unless the owner agrees. Only the Google Fonts `Rajdhani` stylesheet loads from outside, plus wiki images (see below).
- **Serve it, don't double-click it.** ES modules don't load from `file://`. Run it locally with `python3 -m http.server` in the repo root, then open `http://localhost:8000`.
- **No save-file sync.** The game runs on GeForce Now (no local files) and sometimes on a Steam Deck. Cyberpunk's save format is proprietary and changes with patches, so progress is tracked by hand in the app. Don't build save parsing unless the owner asks again.

## Layout

```
index.html            app shell: header, sub-tabs, views, bottom nav, sheet, toast
manifest.webmanifest  PWA install metadata and icons
sw.js                 service worker: offline cache (bump CACHE and list new files on every release)
css/                  tokens.css (colors, shape), app.css (components)
js/app.js             boot, navigation (TABS), header, event routing, update banner; APP_VERSION
js/store.js           state `S`, game data `DATA`, storage, data-edit diffs, load/migrate/normalize, validateData
js/rules.js           perk gates and budgets, capacity math
js/journal.js         mission availability, branches, recommended order (plan), reordering, progress
js/ui.js              $, esc, toast, the shared sheet, download/readFile, icons
js/views/weapons.js   Gear › Weapons (list, filters, iconic tracking, detail); exports weaponsFrom() for the Journal
js/views/collection.js  Collection › Vehicles; exports vehiclesFrom() for the Journal and vehicleTally()
js/views/collectibles.js  Collection › Collectibles (Tarot, Cyberpsychos, Airdrops, Relic switch) and Homes; KINDS config, tally()
js/views/overview.js  Collection › Overview: the completion dashboard across Journal, Gear and Collection
js/views/*.js         one module per screen: export a render function plus optional click/input/change handlers that return true when handled
data/index.js         assembles SEED from core.js, perks.js, cyberware.js, missions.js; holds the data `version`
data/missions.js      missionSections + missions (Main Jobs, Side Jobs incl. the wiki's Minor Jobs, Gigs); field meanings are in its header comment
data/weapons.js       every weapon (197, 114 iconic) with stats, where to get it, mission links, picture URL
data/vehicles.js      every ownable car and motorcycle (87) with how to get it, Autofixer price/requirements, specs
data/collectibles.js  Tarot graffiti (26), Cyberpsycho Sightings (17), PL airdrops (16 + 3 treasures), Relic terminals (9), apartments (6 + 4 romance)
data/examples.js      starter builds, used only when there are no saved builds
icons/                icon.svg (source) and rendered PNGs
chromedeck.html       the original single-file planner, kept so old saves can be exported from it; not part of the app
```

Navigation (chosen by the owner, left to right): **Character** (sub-tabs Cyberware, Perks, Capacity, Builds), **Gear** (sub-tabs Weapons, Wardrobe), **Collection** (sub-tabs Overview, Vehicles, Collectibles, Homes), **Journal**, **System**. Character-specific screens stay toward the left. Tabs with sub-tabs remember the last one per tab in `S.ui.subs`. The tab list lives in `TABS` in `js/app.js` and `UI_TABS` in `js/store.js`; keep them in sync. New modules replace the placeholders in `js/views/soon.js`. Only the visible view renders; `renderAll()` redraws nav, header and the current view.

Releasing: bump `APP_VERSION` in `js/app.js` and `CACHE` in `sw.js` together, and add new files to `APP_FILES`. Installed copies show an "Update" banner when a new version is live.

## Data rules (the most important part)

- **Hand-editable.** Data files are plain JS object literals: one entry per line where possible, short keys, and `// ---- Group ----` comments. No computed values or functions in data files. Anything derivable is computed in `js/`.
- **Stable ids.** Saved progress and builds reference entries by string id. Never rename or reuse an id. To retire an entry, remove it and let normalization drop dangling references.
- **Accuracy over coverage.** This is a completionist tool, so a wrong entry is worse than a missing one. Don't write game facts from memory.
  - Every entry for missions, missables, clothing, vehicles and weapons carries `src` (a URL, usually the Cyberpunk Fandom wiki) and `verified` (`true` only once checked against a source or the owner's game).
  - When a source is unclear or conflicts with patch 2.31, leave the entry unverified and tell the owner.
  - Build datasets in batches the owner can spot-check.
- **Game terminology.** Use the in-game names: Main Jobs, Side Jobs, Gigs (fixer jobs), NCPD Scanner Hustles (not tracked), Cyberpsycho Sightings.
- Paraphrase effect text, with ranges written lowest to highest tier (`+15–35%`).
- Bump the data file's `version` string whenever its contents change.

## Images

- **No game art in the repo.** The avatar is a stylized male/female V silhouette with the same equipment slots as the game.
- Item pictures (mainly clothing) are loaded at view time from the Cyberpunk wiki URL stored on the entry (`img`). They're cached on the device for offline use, never committed. Each one is credited "Image: Cyberpunk Wiki / CD PROJEKT RED". If an image fails to load, show a slot icon.
- This relies on CD PROJEKT RED's [Fan Content Guidelines](https://www.cdprojektred.com/en/fan-content). The app must stay free and non-commercial, and shows a footer disclaimer that it's an unofficial fan project.

## State and storage

- One `localStorage` key, **`chromedeck.v1`**, holds the whole state. Access it only through `js/store.js`, which falls back to memory when storage is blocked.
- Mutations autosave. Keep export/import of a full JSON backup, because storage on iPhone can still be lost.
- Per-build data (attributes, perks, equipped cyberware, outfit) lives on the build. Per-playthrough progress (shards, missions, missables, vehicles, collected clothing) lives under `playthrough`.
- New fields get defaults in normalization, which runs after load, import and data edits. For shape changes, write a one-time migration (see `migrateFlags()` in `chromedeck.html`). Don't change the storage key.
- User edits to game data are stored in `S.dataEdits` as **diffs over SEED** (`{key:{set:{id:entry},del:[ids]}}` for id'd lists, `{key:{replace:value}}` otherwise), so data updates still reach users for everything they didn't edit. Old v1 saves with a full `dataOverride` are converted on load. If edits stop validating against new data, they're set aside (`S.dataEditsSetAside`) and the user is told.
- UI position is kept in `S.ui` (`tab`, and `subs` per tab). v0.3.0 saves with a single `sub` or the old Wardrobe tab are migrated in `normalize()`.

## Perk and cyberware data

- Both were checked field by field against the wiki on 2026-09-28. Cyberware matched completely; perks had 13 prerequisite fixes and one level-count fix.
- A perk's `req` is one id, a list (all required, per the wiki's "after unlocking A and B"), or null. Always read it through `reqsOf()` in `js/rules.js`. Every multi-parent perk bridges two neighbouring branches.
- Entries the wiki contradicts itself on keep the app's value with `verified:false` and a `check` note, which shows in the perk's details. Don't "fix" those from the wiki without resolving the contradiction.
- `get` on cyberware = where to get it, only when more specific than "Ripperdocs". `src` = wiki page.
- `normalize()` caps saved perk levels at the current max and drops perks that no longer exist.

## Journal rules

- Mission ids are the game's internal quest ids (the wiki's "BaseID"). Data comes from each mission's wiki infobox (previous/next quest, giver, district, rewards with "(missable)" flags); keep that as the source.
- `after` = all required, `any` = one of these is enough. Wiki "previous quest" lists mean either, depending on the mission: check the page before deciding.
- Story branches are `branch:[choice, value]`, driven by `S.playthrough.choices` (lifepath, pl, plEnd). Checking off a branch mission sets the choice.
- The point-of-no-return mission (`pnr`) only affects the recommended order and warnings. Availability ("Locked / Available") uses the game's real requirements only.
- Progress: done missions in `S.playthrough.missions` ({id: timestamp}); a custom order in `S.playthrough.order` (empty = recommended).
- "Done, plus everything before it" marks the mission's transitive requirements, never unrelated side content or estimated anchors.
- Side jobs have no `sec`; section headers follow the main story. With no custom order, ready side jobs are placed before the next main job (do side content as it unlocks); finished missions are listed first, in story order.
- `before:[ids]` = deadline: the mission is lost once any of those is done (shown as Missed). Only add deadlines the wiki states ("becomes unavailable after…", "fails if not completed before…").
- Side jobs with no wiki prerequisite get an estimated anchor in `anchorOf()` (Watson → The Rescue, rest of the city → Playing for Time, Phantom Liberty → Dog Eat Dog). It's labelled as an estimate, never auto-marked done, and never written into the data.
- `ext` = requirements the app can't track yet (text). Missions with `ext` never show as available.
- Lifepath-only side jobs use `branch:["lifepath", …]`.
- Gigs: `giver` = fixer, `tier` = fixer tier. Gigs whose wiki page lists predecessors use those as `after`; the rest unlock when every gig of the fixer's previous tier (same fixer and district) is done, computed by `tierReqs()`. Tier-1 gigs get the estimated anchor. Fixer thank-you side jobs (Last Call etc.) list all of that fixer's gigs in `after`.
- Act 2's concurrent threads are drawn as lanes in `threadCard()` (js/views/journal.js): Evelyn → Voodoo Boys (paths evelyn + alt, one sequential lane), Hellman, Takemura. Cross-thread requirements are listed under the card. Story sections can interleave in the plan (Phantom Liberty opens mid-Act 2), so a resumed section gets a "(continued)" header.
- The list has a search box (name, giver, line, district, objective; includes finished and missed) and two layouts: **Order** (recommended order with story headers) and **By storyline** (collapsible groups from `groupOf()`, ordered by `groupRank()`; open groups remembered in `S.ui.journal.open`). Typing only redraws `#jList` so the search box keeps focus.
- System › "To check in game" lists every entry with `verified:false` plus `GENERAL_CHECKS` (rules not tied to one entry). When the owner answers one, fix the data and drop the flag.

## Weapon data

- From each weapon page's `Infobox Weapon2077` (grenades: `Infobox Grenade`); `get` = the infobox source, or the page's Acquisition section when the source says "See acquisition".
- `from` links to mission ids (source names, plus exact case-sensitive mission names found in the acquisition text). `miss` = the source says missable or the linked mission flags that item missable. `lowe` = the text says Herold Lowe (Dogtown) sells it if missed — shown as "missable*", not "lost for good".
- Owned iconics: `S.playthrough.weapons` ({id: timestamp}). Mission details list the iconics a mission gives (`weaponsFrom`).
- Pictures are wiki CDN URLs (`img`), loaded when viewed and cached by the service worker; the view falls back to a placeholder when offline and uncached.

## Vehicle data

- From the wiki "Cyberpunk 2077 Vehicles" page's Ownable Vehicles tables (source + notes) and each vehicle's `Infobox Vehicle`. No game ids exist, so `id` is built from the name; never change it.
- `from` links to missions; `dep` = the reward depends on a choice (note says what); lifepath-only via `branch`. Owned: `S.playthrough.vehicles`.

## Collectibles data

- `data/collectibles.js`, from the wiki pages in each `src` (Tarot Cards, Fool on the Hill, Psycho Killer + each Cyberpsycho Sighting page, Airdrops, Relic (attribute), Apartments + Welcome Home pages).
- Progress per playthrough: `tarot`, `psychos`, `psychoKilled` ({id: true}, Regina wants them alive), `airdrops`, `relic`, `apartments`, each {id: timestamp}. UI: `S.ui.collect` (`kind`, `hideDone`).
- `after` = missions required (linked, not enforced); `near` = missions set at that spot; `need` = other requirement as text. Cyberpsycho ids are the game's quest ids; rentals use theirs (dlc6_apart_*).
- Airdrops: the one-time (metaquest) drops are lost if left to despawn (wiki), so they show as Missable. `wpn` links iconic weapon ids; `rtt` = contents change after Run This Town.
- Apartments with `dep` (romance places) are listed but not counted. The Overview counts only what `applies` to this run.

## UI conventions

- Mobile first: design at ~390px wide, bottom navigation, and tap targets of at least 44px. It should also look right on a PC.
- Game-styled look: dark UI, cyan and yellow accents, chamfered panels, the Rajdhani font, rarity colors. Never convey tier, rarity or status by color alone; pair color with text or shape.
- Render with template literals and escape all data and user text (`esc()`). Use delegated event listeners, and one shared bottom sheet for popups.
- Keep the bottom bar at five tabs so labels stay readable on a phone; add new modules as sub-tabs. Ask the owner before changing the navigation.

## Roadmap

1. **Foundation (done):** multi-file PWA, design system, and a port of the existing planner (capacity, cyberware, perks, builds, shards) with the data moved to `data/`. Hosting is still pending: GitHub Pages needs the repo to be public.
2. **Missions and missables:** every Main Job, Side Job and Gig (base game and Phantom Liberty). Done: Main Jobs (64), Side Jobs (133: the wiki's 46 Side Jobs + 87 Minor Jobs, all under Side Jobs in the game) and Gigs (81, incl. 9 Phantom Liberty). NCPD Scanner Hustles are deliberately not tracked. Features:
   - a recommended order for story flow and missable safety, which updates as missions are checked off,
   - manual reordering that warns about risks,
   - the unique items tied to each mission,
   - points of no return, in plain words.
3. **Weapons and vehicles (done):** Gear › Weapons and Collection › Vehicles.
4. **Wardrobe (Gear › Wardrobe):** full clothing list with slot, stats and location (exact where static), plus an outfit builder on the V silhouette.
5. **Collection:** done: vehicles, Tarot graffiti, Cyberpsycho Sightings, Phantom Liberty airdrops, Relic terminals, apartments, and the completion dashboard (Overview). Still to do: romances, achievements.

## Checking changes

There's no test suite. Serve the app locally and use headless Chromium with Playwright (available in cloud sessions; don't run `playwright install`; load it with `NODE_PATH=$(npm root -g)` from a `.cjs` script). In cloud sessions Google Fonts is blocked for the browser, so screenshots use a wider fallback font; download the font with curl and serve it through `context.route` if the look matters. Check:
- no console errors on load,
- every tab opens,
- state survives a reload,
- an old backup with missing fields still imports,
- the service worker serves the app while offline,
- the layout at 390px wide.
