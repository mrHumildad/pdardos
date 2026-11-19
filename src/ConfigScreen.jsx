import { useState } from 'react'
import { DEFAULT_VARIANT, VARIANTS } from './game'
import { shortOf } from './players'

// A match is best of one, three, five or seven legs.
const BEST_OF = [1, 3, 5, 7]
// The players screen's list holds four rows; the setup reserves the same four
// slots and leaves the ones nobody fills empty.
const SLOTS = 4
// A fresh match starts with the first two saved players.
const DEFAULT_MATCH = 2

// A kit is a shirt over its shaded twin, the same swatch the players screen
// draws, so the list here reads exactly as it does on that screen.
function Swatch() {
  return (
    <span className="game-setup__swatch" aria-hidden="true">
      <span className="game-setup__swatch-shirt" />
      <span className="game-setup__swatch-shade" />
    </span>
  )
}

// The saved list comes from App, in its own order, so a game is picked from
// those players instead of typed in again.
function ConfigScreen({ players, onStart, onAddPlayer }) {
  // Null means the match still follows the saved list's first two players; the
  // first add or remove pins it to the players it holds.
  const [roster, setRoster] = useState(null)
  const [variant, setVariant] = useState(DEFAULT_VARIANT)
  const [bestOf, setBestOf] = useState(BEST_OF[0])

  const match = roster ?? players.slice(0, DEFAULT_MATCH)
  // The saved players not in the match: the pool the add button draws from.
  const bench = players.filter((player) => !match.includes(player))

  function add() {
    // A saved player on the bench joins the match; with none left there is
    // nobody to add, so the players screen is where the player comes from.
    if (bench.length > 0 && match.length < SLOTS) {
      setRoster([...match, bench[0]])
      return
    }
    onAddPlayer()
  }

  // The players a slot can turn to: the one it holds plus everyone not already
  // throwing, in the saved list's order, so the arrows swap a slot's player
  // instead of putting anybody in the match twice.
  function choicesFor(index) {
    const current = match[index]
    if (current === undefined) return []
    return players.filter((player) => player === current || !match.includes(player))
  }

  // One slot, one player along the saved list, wrapping at either end.
  function cycle(index, step) {
    const options = choicesFor(index)
    if (options.length < 2) return
    const at = options.indexOf(match[index])
    const next = options[(at + step + options.length) % options.length]
    setRoster(match.map((player, position) => (position === index ? next : player)))
  }

  return (
    <main className="game-setup">
      {/* The title bar turns to the next game the way the players screen turns
          its pages, so it is the same header: a chalk chevron cell at each end.
          Cricket is the only game so far, so both arrows rest inert. */}
      <div className="game-setup__header">
        <button type="button" className="game-setup__page" aria-label="Previous game" disabled>
          <svg className="game-setup__page-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15 4 8 12l7 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="game-setup__title">Cricket</h1>

        <button type="button" className="game-setup__page" aria-label="Next game" disabled>
          <svg className="game-setup__page-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 4l7 8-7 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="game-setup__choice-group" role="group" aria-label="Cricket variant">
        {VARIANTS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="game-setup__choice-button game-setup__variant-button"
            aria-pressed={variant === option.id}
            onClick={() => setVariant(option.id)}
          >
            <span className="game-setup__choice-label">{option.name}</span>
          </button>
        ))}
      </div>

      {/* Four slots, the players screen's own four rows: the players in the
          match in saved order and in their kit — the kit swatch itself drops
          him with an X — then the empty ones in the pair the Cricket screen
          wears when it is not your turn, the first of them a plus. */}
      <div className="game-setup__players">
        {Array.from({ length: SLOTS }, (_, index) => {
          const player = match[index]

          if (player === undefined) {
            const openSlot = index === match.length
            return (
              <div
                key={`void-${index}`}
                className={`game-setup__player game-setup__player--void${
                  openSlot ? ' game-setup__player--open' : ''
                }`}
                aria-hidden={openSlot ? undefined : 'true'}
              >
                <span className="game-setup__kit game-setup__kit--void">
                  <Swatch />
                  {openSlot && (
                    <button
                      type="button"
                      className="game-setup__add"
                      aria-label="Add a player"
                      onClick={add}
                    >
                      <svg className="game-setup__add-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 4v16M4 12h16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </span>
                <span className="game-setup__player-name" aria-hidden="true" />
              </div>
            )
          }

          return (
            <div key={`${index}-${player.name}`} className="game-setup__player">
              <span className={`game-setup__kit game-setup__kit--${player.palette}`}>
                <Swatch />
                <button
                  type="button"
                  className="game-setup__drop"
                  aria-label={`Remove ${player.name} from the match`}
                  onClick={() => setRoster(match.filter((other) => other !== player))}
                >
                  <svg
                    className="game-setup__drop-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </span>
              {/* The name sits between the bar's two arrows, which turn the
                  slot to the next saved player who is not already throwing. */}
              <span className="game-setup__player-name">
                <button
                  type="button"
                  className="game-setup__cycle game-setup__cycle--prev"
                  aria-label={`Previous player in slot ${index + 1}`}
                  disabled={choicesFor(index).length < 2}
                  onClick={() => cycle(index, -1)}
                >
                  <svg className="game-setup__cycle-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M15 4 8 12l7 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <span className="game-setup__player-names">
                  <span className="game-setup__player-full">{player.name}</span>
                  <span className="game-setup__player-short">({shortOf(player)})</span>
                </span>

                <button
                  type="button"
                  className="game-setup__cycle game-setup__cycle--next"
                  aria-label={`Next player in slot ${index + 1}`}
                  disabled={choicesFor(index).length < 2}
                  onClick={() => cycle(index, 1)}
                >
                  <svg className="game-setup__cycle-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M9 4l7 8-7 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </span>
            </div>
          )
        })}
      </div>

      <div className="game-setup__choice-group" role="group" aria-label="Best of">
        {BEST_OF.map((value) => (
          <button
            key={value}
            type="button"
            className="game-setup__choice-button"
            aria-pressed={bestOf === value}
            onClick={() => setBestOf(value)}
          >
            <span className="game-setup__choice-label">x{value}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="game-setup__start-button"
        disabled={match.length < 2}
        onClick={() =>
          onStart(
            match.map((player) => ({ id: player.id, name: player.name, short: shortOf(player) })),
            variant,
            bestOf,
          )
        }
      >
        <span className="game-setup__start-label">Start</span>
      </button>
    </main>
  )
}

export default ConfigScreen
