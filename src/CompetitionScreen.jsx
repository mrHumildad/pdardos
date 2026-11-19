import { useState } from 'react'
import {
  fixtureLegs,
  isBye,
  isPending,
  isPlayable,
  roundName,
  standings,
} from './competition'

const entrantsOf = (competition) => competition.entrants
const entrantById = (competition, id) =>
  entrantsOf(competition).find((entrant) => entrant.id === id)

// A tie is two codes either side of its result. A playable one is the league's
// entry cell — the marker teal — because the whole row is the way to play it; a
// played one is back on the blackboard, the winner in their kit; a branch still
// waiting on its feeder is drawn in the waiting grey.
function FixtureRow({ competition, fixture, matches, onPlay, showRound = true }) {
  const home = entrantById(competition, fixture.homeId)
  const away = entrantById(competition, fixture.awayId)

  if (isPending(fixture)) {
    const cells = (
      <>
        <span className="league__code">{home?.short}</span>
        <span className="league__middle">{showRound ? `R${fixture.round}` : ''}</span>
        <span className="league__code">{away?.short}</span>
      </>
    )

    if (!isPlayable(fixture)) {
      return <div className="league__fixture league__fixture--void">{cells}</div>
    }

    return (
      <button
        type="button"
        className="league__fixture league__fixture--pending"
        onClick={() => onPlay(fixture)}
      >
        {cells}
      </button>
    )
  }

  const legs = fixtureLegs(fixture, matches)
  const score = isBye(fixture)
    ? 'Bye'
    : legs === null
      ? '-'
      : `${legs[fixture.homeId] ?? 0}-${legs[fixture.awayId] ?? 0}`

  return (
    <div className="league__fixture league__fixture--played">
      <span
        className={`league__code${
          fixture.winnerId === fixture.homeId ? ` league__win--${home?.palette}` : ''
        }`}
      >
        {home?.short}
      </span>
      <span className="league__middle">{score}</span>
      <span
        className={`league__code${
          fixture.winnerId === fixture.awayId ? ` league__win--${away?.palette}` : ''
        }`}
      >
        {away?.short}
      </span>
    </div>
  )
}

// The table the fixtures make: one strip per entrant, the checkerboard flipping
// row to row like the marker board.
function LeagueTable({ competition, matches }) {
  const rows = standings(competition, matches)

  return (
    <div className="league__table" style={{ '--league-rows': String(rows.length) }}>
      <div className="league__table-head">
        <span>Player</span>
        <span>P</span>
        <span>W</span>
        <span>L</span>
        <span>Legs</span>
        <span>Pts</span>
      </div>

      <div className="league__table-body">
        {rows.map((row) => (
          <div key={row.id} className="league__table-row">
            <span className="league__cell--name">{row.short}</span>
            <span>{row.played}</span>
            <span>{row.wins}</span>
            <span>{row.losses}</span>
            <span>
              {row.legsFor}-{row.legsAgainst}
            </span>
            <span>{row.points}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// The cup read as a bracket: one band per round, from the first round down to
// the final, so a player's route to the trophy reads top to bottom.
function CupBracket({ competition, matches, onPlay }) {
  const rounds = [...new Set(competition.fixtures.map((fixture) => fixture.round))].sort(
    (a, b) => a - b,
  )

  return (
    <div className="league__bracket">
      {rounds.map((round) => (
        <section key={round} className="league__round">
          <h2 className="league__round-name">{roundName(competition, round)}</h2>
          {competition.fixtures
            .filter((fixture) => fixture.round === round)
            .map((fixture) => (
              <FixtureRow
                key={fixture.id}
                competition={competition}
                fixture={fixture}
                matches={matches}
                onPlay={onPlay}
                showRound={false}
              />
            ))}
        </section>
      ))}
    </div>
  )
}

function CompetitionScreen({ competition, matches, onPlay, onBack }) {
  const cup = competition.kind === 'cup'
  const [view, setView] = useState('fixtures')
  const second = cup ? 'bracket' : 'table'

  // The ties still to play come first, in the competition's own round order, so
  // the next one is always the row on top; results follow underneath.
  const pending = competition.fixtures.filter(isPending)
  const played = competition.fixtures.filter((fixture) => !isPending(fixture))

  return (
    <main className="league">
      <div className="league__header">
        <h1 className="league__title">{competition.name}</h1>
      </div>

      <div className="game-setup__choice-group" role="group" aria-label="Competition view">
        <button
          type="button"
          className="game-setup__choice-button"
          aria-pressed={view === 'fixtures'}
          onClick={() => setView('fixtures')}
        >
          <span className="game-setup__choice-label">Fixtures</span>
        </button>
        <button
          type="button"
          className="game-setup__choice-button"
          aria-pressed={view === second}
          onClick={() => setView(second)}
        >
          <span className="game-setup__choice-label">{cup ? 'Bracket' : 'Table'}</span>
        </button>
      </div>

      {view === second ? (
        cup ? (
          <CupBracket competition={competition} matches={matches} onPlay={onPlay} />
        ) : (
          <LeagueTable competition={competition} matches={matches} />
        )
      ) : (
        <ul className="league__fixtures">
          {[...pending, ...played].map((fixture) => (
            <li key={fixture.id}>
              <FixtureRow
                competition={competition}
                fixture={fixture}
                matches={matches}
                onPlay={onPlay}
              />
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="action-back league__back" aria-label="Back" onClick={onBack}>
        <svg
          className="action-back-icon"
          viewBox="-2.4 -1.4 48.8 27.8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 12.5 16 0v8h28v9H16V25z" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </main>
  )
}

export default CompetitionScreen
