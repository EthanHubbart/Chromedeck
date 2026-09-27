# Chromedeck

An unofficial, free companion app for **Cyberpunk 2077** (patch 2.31, Phantom Liberty included). Plan cyberware, perks and capacity, save builds, and track capacity shards. Missions, collectibles and a wardrobe are on the way.

It's an installable web app. It works offline, and on iPhone you can add it to the Home Screen from Safari's Share menu.

## Run it locally

```
python3 -m http.server
```

Then open http://localhost:8000. Opening `index.html` by double-clicking doesn't work, because browsers block the app's scripts from `file://`.

## Editing game data

Game data lives in `data/` as plain, commented JavaScript: one entry per line. Keep `id`s stable, because saved builds use them. After changing a data file, bump `version` in `data/index.js`. See `CLAUDE.md` for the full conventions.

Not affiliated with or endorsed by CD PROJEKT RED.
