import { useState } from 'react'
import { newPlayerId, shortOf } from './players'

// The same four two-colour kits the score board hands out, in the order the
// game uses them: player one is the marker teal, two the scorer amber, three the
// pub carpet, four the double bull red.
const PALETTES = [
  { id: 'one', label: 'Player 1' },
  { id: 'two', label: 'Player 2' },
  { id: 'three', label: 'Player 3' },
  { id: 'four', label: 'Player 4' },
]

const autoShort = (value) => value.trim().slice(0, 3)

// The list is built to hold exactly four rows, so a page is four players and
// the rest are turned to with the header's two arrows.
const PAGE_SIZE = 4

// A kit is a shirt over its shaded twin, so the pair reads at a glance.
function Swatch() {
  return (
    <span className="players-screen__swatch">
      <span className="players-screen__swatch-shirt" />
      <span className="players-screen__swatch-shade" />
    </span>
  )
}

// The list itself belongs to App, which also shares it through the group, so
// this screen reads it as props and reports every add and delete upward.
function PlayersScreen({ players, onAddPlayer, onRemovePlayer, onBack, onOpenStats }) {
  const [name, setName] = useState('')
  const [short, setShort] = useState('')
  // Once the short has been typed by hand it stops following the name, until it
  // is cleared again and the name can take it back.
  const [shortEdited, setShortEdited] = useState(false)
  const [palette, setPalette] = useState(PALETTES[0].id)
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(players.length / PAGE_SIZE))
  // A delete can empty the page that was showing, so the page is clamped here
  // rather than corrected in an effect.
  const currentPage = Math.min(page, pageCount - 1)
  const pageStart = currentPage * PAGE_SIZE
  const visiblePlayers = players.slice(pageStart, pageStart + PAGE_SIZE)

  function changeName(value) {
    setName(value)
    if (!shortEdited) setShort(autoShort(value))
  }

  function changeShort(value) {
    if (value === '') {
      setShortEdited(false)
      setShort(autoShort(name))
      return
    }
    setShortEdited(true)
    setShort(value)
  }

  function add() {
    const trimmedName = name.trim()
    const trimmedShort = short.trim()
    if (trimmedName === '' || trimmedShort === '') return
    onAddPlayer({ id: newPlayerId(), name: trimmedName, short: trimmedShort, palette })
    // Show the page the new player lands on, so adding is never invisible.
    setPage(Math.floor(players.length / PAGE_SIZE))
    setName('')
    setShort('')
    setShortEdited(false)
  }

  function remove(index) {
    onRemovePlayer(visiblePlayers[index].id)
  }

  return (
    <main className="players-screen">
      <div
        className={`players-screen__header${pageCount > 1 ? ' players-screen__header--paged' : ''}`}
      >
        {pageCount > 1 && (
          <button
            type="button"
            className="players-screen__page"
            aria-label="Previous page"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <svg className="players-screen__page-icon" viewBox="0 0 24 24" aria-hidden="true">
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
        )}

        <h1 className="players-screen__title">Players ({players.length})</h1>

        {pageCount > 1 && (
          <button
            type="button"
            className="players-screen__page"
            aria-label="Next page"
            disabled={currentPage === pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            <svg className="players-screen__page-icon" viewBox="0 0 24 24" aria-hidden="true">
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
        )}
      </div>

      <ul className="players-screen__list">
        {visiblePlayers.map((player, index) => (
          <li key={player.id || pageStart + index} className="players-screen__player">
            <span
              className={`players-screen__kit players-screen__kit--${player.palette}`}
              aria-hidden="true"
            >
              <Swatch />
            </span>
            {/* The name cell is the way into that player's record; the kit
                and the delete X stay separate cells of the same row. */}
            <button
              type="button"
              className="players-screen__player-name"
              aria-label={`Stats for ${player.name}`}
              onClick={() => onOpenStats(player)}
            >
              <span className="players-screen__player-full">{player.name}</span>
              <span className="players-screen__player-short">({shortOf(player)})</span>
            </button>
            <button
              type="button"
              className="players-screen__delete"
              aria-label={`Delete ${player.name}`}
              onClick={() => remove(index)}
            >
              <svg
                className="players-screen__delete-icon"
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
          </li>
        ))}
      </ul>

      <label className={`players-screen__field players-screen__kit--${palette}`}>
        <span>Name</span>
        <input
          value={name}
          maxLength={14}
          onChange={(event) => changeName(event.target.value)}
        />
      </label>

      {/* The short follows the name until it is edited, so a player can be
          listed under a code that is not just their first three letters. */}
      <label className={`players-screen__field players-screen__kit--${palette}`}>
        <span>Short</span>
        <input
          value={short}
          maxLength={3}
          onChange={(event) => changeShort(event.target.value)}
        />
      </label>

      <div className="players-screen__palette-group" role="group" aria-label="Player kit">
        {PALETTES.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`players-screen__palette-button players-screen__kit--${option.id}`}
            aria-label={option.label}
            aria-pressed={palette === option.id}
            onClick={() => setPalette(option.id)}
          >
            <Swatch />
          </button>
        ))}
      </div>

      {/* The bottom line is two halves: back on the left, add on the right. The
          back arrow is the Cricket screen's own undo glyph. */}
      <div className="players-screen__actions">
        <button
          type="button"
          className="players-screen__back"
          aria-label="Back"
          onClick={onBack}
        >
          <svg
            className="players-screen__back-icon"
            viewBox="-2.4 -1.4 48.8 27.8"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 12.5 16 0v8h28v9H16V25z" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <button
          type="button"
          className="players-screen__add-button"
          aria-label="Add"
          disabled={name.trim() === '' || short.trim() === ''}
          onClick={add}
        >
          <svg className="players-screen__add-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 4v16M4 12h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </main>
  )
}

export default PlayersScreen
