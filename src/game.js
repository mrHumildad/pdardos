export const TARGETS = ['20', '19', '18', '17', '16', '15', 'BULL']
export const NUMBERS = ['20', '19', '18', '17', '16', '15']
export const DARTS_PER_TURN = 3
export const MARKS_TO_CLOSE = 3

// Scoring variants of Cricket. The target set and the marks are the same in
// every one; they differ in who gets the points and who wins.
export const VARIANTS = [
  { id: 'standard', name: 'Standard' },
  { id: 'cut-throat', name: 'Cut-Throat' },
  { id: 'no-score', name: 'No Score' },
]

export const DEFAULT_VARIANT = 'standard'

// A dart is worth 1 (single), 2 (double) or 3 (triple) marks.
export const MULTIPLIERS = [
  { name: 'single', hits: 1 },
  { name: 'double', hits: 2 },
  { name: 'triple', hits: 3 },
]

export function targetValue(target) {
  return target === 'BULL' ? 25 : Number(target)
}

// An untouched score board: every target open, nothing scored.
function freshMarks() {
  const marks = {}
  TARGETS.forEach((target) => {
    marks[target] = 0
  })
  return marks
}

// Legs a match takes: the majority of bestOf, so two of three.
export function legsToWin(bestOf) {
  return Math.floor(bestOf / 2) + 1
}

// A match keeps the id it was created with, so its record is written once even
// if the screen effect that files it runs twice.
function newMatchId() {
  return `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function createGame(roster, variant = DEFAULT_VARIANT, bestOf = 1, official = null) {
  return {
    // The saved players this match belongs to, against which the record is filed.
    matchId: newMatchId(),
    variant,
    // How many legs the match is best of: the winner takes the majority.
    bestOf,
    // The league fixture this match settles, or null for a friendly.
    official,
    players: roster.map((player, id) => ({
      id,
      // The saved player's own id, kept beside the seat number the board uses.
      userId: player.id,
      name: player.name,
      short: player.short || player.name.slice(0, 3),
      points: 0,
      marks: freshMarks(),
      // Legs banked so far; a match goes to the player who reaches legsToWin.
      wins: 0,
      // Running totals over every leg, filed with the finished match.
      stats: { darts: 0, marks: 0, points: 0, bulls: 0, doubles: 0, triples: 0 },
    })),
    turn: 0,
    // The round counts one full pass through the player order: round 1 starts
    // with player 1's first turn.
    round: 1,
    dartsLeft: DARTS_PER_TURN,
    // The darts of the current turn, in order: { target, hits } or null for a
    // miss. Cleared when the turn passes.
    darts: [],
    winner: null,
    // The player who has just taken the leg, held while the hand-over waits to
    // open the next one. Null through a leg in progress.
    legWinner: null,
    lastThrow: null,
    // The complete state before each dart, newest last, so one dart can be
    // taken back without losing the game.
    history: [],
  }
}

// A state stripped of its own history, ready to be restored by undoDart.
function snapshot(game) {
  const state = { ...game }
  delete state.history
  return state
}

export function isClosed(marks) {
  return marks >= MARKS_TO_CLOSE
}

function hasClosedEverything(player) {
  return TARGETS.every((target) => isClosed(player.marks[target]))
}

// Closed everything and holds the winning score: the most points in Standard
// and No Score, the fewest in Cut-Throat, where points are given away.
function hasWon(candidate, players, variant) {
  if (!hasClosedEverything(candidate)) return false
  return players.every((other) =>
    variant === 'cut-throat'
      ? candidate.points <= other.points
      : other.points <= candidate.points,
  )
}

// Marks past the third on a target are points. Standard keeps them, Cut-Throat
// hands the same points to every opponent still open on that target, and No
// Score ignores them.
function awardSurplus(players, thrower, target, hits, variant) {
  if (variant === 'no-score') return

  const points = hits * targetValue(target)
  if (variant === 'cut-throat') {
    players.forEach((player, index) => {
      if (index !== thrower && !isClosed(player.marks[target])) player.points += points
    })
    return
  }

  const scoringAllowed = players.some(
    (player, index) => index !== thrower && !isClosed(player.marks[target]),
  )
  if (scoringAllowed) players[thrower].points += points
}

// Fold one dart into the running totals before the state is sealed: the thrower
// gets the dart and its marks, and every point the variant paid out lands on the
// player who received it. The totals live inside the players, so undo's snapshot
// restores them along with the rest of the state.
function recordDart(before, players, thrower, dart) {
  players.forEach((player, index) => {
    const gained = player.points - before[index].points
    if (gained !== 0) {
      player.stats = { ...player.stats, points: player.stats.points + gained }
    }
  })

  const hits = dart === null ? 0 : dart.hits
  const player = players[thrower]
  player.stats = {
    ...player.stats,
    darts: player.stats.darts + 1,
    marks: player.stats.marks + hits,
    bulls: player.stats.bulls + (dart !== null && dart.target === 'BULL' ? dart.hits : 0),
    // Darts thrown as that multiplier, whether or not the marks counted; a
    // double bull is a double here.
    doubles: player.stats.doubles + (hits === 2 ? 1 : 0),
    triples: player.stats.triples + (hits === 3 ? 1 : 0),
  }
}

// Burn one dart. The third dart completes the turn but does not pass it: the
// state rests at dartsLeft 0 with all three darts still recorded, so the screen
// can show what they did before the next player takes the oche. endTurn performs
// the hand-over.
function finishDart(game, players, dart) {
  const darts = [...game.darts, dart]
  const legWinner = players.find((candidate) => hasWon(candidate, players, game.variant))
  // A won leg banks a win straight away, so the score board can show it while
  // the last darts rest; the majority of the best of ends the match there.
  const wins = legWinner === undefined ? 0 : legWinner.wins + 1
  const winner = wins > 0 && wins >= legsToWin(game.bestOf) ? legWinner.id : null

  return {
    matchId: game.matchId,
    variant: game.variant,
    bestOf: game.bestOf,
    official: game.official,
    players:
      wins === 0
        ? players
        : players.map((player) => (player.id === legWinner.id ? { ...player, wins } : player)),
    turn: game.turn,
    round: game.round,
    // A won leg ends the turn on the spot, however many darts were left in the
    // hand: the hand-over then opens the next leg, or leaves the finished match.
    dartsLeft: legWinner === undefined ? game.dartsLeft - 1 : 0,
    darts,
    winner,
    legWinner: legWinner === undefined ? null : legWinner.id,
    lastThrow: game.lastThrow,
  }
}

// The completed turn goes to the next player. Called once the screen has shown
// the last dart; a turn still in progress is left alone.
export function endTurn(game) {
  if (game.dartsLeft > 0) return game
  const turn = (game.turn + 1) % game.players.length

  // A won leg that did not decide the match starts the board over on the next
  // player's hand; the wins stay with the players. A decided match stays put.
  if (game.legWinner !== null) {
    if (game.winner !== null) return game
    return {
      ...game,
      players: game.players.map((player) => ({ ...player, points: 0, marks: freshMarks() })),
      turn,
      round: 1,
      dartsLeft: DARTS_PER_TURN,
      darts: [],
      legWinner: null,
    }
  }

  return {
    ...game,
    turn,
    round: turn === 0 ? game.round + 1 : game.round,
    dartsLeft: DARTS_PER_TURN,
    darts: [],
  }
}

/**
 * Register one dart for the player whose turn it is.
 * Marks go on until the target is closed (3); marks past the third are points,
 * handed out the way the game's variant says.
 */
export function throwDart(game, target, hits) {
  if (game.winner !== null || game.dartsLeft <= 0) return game

  const players = game.players.map((player) => ({ ...player, marks: { ...player.marks } }))
  const player = players[game.turn]

  let marks = player.marks[target]
  let remaining = hits
  while (remaining > 0 && marks < MARKS_TO_CLOSE) {
    marks += 1
    remaining -= 1
  }
  player.marks[target] = marks
  if (remaining > 0) {
    awardSurplus(players, game.turn, target, remaining, game.variant)
  }

  recordDart(game.players, players, game.turn, { target, hits })

  return {
    ...finishDart(game, players, { target, hits }),
    lastThrow: { target, hits },
    history: [...game.history, snapshot(game)],
  }
}

/** Throw the same dart again: repeat the last target and multiplier. */
export function repeatDart(game) {
  if (game.lastThrow === null) return game
  return throwDart(game, game.lastThrow.target, game.lastThrow.hits)
}

/** The dart is out: no marks, no points, just the next dart (or next player). */
export function missDart(game) {
  if (game.winner !== null || game.dartsLeft <= 0) return game
  const players = game.players.map((player) => ({ ...player }))
  recordDart(game.players, players, game.turn, null)
  return {
    ...finishDart(game, players, null),
    history: [...game.history, snapshot(game)],
  }
}

// The finished match as it is filed: one record per match, with every player's
// totals and the legs banked. The totals were counted dart by dart, because the
// score board itself only holds the leg in progress.
export function finalizeMatch(game) {
  if (game.winner === null) return null
  const winner = game.players.find((player) => player.id === game.winner)
  return {
    v: 1,
    id: game.matchId,
    endedAt: new Date().toISOString(),
    variant: game.variant,
    bestOf: game.bestOf,
    // The league fixture this match settled, carried into the filed record so
    // the fixture and the match always name each other.
    official: game.official,
    winnerId: winner.userId,
    players: game.players.map((player) => ({
      id: player.userId,
      name: player.name,
      short: player.short,
    })),
    legs: Object.fromEntries(game.players.map((player) => [player.userId, player.wins])),
    totals: Object.fromEntries(
      game.players.map((player) => [player.userId, { ...player.stats }]),
    ),
  }
}

/** Take back the most recent dart, including a dart that decided the game. */
export function undoDart(game) {
  if (game.history.length === 0) return game
  return {
    ...game.history[game.history.length - 1],
    history: game.history.slice(0, -1),
  }
}
