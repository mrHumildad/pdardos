import { code, playerPalette } from './players'

// The three figures a finished match is read by, in the same shape the players
// screen reads a record: whole darts and marks, marks per dart to two places.
const totalsOf = (player) => {
  const { darts, marks } = player.stats
  return [
    { key: 'darts', value: darts, unit: 'Darts' },
    { key: 'marks', value: marks, unit: 'Marks' },
    { key: 'mpd', value: (darts === 0 ? 0 : marks / darts).toFixed(2), unit: 'MPD' },
  ]
}

// The match is over: the board cannot take another dart, so this screen replaces
// it. The winner wears their kit and everyone else the waiting greys, the same
// way the board says who is acting.
function EndScreen({ game, onRematch, onHome }) {
  return (
    <main className="end-screen" style={{ '--end-rows': String(game.players.length) }}>
      <div className="end-screen__totals">
        {game.players.map((player, index) => (
          <div
            key={player.id}
            className="end-screen__row"
            style={playerPalette(index, player.id === game.winner)}
          >
            <div className="end-screen__cell end-screen__cell--name">
              <span className="end-screen__code">{code(player.name)}</span>
            </div>
            {totalsOf(player).map((total) => (
              <div key={total.key} className="end-screen__cell end-screen__cell--total">
                <span className="end-screen__value">{total.value}</span>
                <span className="end-screen__unit">{total.unit}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="end-screen__actions">
        <button type="button" className="end-screen__rematch" onClick={onRematch}>
          <span className="end-screen__action-label">Rematch</span>
        </button>
        <button type="button" className="end-screen__home" onClick={onHome}>
          <span className="end-screen__action-label">Home</span>
        </button>
      </div>
    </main>
  )
}

export default EndScreen
