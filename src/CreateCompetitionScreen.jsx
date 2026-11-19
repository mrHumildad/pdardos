import { useState } from 'react'
import { ENTRANTS_MAX } from './competition'
import { DEFAULT_VARIANT, VARIANTS } from './game'
import { shortOf } from './players'

// A tie is best of one, three, five or seven legs, exactly as a friendly is.
const BEST_OF = [1, 3, 5, 7]

const KINDS = [
  { id: 'league', name: 'League', title: 'New league' },
  { id: 'cup', name: 'Cup', title: 'New cup' },
]

// A competition is made once, so its terms are chosen here and then fixed: every
// fixture it generates plays the kind, variant and length picked on this screen.
function CreateCompetitionScreen({ players, onCreate }) {
  const [kind, setKind] = useState('league')
  const [name, setName] = useState('')
  const [selected, setSelected] = useState([])
  const [variant, setVariant] = useState(DEFAULT_VARIANT)
  const [bestOf, setBestOf] = useState(BEST_OF[1])

  const entrants = players.filter((player) => selected.includes(player.id))
  const ready = name.trim() !== '' && entrants.length >= 2
  const title = KINDS.find((option) => option.id === kind).title

  function toggle(player) {
    setSelected((current) =>
      current.includes(player.id)
        ? current.filter((id) => id !== player.id)
        : [...current, player.id],
    )
  }

  function create() {
    if (!ready) return
    onCreate({
      kind,
      name: name.trim(),
      variant,
      bestOf,
      entrants: entrants.map((player) => ({
        id: player.id,
        name: player.name,
        short: shortOf(player),
        palette: player.palette,
      })),
    })
  }

  return (
    <main className="league-form">
      <div className="league-form__header">
        <h1 className="league-form__title">{title}</h1>
      </div>

      {/* League or cup: the league plays a fixture list, the cup a bracket. */}
      <div className="game-setup__choice-group" role="group" aria-label="Competition kind">
        {KINDS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="game-setup__choice-button"
            aria-pressed={kind === option.id}
            onClick={() => setKind(option.id)}
          >
            <span className="game-setup__choice-label">{option.name}</span>
          </button>
        ))}
      </div>

      <label className="league-form__field">
        <span>Name</span>
        <input
          value={name}
          maxLength={18}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      {/* The saved players, one strip each: tap to put that player in. The
          chosen strips wear the carpet violet, the colour that means "in". */}
      <ul className="league-form__entrants">
        {players.map((player) => {
          const chosen = selected.includes(player.id)
          return (
            <li key={player.id}>
              <button
                type="button"
                className="league-form__entrant"
                aria-pressed={chosen}
                disabled={!chosen && selected.length >= ENTRANTS_MAX}
                onClick={() => toggle(player)}
              >
                <span className="league-form__entrant-name">{player.name}</span>
                <span className="league-form__entrant-short">({shortOf(player)})</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* The setup screen's own choice strips, so a variant and a length are
          picked in the same cells everywhere in the app. */}
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
        disabled={!ready}
        onClick={create}
      >
        <span className="game-setup__start-label">Create</span>
      </button>
    </main>
  )
}

export default CreateCompetitionScreen
