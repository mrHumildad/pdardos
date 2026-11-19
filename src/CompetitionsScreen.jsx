// The leagues and cups made on this phone. A row is a competition and how much
// of it has been played; the plus at the bottom makes another.
function CompetitionsScreen({ competitions, onOpen, onCreate, onBack }) {
  return (
    <main className="leagues-screen">
      <div className="leagues-screen__header">
        <h1 className="leagues-screen__title">Comps ({competitions.length})</h1>
      </div>

      <ul className="leagues-screen__list">
        {competitions.map((competition) => {
          const played = competition.fixtures.filter(
            (fixture) => fixture.winnerId !== null,
          ).length

          return (
            <li key={competition.id}>
              <button
                type="button"
                className="leagues-screen__open"
                onClick={() => onOpen(competition.id)}
              >
                <span className="leagues-screen__name">{competition.name}</span>
                <span className="leagues-screen__progress">
                  {played}/{competition.fixtures.length}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Back on the left, a new league on the right: the players screen's own
          bottom line. */}
      <div className="action-row">
        <button type="button" className="action-back" aria-label="Back" onClick={onBack}>
          <svg
            className="action-back-icon"
            viewBox="-2.4 -1.4 48.8 27.8"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 12.5 16 0v8h28v9H16V25z" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <button type="button" className="action-add" aria-label="New league" onClick={onCreate}>
          <svg className="action-add-icon" viewBox="0 0 24 24" aria-hidden="true">
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

export default CompetitionsScreen
