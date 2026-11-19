---
name: pub-darts-style
description: Use when designing or styling any screen of this pub darts app (setup screen, game screens, dialogs, future modes). Holds the app-wide visual language taken from the Cricket scoring boards — palette roles, flush full-bleed regions, cell grids, currentColor rules, the type scale, press feedback and the checklist for a new screen.
---

# Pub darts style

The look of this app is one thing: **a pub scoreboard**. Chalkboards and marker
boards butted together edge to edge, the pub carpet as identity, the pint glass
as ink, the double bull as the one loud red. There are no cards, no rounded
corners, no drop shadows and no floating panels — a screen is a fixed grid of
regions and cells, and everything is told apart by colour and by hairlines.

The Cricket screen (`darts-cricket-screen` skill) is the reference
implementation; the setup screen is the second instance. New UI follows this
file, not a recollection of it.

## Five laws

1. **Full bleed, flush, no gaps.** A screen is `100dvh` and its regions touch the
   viewport edges and each other. No outer padding, no `gap` between regions, no
   `border-radius`, no `box-shadow` (the only exceptions are the throwing
   player's inset spotlight and the round app logo). Space is made by grid
   fractions, not margins.
2. **Regions are counted in `dvh`, their insides in `fr`.** Region heights add up
   to the screen's `100dvh` exactly (`52 + 8 + 40`, `14 + 11 + 11 + fill + 14`).
   Inside a region, rows and columns use `1fr` / `repeat(n, 1fr)`.
3. **Lines are hairline rules in `currentColor`.** No border colour tokens, no
   dividers drawn as elements. Horizontal rule `0.08em`, vertical rule
   `0.22em`, measured against the *small* cell font-size, so they render as
   roughly 1px and 3px.
4. **Colour only from the palette in `src/index.css`.** No hex, no `rgba()`, no
   `#fff` anywhere else. A new shade gets a pub name in the palette first.
5. **The cell is the hit area.** Buttons carry no padding, no radius, no
   background of their own beyond a palette surface, and their content shrinks
   when pressed.

## Palette roles

Tokens live in `:root` in `src/index.css`; read that block, never retype values.

| role | tokens | where |
| --- | --- | --- |
| identity / "on" | `--pub-carpet-violet`, `--chalk-line` | title bar, chosen choice cell |
| marker board | `--flat-lager-teal`, `--last-orders-teal` | input board, entry cells |
| scorer board | `--bounce-out-amber`, `--bounce-out-amber-deep`, `--chalkboard-white` | score surface, primary action |
| chalk + pub floor | `--black-dog-black`, `--beer-foam-white`, `--chalk-line` | checkboard cells, rules, text |
| alarm | `--double-bull-red`, `--double-bull-red-deep` | bull, "out"/miss, destructive |
| waiting / inactive | `--spectator-grey`, `--spectator-grey-deep` | the players not throwing |
| tint | `--flight-tint` | faint wash on alternating cells |
| spotlight | `--last-dart-spotlight` | active player's column, focus ring |
| page | `--pub-dark` / `--chalk-dust`, `--bar-mat` / `--bar-mat-ink` | screen background and default text |

Every player owns a pair, `--player-one-*` … `--player-four-*` (shirt plus its
shaded twin). `playerPalette(index, throwing)` sets `--player-base` /
`--player-shade` inline; a cell takes `var(--player-base, …)` and every even row
takes `var(--player-shade, …)`. Only the person acting wears their colours —
everyone else is grey. That pair rule is how the app shows "whose turn it is".

## Structure

- Screen wrapper: `display: grid`, `grid-template-rows: <dvh list>`,
  `height: 100dvh`, `min-height: 0`, one background token, one text token.
- Regions are `<section>`s (or the screen's single `<main>`), never padded. A
  region that needs internal structure is itself a grid.
- Rows inside a board: `display: contents` when the cells must land in the
  board's own grid, otherwise a grid of their own. Cells keep `min-width: 0;
  min-height: 0; overflow: hidden;`.
- Two-tone surfaces only: a surface is either a palette colour with its ink from
  the chalk set, or the black/white flip described below.

## Cells

- Input cells alternate `--black-dog-black` / `--beer-foam-white` in a
  checkerboard with the content in the opposite colour, and alternate rows
  invert the pattern (`.marker-board__row--checker-inverted`) so the board
  interlocks. That flip is the app's signature; a grid of tappable cells should
  have it.
- The *cell's own* `font-size` stays small (`clamp(0.7rem, 3.5vw, 1.1rem)`).
  Glyphs and numbers are sized on the children (`4dvh`, `5dvh`, `100% × 100%`)
  so `em`-measured rules stay hairlines. A large type size on the cell itself
  would turn every divider into a slab.
- Vertical rules go on the cell, not on its wrapper:
  `.cell + .cell { border-inline-start: 0.22em solid currentColor; }`. Horizontal
  rules go on every cell of a row: `border-block-end: 0.08em solid currentColor`.
- Exception: a surface whose own type is big (a title bar) thins the rule to
  `0.02em` so it still reads as a hairline.

## Choosing colours per region

- Title / identity bar: `--pub-carpet-violet` ground, `--chalk-line` text, rule
  `currentColor` underneath.
- Choice cells (options, counts, variants): checkboard black/white at rest;
  the chosen one flips to `--pub-carpet-violet` ground with `--chalk-line` text,
  marked in markup with `aria-pressed`. Never add a tick, dot or extra label.
- Entry cells (names, inputs): `--flat-lager-teal` ground, `--chalk-line` text,
  `text-transform: uppercase` when the value is echoed elsewhere as a capitalised
  scoreboard code. Their label plate takes `--last-orders-teal`.
- Primary action: `--bounce-out-amber` ground with `--chalkboard-white` weight
  700 type, full width at the bottom of the screen, like the marker board's
  action row.
- Destructive / miss: `--black-dog-black` ground with `--double-bull-red` ink.
- Whatever is inactive, disabled or not the actor: `--spectator-grey` pair, or
  `opacity: 0.5` on the content.

## Typography

- One typeface: **Cascadia Code**, set once on `body` in `src/index.css`, bundled
  locally (`capacitor-android-app` skill). Never add a font dependency.
- Sizes are viewport-relative so a board fills its region: numbers, points and
  single-line glyphs `4dvh`–`6dvh`; the biggest word on a screen `6dvh`;
  primary action label `5dvh`.
- Short scoreboard text: `letter-spacing: 0.02em`, uppercase, and abbreviations
  it to fit (names are 3-character codes via `code(name)` in
  `src/CricketScreen.jsx`).
- Only text that must survive a narrow cell (a variant name, an option word)
  sizes off the cell's width instead: `clamp(0.8rem, 4.2vw, 1.4rem)`. Never
  let a label wrap or clip: check `scrollWidth` against `clientWidth`.
- `line-height: 1` on anything inside a cell.

## Icons

- Inline SVG only — no icon package, no image files, no emoji.
- `viewBox="0 0 24 24"`, `stroke="currentColor"`, `fill="none"`,
  `strokeWidth` 1.6–1.8, `aria-hidden="true"`. Filled glyphs set
  `fill="currentColor" stroke="none"`.
- Icons fill their cell: `width: 100%; height: 100%` and, inside a grid cell,
  `position: absolute; inset: 0` so intrinsic size can never stretch a row.
  Where an arrow must take the cell's shape, give it its own
  `preserveAspectRatio="none"` viewBox.

## Interaction and states

- The whole cell is the target and the whole cell is pressed: no internal
  `<span>` padding, `-webkit-tap-highlight-color: transparent`.
- Press feedback is a transform on the cell's content:
  `transition: transform 140ms ease-out` plus `transform: scale(0.8)`. That is
  the app's only animation besides the out button's soften and stretch, the turn
  bar's 10s menu hint (round ↔ cog), the scorer's 2s blink of the cells a dart
  changed, and the hand-over (280ms kit cross-fade, the 320ms turn-bar pop and
  the input board's 480ms × 4 ink/background blink, where the bulls keep their
  palette ink and undo/out blink their own colour pairs).
- When a cell can disable itself mid-press (undo), `:active` is not enough —
  track the pressed cell in state and use a `--pressed` class (see
  `CricketScreen`). Plain cells may use `:active`.
- Disabled: `cursor: default; opacity: 0.5`. Never a grey substitute colour. A
  screen may override the fade for the length of a deliberate closed-board
  signal (the marker board's hand-over blink), never just to look brighter.
- Focus: `outline: 0.12em solid var(--last-dart-spotlight)` with
  `outline-offset: -0.12em`, drawn inside the cell so the grid never shifts.
- The active column/row is marked with an inset `box-shadow` in
  `--last-dart-spotlight` on its left and right edges only — one line per
  boundary, never a full rectangle around every cell.

## Main menu (`.main-menu`)

The app's entry screen; markup in `src/MainMenu.jsx`, CSS in `src/App.css`.
Flush regions on `--pub-dark`, rows `1fr 14dvh` plus `grid-auto-rows: 11dvh`, so
the entry count decides the row count.

| region | CSS | measured at 412×900 |
| --- | --- | --- |
| logo slot | `1fr`, flex-centred | circle 34dvh across, 1px chalk ring |
| New game | 14dvh, scorer amber, `--chalkboard-white` | 412×126, 45px / 700 |
| Continue | 11dvh, black ground + white ink | 412×99, 45px / 700 |
| Players | 11dvh, white ground + black ink | 412×99, 45px / 700 |

The logo is a **placeholder**: one empty `div`, a `--chalk-line` ring over a
`--flight-tint` wash. It is `border-radius: 50%` because the logo itself is
round — the single circle the language allows, and the reason the no-radius law
names it. Size `min(62vw, 34dvh)` + `aspect-ratio: 1`, so it stays round on both
short and narrow screens.

Buttons are full-width strips like the setup screen's, each carrying its own
`0.08em currentColor` rule underneath at the small cell font. New game is the
primary action and is the **top** strip here (the one screen where the primary
sits above the rest, so the logo slot takes all the leftover height). Labels are
`5dvh` / 700; press shrinks the label span to 0.8.

Continue is **not rendered** without an ongoing game — no disabled row, no grey
substitute. The game survives a visit to the menu, so its presence alone enables
Continue.

## Players screen (`.players-screen`)

Saved players and their kits; markup in `src/PlayersScreen.jsx`, CSS in
`src/App.css`. Six flush regions, rows `14dvh 44dvh 10dvh 10dvh 10dvh 12dvh`, on
`--pub-dark`. The lower rows gave up height on purpose: the list is sized to
hold four players and never scroll.

| region | CSS | measured at 412×900 |
| --- | --- | --- |
| header | `14dvh`, carpet violet; flex title, or grid `8dvh 1fr 8dvh` when paged | 412×126, title 54px / 36px paged |
| saved list | `44dvh`, `grid-auto-rows: 11dvh`, `overflow: hidden` | 412×396, four 412×99 rows |
| name entry | `10dvh`, `1fr 2fr` label plate + input | 412×90 |
| short entry | `10dvh`, the same row | 412×90 |
| kit picker | `10dvh`, four `1fr` columns | 412×90, four 103 cells |
| back + add | `12dvh`, two `1fr` cells | 412×108, 206 each |

- A saved player row is `11dvh 1fr 11dvh`: kit, name, delete. Both end cells are
  the row's height wide — 11dvh by 11dvh, measured 99×98 — so the **kit swatch**
  is a square 1:1 block (shirt over its shaded twin stacked `1fr 1fr`, `0.22em`
  rule on its inline end) and the **delete X** matches it at the far end. The name
  cell is two stacked lines — the name, then `(SHORT)` beneath it, `gap: 0.12em`
  — so the name owns the whole 214px between the squares: the name is
  `clamp(0.9rem, 5.4vw, 2.2rem)` (22.2px at 412), the largest size a 14-character  name fits in 214 rather than 187 measured at that size, and the short is
  `2.4dvh` (21.6px), one step under it. Both are `scrollWidth === clientWidth`.

- **Paging.** The list is exactly four fixed `11dvh` rows in a `44dvh` region
  with `overflow: hidden` — it never scrolls, which is why the entry rows are
  `10dvh` and the action row `12dvh`. Above four players the header becomes a
  grid `8dvh 1fr 8dvh` with a chalk chevron cell at each end (`M15 4 8 12l7 8` /
  `M9 4l7 8-7 8`, `strokeWidth` 1.8, round joins), 0.5 and inert on the first
  and last page, and the title steps to `4dvh` (36px) so `PLAYERS (12)` fits the
  268px it keeps between them. Adding a player turns to that player's page; a
  delete clamps the page back into range.
- The list paints an inset `0.08em` `--chalk-line` shadow along its bottom, so
  the saved players and the add form stay two sections even when fewer than four
  rows are there to draw the line themselves. A real border would have eaten a
  pixel off the fourth row's 11dvh; a shadow cannot.
- **Delete** is the bull doing the destructive job: `--double-bull-red` ground,
  `--black-dog-black` X (`M6 6l12 12M18 6 6 18`, `strokeWidth` 1.8, round caps)
  filling the cell (`width/height: 100%`, measured 97×98) and shrinking to 0.8 on
  press, `aria-label="Delete <name>"`. It removes the player outright — no
  confirm — and the header count follows.
- **Everything on this screen is caps.** `text-transform: uppercase` sits on
  `.players-screen`. The button reset drops inheritance, so a button that carries
  a word must declare it again; the two icon-only actions carry none.
- The title carries the saved count, `Players ({players.length})` → `PLAYERS
  (12)`, centred at `6dvh` when the whole bar is its own, and `4dvh` when the
  page arrows take 8dvh at each end.
- **Back and add are the bottom row's two halves** (`1fr 1fr`, 206 each). Back is
  the Cricket screen's fat undo arrow — the same path `M0 12.5 16 0v8h28v9H16V25z`,
  `fill: currentColor`, `stroke: none`, `viewBox="-2.4 -1.4 48.8 27.8"` and
  `preserveAspectRatio="none"` as `ICON_SPECS.undo` — on `--black-dog-black` with
  `--chalk-line` ink and a `0.22em` rule on its inline end; it fills its cell and
  shrinks to 0.8 on press. Add is the right half: the title bar's
  `--pub-carpet-violet` with a `--chalk-line` stroke plus (`M12 4v16M4 12h16`,
  `strokeWidth` 1.6, round caps), no word, `aria-label="Add"`, 0.5 while the
  name or short is empty.
- The kit picker is four buttons, each filled by its own pair via a modifier that
  sets `--swatch-shirt` / `--swatch-shade` (`--player-one-*` … `--player-four-*`).
  Selection is shown by strength and a white ring: the chosen kit is `opacity: 1`
  plus `outline: 0.22em solid var(--chalk-line)` with `outline-offset: -0.22em`,
  the rest 0.5, with `aria-pressed` — **no tick, dot or label**, because the
  colour is the value. An outline, not a border, so the flush strip never moves.
  Vertical `0.22em` rules between cells at the small strip font.
- Entry rows repeat the setup name row exactly (plate `--swatch-shade`, field
  `--swatch-shirt` — the chosen kit's two halves, cross-fading over 280ms — at
  `5dvh` uppercase, spotlight focus), one row per value, so the screen never
  packs two fields into one cell. The chosen kit dresses both rows, so the name
  and short are typed in the colours they will be read in. The **short** is
  the score board's three-letter code (`code(name)` in `src/CricketScreen.jsx`):
  3 characters, auto-filled with `name.trim().slice(0, 3)` (`Alice` → `Ali`)
  while untouched, owned by the typist once edited, handed back to the name when
  cleared. Add is `disabled` (0.5) until both are non-empty; both clear together.
- The header is one cell: no control sits in it, so the title keeps the bar's
  full 412px and the back control lives in the bottom row.
- Saved on device through `usePersistentState('darts.players', [])`, so the list
  survives an app restart; shape is `{ name, short, palette: 'one' | 'two' |
  'three' | 'four' }`.

## Setup screen (`.game-setup`)

The second instance of the language; markup in `src/ConfigScreen.jsx`, all CSS in
`src/App.css`. Five flush regions, rows `14dvh 14dvh 44dvh 14dvh 14dvh`: title,
mode, players, best of, start.

| region | CSS | measured at 412×900 |
| --- | --- | --- |
| header + title `h1` "Cricket" | `14dvh`, carpet violet, grid `8dvh 1fr 8dvh`, `6dvh` / 600 | 412×126, 72-wide arrows, title 268 wide |
| mode / variant strip | `14dvh`, `grid-auto-flow: column; grid-auto-columns: 1fr` | 412×126, labels 17.3px |
| players list | `44dvh`, four 11dvh rows | 412×396 |
| best of strip | `14dvh`, same strip | 412×126, four 103 cells |
| start button | `14dvh`, scorer amber, `5dvh` / 700 | 412×126, 45px type |

- The strips keep the small cell font (`clamp(0.7rem, 3.5vw, 1.1rem)`) so their
  `0.22em` / `0.08em` rules measure 3px and 1px; the labels size themselves on
  `.game-setup__choice-label` — count digits `6dvh`, variant names
  `clamp(0.8rem, 4.2vw, 1.4rem)` so "Cut-Throat" stays on one line (137px cell).
- Cells checkboard odd-black / even-white; the chosen one is carpet violet with
  chalk text via `[aria-pressed='true']`, declared after the `nth-child` rules,
  plus a `0.22em` `--chalk-line` outline at `-0.22em` offset — the same white
  ring the players screen puts on the chosen kit, so the choice reads in both
  strips. The chosen **mode** takes the start button's own
  `--bounce-out-amber` / `--chalkboard-white`, so the choice above and the
  action below match. The mode strip sits above the players list, the best-of
  strip below it, directly over the start button.
- The title bar is the players screen's **paged header** with the same chalk
  chevrons (`M15 4 8 12l7 8` / `M9 4l7 8-7 8`, 1.8, round joins) at each end,
  there to turn to the next game; Cricket is the only one, so both rest 0.5 and
  `disabled`, and the title keeps its 268px.
- A player row is `11dvh 1fr`: the kit swatch (whose X drops the player) and the
  name cell, which is itself `8dvh 1fr 8dvh` — the same chevrons, now turning
  the slot to the next saved player who is not already in the match (wrapping,
  0.5/inert when there is nobody else). The two arrows leave the name 169px, so
  a full 14-character name is `clamp(0.9rem, 4.2vw, 2.2rem)` (17.3px, measured
  147/169) instead of the 22.2px the old full-width cell allowed; the short keeps
  `2.4dvh` beneath it.
- Press shrinks the label span (`.game-setup__choice-label`,
  `.game-setup__start-label`) to 0.8; there is no separate pressed-class state
  because none of these cells disables itself.

## Content rules

Do not add headings, captions, legends, helper text, sample data or extra
controls that the request did not name. A screen shows the smallest set of
controls it needs, edge to edge, and nothing else.

## Checklist for a new screen

1. Rows sum to `100dvh`; the wrapper is `display: grid` with `height: 100dvh`.
2. No padding, gaps, radii or shadows in the screen's own CSS.
3. Every colour is a palette token; no literal colour added.
4. Any grid of options/numbers has the black/white checkboard and `currentColor`
   dividers at `0.08em` / `0.22em` of the small cell font.
5. Chosen state = `--pub-carpet-violet` + `aria-pressed`; disabled = 0.5 opacity.
6. Labels fit: longest string stays on one line at 412px wide.
7. Icons are inline SVG at `100% × 100%`.
8. Press shrinks the content to 0.8 over 140ms.
9. `npm run lint && npm run build`, then measure at 412×900 in a fixed iframe
   (`capacitor-android-app` skill) — region heights, track counts,
   `scrollWidth === clientWidth`, `scrollHeight === 900`.
