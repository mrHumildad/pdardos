---
name: capacitor-android-app
description: Use when scaffolding, building, verifying or changing this React + Capacitor Android app (Vite, plain JavaScript, native Android project). Covers setup, build/sync commands, the mobile-first unit rules, the headless verification workflow, and the rule to never add UI content the user did not ask for.
---

# React + Capacitor Android app

A Vite + React (JavaScript, no TypeScript) web app wrapped by Capacitor 8, with a
generated native Android project in `android/`. The app opens on a **main menu**,
leads to the setup screen and then to the darts **Cricket** scoring screen — see
the `darts-cricket-screen` skill for that screen's spec.

## Content rule

**Do not add UI text, screens, sample data, headings, placeholders, controls or
demo components the user did not explicitly ask for.** Build exactly what a
request names, nothing "for example" or "to get started". When a request is
ambiguous, implement the unambiguous part and ask about the rest instead of
inventing content (e.g. icon labels, legend columns).

## Units rule

The layout is mobile first and uses responsive units only:

- viewport heights in `dvh` (never `vh`/`px` for page regions),
- grid proportions in `fr`,
- icon and gap sizes in `em`,
- font sizes in `clamp(rem, vw, rem)`.

No fixed `px` sizes in CSS (SVG `viewBox` coordinates are the only exception).
Global `box-sizing: border-box` lives in `src/index.css`; `#app` must never get a
fixed width.

## Colour palette (mandatory)

Screens and new UI follow the `pub-darts-style` skill: full-bleed flush regions,
checkboard cells, `currentColor` rules, no radii. All colours live as custom properties in `src/index.css` and **nothing outside
that block may contain a literal colour** (no hex, no `rgba()`). Need a new
shade? Add it to the palette with a humorous pub-darts name first, then use it.

| token | value | used for |
| --- | --- | --- |
| `--pub-carpet-violet` | `#4f46e5` | header |
| `--flat-lager-teal` | `#0f766e` | marker board |
| `--last-orders-teal` | `#134e4a` | marker alternate rows |
| `--flight-tint` | `rgba(255,255,255,0.08)` | marker cell tint |
| `--chalk-line` | `#ecfdf5` | text on the marker |
| `--bounce-out-amber` | `#b45309` | scorer board |
| `--double-bull-red` | `#d7263d` | the double-bull dot |
| `--bounce-out-amber-deep` | `#92400e` | player 2 shaded rows |
| `--pub-carpet-violet-deep` | `#3730a3` | player 3 shaded rows |
| `--double-bull-red-deep` | `#991b1b` | player 4 shaded rows |
| `--spectator-grey` / `--spectator-grey-deep` | `#6b7280` / `#4b5563` | players not throwing |
| `--chalkboard-white` | `#fff7ed` | text on the scorer |
| `--black-dog-black` | `#111` | black cells in marker rows 1–2 |
| `--beer-foam-white` | `#fff` | white cells in marker rows 1–2 |
| `--bar-mat` / `--bar-mat-ink` | `#fff` / `#111` | page surface and text (light) |
| `--pub-dark` / `--chalk-dust` | `#16171d` / `#f3f4f6` | page surface and text (dark) |

The four score-board columns use one pair each: `--player-one-*` …
`--player-four-*`, `var()` aliases of the tokens above, applied per cell by
`playerPalette(index, throwing)` in `src/CricketScreen.jsx`. Only the throwing
player shows their pair; the others get `--spectator-grey` /
`--spectator-grey-deep`.

## Files

- `src/main.jsx` — mounts React, sets the native status bar style on device.
- `src/App.jsx` — screen state (`menu` → `setup` → `game`), the back handling,
  and the game data; the game is kept when you return to the menu so Continue
  resumes it.
- `src/MainMenu.jsx` — logo placeholder and the New game / Continue / Players
  buttons; Continue is only rendered when a game is in progress. Players opens
  the players screen.
- `src/ConfigScreen.jsx` — Cricket setup: player count, variant, names, start.
- `src/PlayersScreen.jsx` — saved players list (each row deletable) plus name,
  auto-filled/editable short and kit picker, with a back cell in the title bar;
  stored under `darts.players`.
- `src/CricketScreen.jsx` — the scorer, marker board and turn bar.
- `src/App.css` — all screen layout and colours.
- `src/index.css` — reset, light/dark base colours, `#app` layout.
- `src/usePersistentState.js` — `usePersistentState(key, initialValue)` backed by
  `@capacitor/preferences`; reads once on mount and only writes after that read.
  Use it (not `localStorage`) for data that must survive app restarts. The
  players screen uses it for the saved player list.
- `capacitor.config.json` — `appId` (still the placeholder `com.example.dardolotodo`),
  `appName`, `webDir: dist`.
- `android/` — native project; web assets are copied into
  `android/app/src/main/assets/public`.

## Fonts

- The app's only typeface is **Cascadia Code**. It is self-hosted:
  `src/fonts/cascadia-code-latin.woff2` (one variable file, weight axis
  `200 700`, latin subset) is declared with `@font-face` in `src/index.css` and
  referenced as `url('./fonts/...')` so Vite bundles and renames it.
- Never add a `<link>` to fonts.googleapis.com: the APK must render offline.
  `src/fonts/OFL.txt` carries the SIL OFL licence.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server in the browser |
| `npm run build` | production bundle into `dist/` |
| `npm run lint` | oxlint |
| `npm run android:sync` | build + copy into the Android project |
| `npm run android:open` | build + open `android/` in Android Studio |
| `npm run android:run` | build + install on a connected device/emulator |

Native build from the command line:

```sh
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
(cd android && ./gradlew assembleDebug)   # -> android/app/build/outputs/apk/debug/app-debug.apk
```

`dist/` and the synced `assets/public` are gitignored, so a fresh clone needs
`npm run android:sync` before any Android build.

## Verification workflow (no device needed)

There is no emulator/AVD in this environment, so verify layout by measuring the
production build in headless Chromium (already in the Playwright cache):

```sh
CHROME=~/.cache/ms-playwright/chromium-1194/chrome-linux/chrome
npm run lint && npm run build
# write dist/_measure.html: an iframe fixed at 412x900 pointing at ./index.html,
# whose script reads iframe.contentDocument and prints rects into a <pre>
(cd dist && setsid nohup python3 -m http.server 4180 --bind 127.0.0.1 >/dev/null 2>&1 &)
"$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=6000 \
  --window-size=500,1000 --dump-dom http://127.0.0.1:4180/_measure.html | sed -n '/<pre/,/<\/pre>/p'
rm -f dist/_measure.html
```

Always measure inside a fixed-size **iframe**, never from the top-level window:
`--screenshot`/`--window-size` in headless Chrome produce a layout viewport wider
than the image canvas, so captures look cropped on the right and would be
misread as overflow. Trust `getBoundingClientRect`, `scrollWidth` vs
`clientWidth`, and `scrollHeight` vs the 900 reference height.

Stop servers with `fuser -k <port>/tcp`. Never `pkill -f "vite preview"` or
similar — the pattern matches the shell's own command line and kills the shell.

## Setup recipe (new project)

1. `npm create vite@latest . -- --template react`
2. `npm i @capacitor/core @capacitor/android` and `npm i -D @capacitor/cli`
3. `npm run build`, then `npx cap add android`
4. Add the npm scripts above and `capacitor.config.json` with `webDir: "dist"`.

## Pitfalls that cost real time

- **Capacitor 8.6 CLI is missing `tslib`** and crashes with
  `Cannot find module 'tslib'`. Fix: `npm i -D tslib`.
- **`npx cap add android` needs `dist/` to exist**; build first.
- **Blank screen on device** means either a bundle target newer than the WebView
  can parse (`build.target: 'es2017'` in `vite.config.js`) or assets loaded from
  absolute paths (keep `base: './'`).
- **Vite's template root has a fixed width** (e.g. `1126px`); remove it or
  content overflows phones.
- **`ANDROID_HOME` is not exported** here; export it before Gradle.
- **Changing `appId`** later means editing both `capacitor.config.json` and
  `android/app/build.gradle` (`namespace` and `applicationId`).
