# Chromedeck

A completionist tool for **Cyberpunk 2077, patch 2.31** (Phantom Liberty included). Today it's a cyberware, perk and capacity build planner. The roadmap below expands it into a full completionist companion.

## Hard constraints

- **One file.** Everything lives in `chromedeck.html`: markup, CSS, JS and game data. No build step, no bundler, no npm, no split-out `.js`/`.css`/`.json` files. The only external request is the Google Fonts `Rajdhani` stylesheet. Don't add more CDN dependencies without asking.
- **Data stays hand-editable.** Game data is a plain JS object literal (`SEED`) that someone can open in a text editor and fix after a patch. Keep it that way:
  - One entry per line, short keys, grouped under `// ---------- Group ----------` / `// ============ GROUP ============` comments.
  - Literal values only inside `SEED`: no computed fields, functions, or references between entries other than string ids.
  - Anything derivable (totals, lookups, flags) is computed in code, not stored in the data.
  - Effects are paraphrased, with ranges written lowest–highest tier (e.g. `+15–35%`). Use `\n` for a second line.
- **Patch accuracy.** Data targets 2.31. When unsure about a game fact (cost, drop location, missable condition), say so and ask rather than guessing, and prefer sources like the official patch notes or the Cyberpunk wiki. Bump `SEED.version` when seed data changes.

## Layout of `chromedeck.html`

| Part | Notes |
|---|---|
| `<style>` | CSS tokens on `:root` (dark-only theme; rarity colors `--r-*`). Sections are marked `/* ---------- name ---------- */`. |
| HTML skeleton | Header (build select, Save, capacity gauge), five empty `<section class="view" id="v-*">`, bottom `nav.tabs`, one shared `#sheet` dialog, `#toast`. |
| `SEED` | Game data: `slots`, `capacity`, `shards`, `attributes`, `progression`, `perks`, `cyberware`. |
| `EXAMPLE_BUILDS` | Starter builds, used only when there are no saved builds. |
| Script sections | Marked `/* ==== name ==== */`: perks: rules → perks: layout → storage → rules → ui helpers → render → sheet → actions. Boot is `loadState(); renderAll();` at the end. |

Patterns to follow:
- **Rendering:** each tab has a `renderX()` that rebuilds its section with template literals and `innerHTML`. `renderAll()` calls them all. Pass every piece of data or user text through `esc()`.
- **Events:** one delegated `click` listener routes on `data-*` attributes or element ids. `input` / `change` / `keydown` listeners are also delegated. Add new actions there rather than attaching per-element listeners.
- **Popups** go through `openSheet(title, html)` / `closeSheet()`. Don't create new modal elements.
- **Accessibility:** never convey tier or rarity by color alone (see `tierBadge`: text + shape). Keep `aria-label`s on views, and give inputs labels.
- **Mobile first:** `main` is max 720px wide and the tab bar is fixed at the bottom. Test at phone width.

## State and storage

- One `localStorage` key, **`chromedeck.v1`**, holds the whole state `S`: `{ builds[], active, playthrough:{shards}, dataOverride }`. Access it only through `store.get/set`, which falls back to memory when storage is blocked.
- Mutations call `save(true)` (silent autosave). The header Save button is `save()` with a toast.
- Builds reference game data **by id** (`equipped: {slot:[cyberwareId|null]}`, `perks: {perkId: points}`). **Never rename or reuse a seed id.** Saved builds and exports depend on them. To retire an item, remove it and let `normalize()` drop the dangling references.
- New state fields: give them a default in `newBuild()` (per-build) or `normalize()` (global/playthrough). `normalize()` runs after load, import and data edits, and backfills old saves. For shape changes, write a one-time migration like `migrateFlags()`. Don't change `KEY`.
- Per-playthrough progress (shard counts, and later collected weapons, missables, missions) goes under `S.playthrough`, not on a build.
- **Known caveat:** `S.dataOverride` is a *full copy* of `DATA`, not a diff. A user who has edited data never sees new `SEED` collections or fixes. When adding a new top-level collection, make `loadState()` backfill any collection missing from the override using `SEED`. Consider switching to a diff-based override before the data grows much bigger.
- Export formats: `{chromedeck:1, build}` (one build), `{chromedeck:1, state}` (full backup), raw `DATA` (data only). Keep importers backward-compatible.

## Roadmap (build in this order)

1. **Weapons**: a `SEED.weapons` collection, including iconics.
2. **Missables**: items, iconics, rewards and choices that are lost after a point of no return. Each entry needs the condition and deadline in plain words.
3. **Complete mission guide**: main jobs, side jobs and gigs, including Phantom Liberty. This is where missables and weapons get cross-linked by id.

For each new module:
- Add a `SEED` collection following the data rules above. Add it to `validateData()`, to the Data tab counts in `renderData()`, and to the `loadState()` override backfill.
- Store progress checkmarks in `S.playthrough`, with defaults in `normalize()`.
- Add a view `<section>`, a `renderX()` wired into `renderAll()`, and a nav button. **The tab bar is hard-coded to `repeat(5, …)` columns**, so adding tabs means changing that grid or grouping modules. Ask before choosing a navigation approach.
- Update the example builds or backups only if the schema requires it.

## Checking changes

There's no test suite. To check a change, open `chromedeck.html` in a browser. Headless Chromium and Playwright are available in cloud sessions, so a quick smoke check can load the file, confirm there are no console errors, click through every tab, and reload to confirm state persisted. Also test:
- an old backup with missing fields (it should normalize),
- the Data tab's Apply and Reset buttons,
- phone width (~390px).
