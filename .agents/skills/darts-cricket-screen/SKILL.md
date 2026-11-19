---
name: darts-cricket-screen
description: Use when changing the Cricket scoring screen of this darts app — the header plus marker grid (numbers 20-15, single/double/triple darts marks, four action icons) and the four-player scorer grid (points row, names row, 20-15 + BULL rows). Holds the exact heights, grid fractions, colours, data shape and measured reference values.
---

# Cricket screen

A darts Cricket scorer: up to four players, targets `20, 19, 18, 17, 16, 15, BULL`,
each target hit as single, double or triple. Implemented in `src/App.jsx` +
`src/App.css` as three stacked regions.

## Regions and heights

| region | order | CSS | measured at 412×900 |
| --- | --- | --- | --- |
| scorer | 1 | `52dvh` (`.game-body` rows `52dvh 8dvh 40dvh`) | 468px |
| turn bar | 2 | `8dvh` | 72px |
| marker | 3 | `40dvh` | 360px |

`.game-screen` is `height: 100dvh` with the single row `100dvh`; its only child is
`.game-body`, which stacks the three regions. `52 + 8 + 40 = 100`, keep that exact.
The turn bar is a `<section className="turn-bar">` **between** the two boards (it
lives inside `main`, not above them), so the score board touches the top of the
screen and the marker board the bottom. It is **four equal cells**
(`grid-template-columns: repeat(4, 1fr)`, no padding, no gaps) in the throwing
player's kit — the `playerPalette` pair is set inline, grey once a winner is
decided — and the cells alternate `--player-base` / `--player-shade` like the
scorer's rows. Cell 1 is the home button (the whole cell is the hit area; it
shows the current round as `#N` in the player-name type: `4.2dvh`,
`letter-spacing: 0.02em`); tapping it returns to the config screen. Because the
same cell is also the app's only way back, it periodically advertises itself: on
a 10s `ease-in-out` loop (`turn-bar__menu-hint`) a gear (`ICON_PATHS.gear`, a
stroked ring, axle and eight 3-wide teeth, 5dvh) fades in at 0.3s, turns its
quarter, holds to 1.9s and is gone by 2.2s, while the round runs the inverse
opacity (`turn-bar__round-hint`), so the two never overlap. The gear is
`aria-hidden` and absolutely centred over the round; the button's `aria-label`
(`Home, round N`) stays the accessible name. Cells 2–4 are the
three darts of the turn (`TurnDarts` in `src/CricketScreen.jsx`,
`DARTS_PER_TURN` cells). A dart still in hand shows the upright filled glyph in a
`12 × 24` viewBox at `3.6dvh × 7.2dvh`, `--beer-foam-white` at `opacity: 0.45`
and `transform: rotate(45deg)`, so it reads as a dart in flight. Once that dart
is thrown, the glyph gives its cell to the scored value (`dartValue` in
`src/CricketScreen.jsx`,`.turn-bar__dart-value` in the same player-name type as the round, `4.2dvh`
and `letter-spacing: 0.02em`): `20` for a single, `D20` / `T20`
for a double / triple, `25` / `50` for single / double
bull and `OUT` for a missed dart. The cells follow `game.darts`, so they fill
left to right through the turn and empty when the turn passes.
**There is no player name or text
in the bar** — names live only in the scorer, as 3-letter codes. The dart cells are
`aria-hidden`, so the bar's only accessible control is the home button.

## Marker (bottom grid)

- Background `var(--flat-lager-teal)`; 5 rows, `grid-template-rows: 0.6fr 1.1fr 1.1fr 1.1fr 1.1fr`
  → measured `43.2 / 79.2 / 79.2 / 79.2 / 79.2` inside 360px.
- The last row's columns are `1fr 1fr 2fr 2fr` (measured `68.7 / 68.7 / 137.3 /
  137.3` at 412px wide), so undo and out are twice as wide as the two bull
  buttons. It has no vertical `border-inline-start` dividers, unlike rows 1–4 —
  its cells are told apart by the even-cell `--flight-tint` background.
- **Row 1** — six cells showing the numbers `20, 19, 18, 17, 16, 15`
  (`NUMBERS`, `.marker-board__number`).
- **Rows 2–4** — six columns each (`repeat(6, 1fr)`), every cell is a button
  showing the conventional darts mark: row 2 = **single** `/`, row 3 = **double**
  `X`, row 4 = **triple** (circle with an `X` through it). Paths live in
  `MARK_PATHS`, drawn by `<Mark>` with `.dart-mark` at `100% × 100%`, viewBox
  `0 0 24 24`, `stroke="currentColor"`.
- **Row 5** — the only four-column row (`.marker-board__row--actions`, `1fr 1fr 2fr 2fr`)
  holding four inline SVG buttons: single bull, double bull, undo (takes back the last
  dart) and out (dart missed). `.marker-board__icon` is `100% × 100%` and absolutely
  positioned, so each icon covers its cell. No icon library. The single bull is a
  **green donut**: one `<circle r=6.5 fill=none strokeWidth=5>` stroked
  `var(--flat-lager-teal)` through `.marker-board__icon--single-bull circle`, so the cell shows
  through the hole and the ring reads on both black and white cells. The double
  bull is **one big red dot**: `<circle r=10 stroke=none>` filled
  `var(--double-bull-red)` (`#d7263d`) through
  `.marker-board__icon--double-bull circle`; icon classes come from `ICON_CLASSES`  in `src/CricketScreen.jsx`. The out button is an
  inline-SVG **pile of shit**: three stacked filled tiers and a curl at the top,
  drawn in `ICON_PATHS.out` in `0 0 24 24` with `fill="currentColor" stroke="none"`,
  so it takes the cell's red content colour. `ICON_SPECS.out` gives it
  `preserveAspectRatio="none"` on the `0 0 24 24` viewBox. Idle it is a square
  about the row's height: `.marker-board__row--actions .marker-board__cell:nth-child(4)
  .marker-board__icon` sets `inset: 0; margin: auto; width: 58%; height: 100%`
  (58% of the wide cell is that square at the reference ratio) and transitions
  width/height/inset over 140ms `ease-out`. `:active` squashes it to
  `inset: 6% 0; width: 100%; height: 88%`, so it stretches across the button
  while sitting slightly shorter than the row.
- The undo icon is a **solid fat back arrow** (`<path d="M0 12.5 16 0v8h28v9H16V25z"
  fill="currentColor" stroke="none" />`) in its own `viewBox="0 0 44 25"` with
  `preserveAspectRatio="none"` via `ICON_SPECS` in `src/CricketScreen.jsx`, so it
  stretches to the 137×78 rectangular cell. The spec's viewBox is
  `-2.4 -1.4 48.8 27.8` (42.8 units bigger than the 44×25 arrow, same 1.76 ratio),
  which insets the arrow so its path box is ≈90% of the SVG box instead of
  touching all four edges; `.marker-board__row--actions .marker-board__cell:nth-child(3)
  .marker-board__icon` then insets it a further 10% all round (`inset: 10%; width:
  80%; height: 80%`). Every other icon keeps the square `0 0 24 24` viewBox.
- **Press feedback** is shared by every marker button. `CricketScreen` tracks one
  `pressedCell` key (`target-single-20`, `single-bull`, `undo`, …) set from
  `onPointerDown` and cleared on pointer up/cancel/leave, plus a `window`
  `pointerup`/`pointercancel` fallback in case the cell disables itself before the
  release reaches it. `.marker-board__cell > *` transitions `transform` over 140ms
  `ease-out` and `.marker-board__cell--pressed > *` sets `transform: scale(0.8)`.
  The class is used instead of `:active` because a disabled button drops `:active`
  and gets no pointer events — undo disables itself the moment the last dart is
  taken back, and the whole board disables when a throw wins. The out cell is the
  exception: it has no pressed class and animates its own stretch under `:active`.
- Row striping: even rows `var(--last-orders-teal)`; even cells
  `var(--flight-tint)`; text `var(--chalk-line)`; cell font
  `clamp(0.7rem, 3.5vw, 1.1rem)`. Every row alternates whole cells between
  `var(--black-dog-black)` and `var(--beer-foam-white)`, with the glyph taking
  the opposite colour; rows 2 and 4 add `.marker-board__row--checker-inverted`
  so their pattern starts on white and the rows interlock like a chessboard
  (rows 1/3/5 are `B W B W B W`, rows 2/4 are `W B W B W B`). Row classes live
  in `ROW_CLASSES` in `src/CricketScreen.jsx`. The only cells off the chessboard are the last row's
  undo and out. Undo (`nth-child(3)`) takes the throwing player's shade
  `var(--player-shade, var(--spectator-grey-deep))` with `var(--black-dog-black)`
  content; out (`nth-child(4)`) is `var(--black-dog-black)` with
  `var(--double-bull-red)` content. The `playerPalette` pair is also set inline on
  the marker board `<section>`, so `--player-shade` resolves there. Redo shows at
  50% opacity while it is disabled. Every six-column row gets column
  dividers: `.marker-board__row:not(.marker-board__row--actions) .marker-board__cell + .marker-board__cell` has
  `border-inline-start: 0.22em solid currentColor`, so the line always contrasts
  with the cell it sits on and no extra colour token is needed. Because the
  dividers are measured in `em`, the cell's own `font-size` must stay small
  (`clamp(0.7rem, 3.5vw, 1.1rem)`) — content sizes live on the children
  instead: `.marker-board__number` `4dvh`, `.dart-mark`/`.marker-board__icon` `100%`, so text
  and icons fill their cell. Marker icons are `position: absolute; inset: 0` inside
  the relatively-positioned `.marker-board__cell`, because a square icon at `100%` height
  would otherwise add its intrinsic size to the grid row's min-content and stretch
  the row (this actually made the action row 104px tall until it was fixed). Every marker cell
  also has `border-block-end: 0.08em solid currentColor`
  (`.marker-board__row .marker-board__cell`) for horizontal dividers between rows, the
  four-column action row included.
- **Hand-over**: while the turn is closed (`dartsLeft: 0` or the 320ms swap) the
  board carries `.marker-board--handover`, and every cell blinks at 480ms × 4
  (1920ms, ending on normal colours) by swapping its ink and its background, so
  the checkerboard flips. Ordinary and bull cells run
  `marker-blink-from-black` / `marker-blink-from-white` chosen by parity (the
  checker-inverted rows start from white). Only `background-color` and `color`
  animate, so the bull cells keep their own ink: the single-bull ring stays
  `--flat-lager-teal` and the double-bull dot `--double-bull-red` while the
  background flips black/white. The action row's last two cells blink their own
  pairs: undo (`nth-child(3)`) runs `marker-blink-undo` between the throwing
  player's shade and black, out (`nth-child(4)`) runs `marker-blink-out` between
  red and black. Cells disabled in that window keep `opacity: 1`
  (`.marker-board--handover .marker-board__cell:disabled`) — the usual 50%
  disabled fade would wash the blink out.

## Typography

- Every piece of text uses **Cascadia Code**, set once on `body` in
  `src/index.css`; the font is bundled, see the `capacitor-android-app` skill.

## Scorer (top grid)

- Background `var(--bounce-out-amber)`; `grid-template-columns: repeat(4, 1fr)`;
  `grid-template-rows: 1.4fr repeat(8, 1fr)` → measured `69.7 + 49.8 × 8` in 468px.
- **Four columns are players 1–4. There is deliberately no legend/label column.**
- Content fills its cell: `.score-board__cell` `5dvh`, `.score-board__cell--points` `4.5dvh`,
  `.score-board__cell--name` `4.2dvh`, marks `100% × 100%`.
- Row 1 = player points (`.score-board__cell--points`, weight 700); row 2 = player names
  (`.score-board__cell--name`, uppercase, letter-spacing 0.02em). **Names are always a
  3-character uppercase code** via `code(name) = name.slice(0, 3).toUpperCase()`
  in `src/CricketScreen.jsx`, used in the scorer and the header — except for two
  seconds after a dart pays that player, when the same cell shows the gain as
  `+N` (max three characters: `+60`, `+50`). `CricketScreen` fills `pointGains`
  (keyed by player id) in its `change` wrapper, from the points delta between the
  state the dart was thrown from and the state it produced — so cut-throat, which
  pays every open opponent, flashes each of them — and clears it after 2000ms or
  immediately when a delta is negative (an undo).
  Every cell the dart changed blinks with it for the same two seconds: the points
  cell carries `.score-board__cell--gain` (its value sits in a `<span>` so the
  transform target exists) and each target cell whose marks went up carries
  `.score-board__cell--changed`. Both animate `score-board-blink` — four 500ms
  switches between `opacity: 1` and `0.15` — on the cell's child only, so the
  player's kit background stays steady. The deltas are computed in the handler,
  not an effect, which keeps the component free of cascading renders. Rows 3–9 = per-player
  marks for the targets `20, 19, 18, 17, 16, 15, BULL` in that order, drawn as
  `/` (1 mark), `X` (2) or a crossed circle (3) once a target has marks. A target
  still on zero shows its own number instead, at `opacity: 0.25`
  (`.score-board__target`), so an untouched target reads as a gap rather than a
  scored value. The BULL row has no number: at zero marks it shows `MARK_PATHS.bullDot`
  — a filled `<circle r="4">` (half the radius of the r=8 mark circle) through
  `.score-board__bull-dot`, also at `opacity: 0.25`.
- `.score-board__row { display: contents }` so the cells land directly in the 4×9 grid.
- Every player owns a two-colour palette, `--player-one-*` … `--player-four-*`
  (a shirt and its shaded twin). `playerPalette(index, throwing)` in
  `src/CricketScreen.jsx` sets `--player-base` / `--player-shade` inline on every
  score-board cell: the throwing player's column uses their own pair, every other
  column uses the two greys `--spectator-grey` / `--spectator-grey-deep` (and with
  a winner decided, all four columns are grey). Cells take
  `var(--player-base, var(--bounce-out-amber))` and
  `.score-board__row:nth-child(even) .score-board__cell` takes
  `var(--player-shade, …)`, so a column alternates between its two colours row by
  row. Text `var(--chalkboard-white)`; font `clamp(0.62rem, 3vw, 0.9rem)`.

## Data shape (`src/game.js`)

```js
game = {
  variant: 'standard' | 'cut-throat' | 'no-score',
  players: [{ id, name, points, marks: { '20': 0…3, …, BULL: 0…3 } }],
  turn, round, dartsLeft, darts: [{ target, hits } | null], winner,
  lastThrow: { target, hits } | null,
  history: [snapshot of the state before each dart, newest last],
}
```

Column order is player order (2–4 players); scorer rows 3–9 follow `TARGETS`.
`dartsLeft: 0` is a resting state, not a new turn: three darts are recorded and
`turn`/`round` still belong to the thrower. `endTurn(game)` in `src/game.js`
moves the turn on (and the round, when it wraps) and clears `darts`;
`CricketScreen` calls it after `HANDOVER_PAUSE` (1600ms, long enough for the
blinks the last dart set off to be read) and holds `.turn-bar--swapping` for
`SWAP_MS` (320ms), while the board is inert (`halted = winner !== null ||
dartsLeft === 0 || swapping` — the marker cells, undo and the home cell are all
disabled, so nothing can be thrown over the pause or the animation). `throwDart` and `missDart` ignore a game already
resting at `dartsLeft: 0`.
The old fake data (`Maya 301…`) is gone — the screen renders real game state.

## Gameplay

Two screens, no router: `src/App.jsx` holds `game` state and renders
`ConfigScreen` when it is `null`, otherwise `CricketScreen`.

- **Config** (`src/ConfigScreen.jsx`): 2/3/4 player buttons (`aria-pressed`),
  the variant buttons (Standard / Cut-Throat / No Score, same pattern), one name
  field per player (defaults `Player 1…4`), `Start` → `createGame(names, variant)`.
  Both choice rows use `.game-setup__choice-group` / `.game-setup__choice-button`.
- **Rules** (`src/game.js`, pure functions, no React): 3 darts per turn; the
  third ends the turn but does not pass it — the state rests at `dartsLeft: 0`
  until `endTurn` is called — single/double/triple = 1/2/3 marks; 3 marks closes a target;
  marks past the third are points (`targetValue(target) × hits`, 25/50 for bull),
  awarded by `game.variant` (`VARIANTS` in `src/game.js`): **standard** keeps
  them for the thrower while an opponent still has that target open,
  **cut-throat** gives the same points to every opponent still open on it, and
  **no-score** plays marks only. `darts` records the current turn's throws
  in order (`{ target, hits }`, `null` for a miss) and empties when the turn
  passes to the next player. Winner = all seven targets closed and the winning
  score: the most points in standard and no-score, the fewest in cut-throat. `repeatDart(game)` throws the remembered
  `lastThrow` again; `missDart(game)` burns a dart without marks (turn still
  rotates after three). `undoDart(game)` puts back the state before the most
  recent dart (including a dart that decided the game) using `game.history`; the
  undo cell in the last marker row and the back button both call it.
  history: `src/App.jsx` sends the native `backButton` event and, on web, a
  guarded `popstate` through one `handleBack`, which also keeps `gameRef` in
  step so two quick presses undo two darts. On web a history entry is pushed
  while a game runs (and dropped when the home cell is used) so a back press
  cannot unload the page. Both paths log `[darts]` lines — state summary, undo
  depth, listener registration/failure — to the console (`adb logcat` shows
  WebView console output as `Capacitor/Console`).
- **Input**: the marker rows are buttons — rows 2–4 are number × multiplier
  (`aria-label="triple 20"`), row 5 is single bull, double bull, undo (takes back
  the last dart, disabled until there is one) and out (dart missed, burns a dart).
  The turn bar is a home cell showing the round number plus three dart cells in
  the throwing player's kit; the home cell returns to the config screen. The scorer's
  `.score-board__cell--active` outlines the throwing player's column.
- Scorer column count comes from `--score-board-columns` (inline style), so 2–4
  players work with the same CSS.

## Rules for changing this screen

- Responsive units only (`dvh`, `fr`, `em`, `clamp()`); no `px`.
- Colours only from the pub-darts palette tokens (`--chalk-line`,
  `--flat-lager-teal`, `--bounce-out-amber`, …) — no literal colours here.
- Keep the region totals at 100dvh and the 4×9 scorer / 5-row marker intact unless
  the user asks for a change.
- Do not add labels, headers, captions, legends, buttons or extra rows on your own.
- Icons stay inline SVG; do not add an icon dependency.
- Verify by measuring the built app at 412×900 inside an iframe (see the
  `capacitor-android-app` skill), checking region heights, row heights, grid track
  counts and both overflow flags.
