# Chromedeck

A completionist companion app for **Cyberpunk 2077, patch 2.31** (Phantom Liberty included), used on a phone or PC while playing. The goal is to have everything the in-game character menus show, plus the tracking the game doesn't do: missables, collectibles, capacity sources, outfits, vehicles and mission order. It should look and feel like it belongs in the game.

The owner has no coding or UI design background. Explain decisions briefly in plain terms, and ask before any choice that changes how the app looks or behaves.

## Platform decisions

- **Installable web app (PWA)**, hosted on GitHub Pages and added to the iPhone home screen. It must work offline and on a PC browser. Home-screen install matters on iPhone because Safari can clear website storage after 7 days without a visit; installed apps are exempt from that.
- **No build step.** Plain HTML, CSS and native ES modules (`<script type="module">`), so editing a file and pushing is the whole deploy. No npm, bundler or framework unless the owner agrees. Only the Google Fonts `Rajdhani` stylesheet loads from outside, plus wiki images (see below).
- **Serve it, don't double-click it.** ES modules don't load from `file://`. Run it locally with `python3 -m http.server` in the repo root.
- **No save-file sync.** The game runs on GeForce Now (no local files) and sometimes on a Steam Deck. Cyberpunk's save format is proprietary and changes with patches, so progress is tracked by hand in the app. Don't build save parsing unless the owner asks again.

## Target layout (migration from `chromedeck.html` in progress)

```
index.html            app shell: header, views, bottom nav, sheet, toast
manifest.webmanifest  PWA install metadata and icons
sw.js                 service worker: offline cache (bump its cache version on every release)
css/                  tokens.css (colors, type), app.css (components)
js/                   app.js (boot, routing), store.js (state and storage), one file per module view
data/                 one ES module per data set, each exporting a plain object or array
```

`chromedeck.html` is the original single-file planner (cyberware, perks, capacity, builds, shards). Until the migration is done it's the reference implementation. Port its logic and data, don't rewrite them from scratch.

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
- User edits to game data are stored as **diffs over the shipped data**, not full copies. That way a data update still reaches users who edited something. (The old single file stored full copies, and the migration must convert them.)

## UI conventions

- Mobile first: design at ~390px wide, bottom navigation, and tap targets of at least 44px. It should also look right on a PC.
- Game-styled look: dark UI, cyan and yellow accents, chamfered panels, the Rajdhani font, rarity colors. Never convey tier, rarity or status by color alone; pair color with text or shape.
- Render with template literals and escape all data and user text (`esc()`). Use delegated event listeners, and one shared bottom sheet for popups.
- There will be more modules than fit in a bottom bar. Use a few top-level tabs that group modules; ask the owner before settling the navigation.

## Roadmap

1. **Foundation:** multi-file PWA, hosting, design system, and a port of the existing planner (capacity, cyberware, perks, builds, shards) with the data moved to `data/`.
2. **Missions and missables:** every Main Job, Side Job and Gig (base game and Phantom Liberty), with:
   - a recommended order for story flow and missable safety, which updates as missions are checked off,
   - manual reordering that warns about risks,
   - the unique items tied to each mission,
   - points of no return, in plain words.
3. **Vehicles and weapons:** unique vehicles and how to unlock them; iconic weapons and where to get them.
4. **Wardrobe:** full clothing list with slot, stats and location (exact where static), plus an outfit builder on the V silhouette.
5. **Other trackers:** capacity sources (already started), Tarot graffiti, Cyberpsycho Sightings, Phantom Liberty airdrops, apartments, romances and endings, achievements, and a completion dashboard.

## Checking changes

There's no test suite. Serve the app locally and use headless Chromium with Playwright (available in cloud sessions; don't run `playwright install`). Check:
- no console errors on load,
- every tab opens,
- state survives a reload,
- an old backup with missing fields still imports,
- the service worker serves the app while offline,
- the layout at 390px wide.
