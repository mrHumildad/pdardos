import { VARIANTS } from './game'

// The detail screen's filter: the whole record first, then one line per variant,
// because points mean something different in each of them.
export const STAT_VARIANTS = [{ id: 'all', name: 'All' }, ...VARIANTS]

// A player with no matches: every readout exists, so the screen never has to
// special-case a missing number.
const EMPTY = {
  matches: 0,
  wins: 0,
  darts: 0,
  marks: 0,
  points: 0,
  bulls: 0,
  doubles: 0,
  triples: 0,
}

// One player's record, read from the filed matches. Nothing is stored twice, so
// a summary can never drift from the matches behind it.
export function summarize(matches, playerId, variant = 'all') {
  const summary = { ...EMPTY }

  matches.forEach((match) => {
    if (variant !== 'all' && match.variant !== variant) return
    if (!match.players.some((player) => player.id === playerId)) return

    summary.matches += 1
    if (match.winnerId === playerId) summary.wins += 1

    // Records filed before doubles and triples were kept simply read as zero.
    const totals = match.totals[playerId]
    if (totals === undefined) return
    summary.darts += totals.darts || 0
    summary.marks += totals.marks || 0
    summary.points += totals.points || 0
    summary.bulls += totals.bulls || 0
    summary.doubles += totals.doubles || 0
    summary.triples += totals.triples || 0
  })

  return {
    ...summary,
    winPct: summary.matches === 0 ? 0 : Math.round((summary.wins / summary.matches) * 100),
    // Marks and points per dart: the two numbers a cricket score board is read by.
    mpd: summary.darts === 0 ? 0 : summary.marks / summary.darts,
    ppd: summary.darts === 0 ? 0 : summary.points / summary.darts,
  }
}
