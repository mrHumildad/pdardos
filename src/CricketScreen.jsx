import { useEffect, useRef, useState } from 'react'
import {
  NUMBERS,
  TARGETS,
  MULTIPLIERS,
  DARTS_PER_TURN,
  isClosed,
  legsToWin,
  throwDart,
  undoDart,
  missDart,
  endTurn,
} from './game'
import { code, playerPalette } from './players'

// The turn does not pass the moment the third dart lands: it rests this long so
// the blinks that dart set off can be read, then the hand-over animation plays
// for SWAP_MS (the same 320ms as the CSS animation on .turn-bar--swapping) and
// the board opens again.
const HANDOVER_PAUSE = 1600
const SWAP_MS = 320
// A leg banked mid-match stops the board long enough to read who took it and
// the running legs, then the next leg opens by itself.
const LEG_PAUSE = 2400

const ACTIONS = [
  { id: 'single-bull', target: 'BULL', hits: 1, label: 'Single bull' },
  { id: 'double-bull', target: 'BULL', hits: 2, label: 'Double bull' },
]

// Conventional scoreboard marks: / is a single, X a double, a crossed circle
// a triple.
const MARK_PATHS = {
  // An untouched bull: a solid dot at half the radius of the marked circle.
  bullDot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
  single: <path d="M6 18 18 6" />,
  double: <path d="M6 6l12 12M18 6L6 18" />,
  triple: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
    </>
  ),
}

const MARK_FOR_MARKS = { 1: 'single', 2: 'double', 3: 'triple' }

// Scorer notation for a thrown dart: 20 for a single, D20/T20 for the doubled
// and trebled number, 25/50 for the bulls and OUT for a miss.
const HIT_PREFIX = { 1: '', 2: 'D', 3: 'T' }

function dartValue(dart) {
  if (dart === null) return 'OUT'
  if (dart.target === 'BULL') return dart.hits === 2 ? '50' : '25'
  return `${HIT_PREFIX[dart.hits]}${dart.target}`
}

// One dart per dart of the turn. A dart still in hand shows its glyph; a thrown
// dart hands the cell over to the value it scored.
function TurnDarts({ darts }) {
  return (
    <>
      {Array.from({ length: DARTS_PER_TURN }, (_, index) => {
        const dart = darts[index]
        return (
          <div key={index} className="turn-bar__cell turn-bar__dart-cell" aria-hidden="true">
            {dart === undefined ? (
              <svg className="turn-bar__dart" viewBox="0 0 12 24">
                <path className="turn-bar__dart-tip" d="M6 0 3.4 6.2h5.2L6 0z" />
                <path className="turn-bar__dart-shaft" d="M4.9 5.4h2.2v10.4H4.9z" />
                <path className="turn-bar__dart-flight" d="M6 15.2 1.6 24h8.8L6 15.2z" />
              </svg>
            ) : (
              <span className="turn-bar__dart-value">{dartValue(dart)}</span>
            )}
          </div>
        )
      })}
    </>
  )
}

// Every marker row alternates black and white cells; alternate rows invert the
// pattern so the rows interlock like a chessboard.
const ROW_CLASSES = [
  'marker-board__row marker-board__row--checker-inverted',
  'marker-board__row',
  'marker-board__row marker-board__row--checker-inverted',
]

const ICON_PATHS = {
  // Single bull: a green donut — a thick ring whose hole shows the cell.
  'single-bull': <circle cx="12" cy="12" r="6.5" fill="none" strokeWidth="5" />,
  // Double bull: one big red dot.
  'double-bull': <circle cx="12" cy="12" r="10" stroke="none" />,
  // A fat, solid back arrow drawn to the shape of its rectangular cell.
  undo: <path d="M0 12.5 16 0v8h28v9H16V25z" fill="currentColor" stroke="none" />,
  // The menu: a cog — a ring with eight stubby teeth and a small axle.
  gear: (
    <>
      <circle cx="12" cy="12" r="6.4" />
      <circle cx="12" cy="12" r="2.2" />
      <g strokeWidth="3" strokeLinecap="butt">
        <path d="M12 5.2V2.4M12 18.8v2.8M5.2 12H2.4M18.8 12h2.8M8.32 8.32 5.21 5.21M15.68 15.68l3.11 3.11M15.68 8.32l3.11-3.11M8.32 15.68l-3.11 3.11" />
      </g>
    </>
  ),
  // A missed dart: a pile of it, three tiers and a curl.
  out: (
    <g fill="currentColor" stroke="none">
      <path d="M2.8 17.4c0-2 4.1-3.4 9.2-3.4s9.2 1.4 9.2 3.4v1c0 2.1-1.7 3-3.6 3H6.4c-1.9 0-3.6-.9-3.6-3z" />
      <path d="M5.2 10.8c0-1.7 3.1-2.8 6.8-2.8s6.8 1.1 6.8 2.8v.5c0 1.7-1.3 2.2-2.7 2.2H7.9c-1.4 0-2.7-.5-2.7-2.2z" />
      <path d="M7.6 5.9c0-1.4 2-2.3 4.4-2.3s4.4.9 4.4 2.3v.3c0 1.4-.9 1.4-1.8 1.4H9.4c-.9 0-1.8 0-1.8-1.4z" />
      <path d="M10.3 4.3c-.6-1.1-.3-2.2.5-3.1.3.6.8 1 1.5 1.2-.3-1 0-1.9.9-2.4.6 1.3.9 2.6.3 3.7z" />
    </g>
  ),
}

function Mark({ kind, className = '' }) {
  if (!kind) return null
  return (
    <svg
      className={`dart-mark${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {MARK_PATHS[kind]}
    </svg>
  )
}

// Icons that carry their own colour get an extra class.
const ICON_CLASSES = {
  'single-bull': 'marker-board__icon marker-board__icon--single-bull',
  'double-bull': 'marker-board__icon marker-board__icon--double-bull',
}

// The undo arrow stretches to fill its cell instead of keeping a square aspect.
const ICON_SPECS = {
  undo: { viewBox: '-2.4 -1.4 48.8 27.8', preserveAspectRatio: 'none' },
  out: { viewBox: '0 0 24 24', preserveAspectRatio: 'none' },
}

function Icon({ name, className = 'marker-board__icon' }) {
  const spec = ICON_SPECS[name]
  return (
    <svg
      className={className}
      viewBox={spec ? spec.viewBox : '0 0 24 24'}
      preserveAspectRatio={spec ? spec.preserveAspectRatio : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

function CricketScreen({ game, onChange, onExit }) {
  // A button that disables itself mid-press (undo when the last dart is taken
  // back, the board once a throw wins) drops :active and gets no pointer events,
  // so the pressed cell is tracked here instead of in CSS.
  const [pressedCell, setPressedCell] = useState(null)
  // A dart that pays a player swaps their name for the points it paid, and every
  // cell it changed blinks, so a throw can be read without hunting the board.
  // Keyed by player id, and by `id:target` for the mark cells.
  const [pointGains, setPointGains] = useState({})
  const [markFlashes, setMarkFlashes] = useState({})
  const flashTimer = useRef(null)
  // The hand-over from one player to the next, and the pause that precedes it.
  const [swapping, setSwapping] = useState(false)
  const handoverTimer = useRef(null)
  const swapTimer = useRef(null)
  const latestGame = useRef(game)
  const locked = game.winner !== null
  // The leg has been banked but the match goes on: the board gives way to the
  // leg stop until the hand-over opens the next leg.
  const tookLeg = game.legWinner !== null && game.winner === null
  // dartsLeft 0 is the completed turn: the board is inert from the last dart
  // until the hand-over animation has played out.
  const halted = locked || game.dartsLeft === 0 || swapping
  // The same window, for the board's own signal: while it is closed, the input
  // cells blink inside out.
  const handingOver = !locked && (game.dartsLeft === 0 || swapping)
  const throwing = (playerId) => playerId === game.turn && !locked
  // A best of two legs or more keeps a dot per leg to win at the right margin of
  // every points cell; the dots banked so far turn white.
  const winsNeeded = legsToWin(game.bestOf)
  const scoreCellClass = (playerId) =>
    throwing(playerId) ? 'score-board__cell score-board__cell--active' : 'score-board__cell'
  const markerCell = (cell) =>
    `marker-board__cell${pressedCell === cell ? ' marker-board__cell--pressed' : ''}`
  const pressHandlers = (cell) => ({
    onPointerDown: () => setPressedCell(cell),
    onPointerUp: () => setPressedCell(null),
    onPointerCancel: () => setPressedCell(null),
    onPointerLeave: () => setPressedCell(null),
  })

  // Points are awarded by the variant — cut-throat hands them to every opponent
  // still open — so both flashes are read from the state delta when a dart is
  // applied, and an undo (a delta below zero) simply drops them.
  function change(next) {
    const gained = {}
    const marked = {}
    let shrunk = false
    next.players.forEach((player, index) => {
      const before = game.players[index]
      const delta = player.points - before.points
      if (delta > 0) gained[player.id] = delta
      if (delta < 0) shrunk = true
      TARGETS.forEach((target) => {
        if (player.marks[target] > before.marks[target]) {
          marked[`${player.id}:${target}`] = true
        }
      })
    })

    const changed = Object.keys(gained).length > 0 || Object.keys(marked).length > 0
    if (shrunk) {
      clearTimeout(flashTimer.current)
      setPointGains({})
      setMarkFlashes({})
    } else if (changed) {
      clearTimeout(flashTimer.current)
      setPointGains(gained)
      setMarkFlashes(marked)
      flashTimer.current = setTimeout(() => {
        setPointGains({})
        setMarkFlashes({})
      }, 2000)
    }

    // A completed turn waits, then hands over. The guard drops the hand-over if
    // the state moved on underneath it (the device back button undoes a dart
    // without going through the board).
    clearTimeout(handoverTimer.current)
    if (next.dartsLeft === 0 && next.winner === null) {
      const legTaken = next.legWinner !== null
      handoverTimer.current = setTimeout(
        () => {
          if (latestGame.current !== next) return
          // The leg stop replaces the whole screen, so there is no bar to swap;
          // endTurn clears the banked leg and opens the next one.
          if (legTaken) {
            onChange(endTurn(next))
            return
          }
          setSwapping(true)
          onChange(endTurn(next))
          swapTimer.current = setTimeout(() => setSwapping(false), SWAP_MS)
        },
        legTaken ? LEG_PAUSE : HANDOVER_PAUSE,
      )
    }

    onChange(next)
  }

  useEffect(() => {
    latestGame.current = game
  }, [game])

  useEffect(
    () => () => {
      clearTimeout(flashTimer.current)
      clearTimeout(handoverTimer.current)
      clearTimeout(swapTimer.current)
    },
    [],
  )

  // Safety net: if the cell disables itself before pointerup reaches it, the
  // release still lands here and the shrink cannot stick.
  useEffect(() => {
    if (pressedCell === null) return undefined
    const release = () => setPressedCell(null)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [pressedCell])

  if (tookLeg) {
    return (
      <main className="leg-screen" style={{ '--leg-columns': String(game.players.length) }}>
        {game.players.map((player, index) => (
          <div
            key={player.id}
            className="leg-screen__column"
            style={playerPalette(index, player.id === game.legWinner)}
          >
            <div className="leg-screen__cell leg-screen__cell--legs">{player.wins}</div>
            <div className="leg-screen__cell leg-screen__cell--name">{code(player.name)}</div>
          </div>
        ))}
      </main>
    )
  }

  return (
    <div className="game-screen">
      <main className="game-body">
        <section
          className="score-board"
          style={{ '--score-board-columns': String(game.players.length) }}
        >
          <div className="score-board__row">
            {game.players.map((player, index) => (
              <div
                key={player.id}
                className={`${scoreCellClass(player.id)} score-board__cell--points${
                  pointGains[player.id] ? ' score-board__cell--gain' : ''
                }`}
                style={playerPalette(index, throwing(player.id))}
              >
                <span>{player.points}</span>
                {game.bestOf > 1 && (
                  <span
                    className="score-board__legs"
                    role="img"
                    aria-label={`${player.wins} of ${winsNeeded} legs won`}
                  >
                    {Array.from({ length: winsNeeded }, (_, leg) => (
                      <svg
                        key={leg}
                        className={`score-board__leg${
                          leg < player.wins ? ' score-board__leg--won' : ''
                        }`}
                        viewBox="0 0 8 8"
                        aria-hidden="true"
                      >
                        <circle cx="4" cy="4" r="4" />
                      </svg>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="score-board__row">
            {game.players.map((player, index) => (
              <div
                key={player.id}
                className={`${scoreCellClass(player.id)} score-board__cell--name`}
                style={playerPalette(index, throwing(player.id))}
              >
                {pointGains[player.id] ? `+${pointGains[player.id]}` : code(player.name)}
              </div>
            ))}
          </div>
          {TARGETS.map((target) => {
            // A target every player has closed is crossed off the row: each cell
            // draws its own stretch of the line, so they join into one rule.
            const lined = game.players.every((player) => isClosed(player.marks[target]))
            return (
              <div key={target} className="score-board__row">
                {game.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`${scoreCellClass(player.id)}${
                      markFlashes[`${player.id}:${target}`] ? ' score-board__cell--changed' : ''
                    }${lined ? ' score-board__cell--line' : ''}`}
                    style={playerPalette(index, throwing(player.id))}
                  >
                    {player.marks[target] > 0 ? (
                      <Mark kind={MARK_FOR_MARKS[player.marks[target]]} />
                    ) : target === 'BULL' ? (
                      <Mark kind="bullDot" className="score-board__bull-dot" />
                    ) : (
                      <span className="score-board__target">{target}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </section>

        <section
          className={`turn-bar${swapping ? ' turn-bar--swapping' : ''}`}
          style={playerPalette(game.turn, !locked)}
        >
          <button
            type="button"
            className="turn-bar__cell turn-bar__menu-button"
            aria-label={`Home, round ${game.round}`}
            disabled={halted && !locked}
            onClick={onExit}
          >
            <span className="turn-bar__round">#{game.round}</span>
            <Icon name="gear" className="turn-bar__menu-gear" />
          </button>
          <TurnDarts darts={game.darts} />
        </section>

        <section
          className={`marker-board${handingOver ? ' marker-board--handover' : ''}`}
          style={playerPalette(game.turn, !locked)}
        >
          <div className="marker-board__row">
            {NUMBERS.map((number) => (
              <div key={number} className="marker-board__cell">
                <span className="marker-board__number">{number}</span>
              </div>
            ))}
          </div>

          {MULTIPLIERS.map((multiplier, index) => (
            <div key={multiplier.name} className={ROW_CLASSES[index]}>
              {NUMBERS.map((number) => (
                <button
                  key={number}
                  type="button"
                  className={markerCell(`target-${multiplier.name}-${number}`)}
                  aria-label={`${multiplier.name} ${number}`}
                  disabled={halted}
                  {...pressHandlers(`target-${multiplier.name}-${number}`)}
                  onClick={() => change(throwDart(game, number, multiplier.hits))}
                >
                  <Mark kind={multiplier.name} />
                </button>
              ))}
            </div>
          ))}

          <div className="marker-board__row marker-board__row--actions">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={markerCell(action.id)}
                aria-label={action.label}
                disabled={halted}
                {...pressHandlers(action.id)}
                onClick={() => change(throwDart(game, action.target, action.hits))}
              >
                <Icon
                  name={action.id}
                  className={ICON_CLASSES[action.id] || 'marker-board__icon'}
                />
              </button>
            ))}
            <button
              type="button"
              className={markerCell('undo')}
              aria-label="Undo last dart"
              disabled={halted || game.history.length === 0}
              {...pressHandlers('undo')}
              onClick={() => change(undoDart(game))}
            >
              <Icon name="undo" />
            </button>
            <button
              type="button"
              className="marker-board__cell"
              aria-label="Dart out"
              disabled={halted}
              onClick={() => change(missDart(game))}
            >
              <Icon name="out" />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default CricketScreen
