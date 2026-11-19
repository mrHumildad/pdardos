// A league is a saved list of players turned into a fixture list — every pair
// once — with a table read from the results. Nothing is stored twice: the table
// is computed from the fixtures and the matches they settled, so it can never
// drift from the record behind it.

// The saved players screen is sized for four; a field of eight still makes a
// readable table, a fixture list worth scrolling and a bracket that fits.
export const ENTRANTS_MAX = 8

// Every competition, fixture and match id is made from the clock plus a little
// noise, so two phones creating a league at the same moment still differ.
const newId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

// The circle method: one player stays put, the rest rotate, so every pair meets
// exactly once. An odd field takes a bye each round, which is simply dropped.
function roundRobinRounds(playerIds) {
  const ids = [...playerIds]
  if (ids.length % 2 === 1) ids.push(null)

  const rounds = []
  const size = ids.length

  for (let round = 0; round < size - 1; round += 1) {
    const pairs = []
    for (let index = 0; index < size / 2; index += 1) {
      const first = ids[index]
      const second = ids[size - 1 - index]
      if (first === null || second === null) continue
      // Alternate the venue each round so nobody is always the home code.
      pairs.push(round % 2 === 0 ? [first, second] : [second, first])
    }
    rounds.push(pairs)
    // Rotate every place but the first: the last player comes up behind it.
    ids.splice(1, 0, ids.pop())
  }

  return rounds
}

// A league keeps the entrants as they were when it was made, so a renamed or
// deleted player still reads on the table it was already part of.
export function createLeague({ name, variant, bestOf, entrants }) {
  const rounds = roundRobinRounds(entrants.map((entrant) => entrant.id))

  return {
    id: newId('c'),
    kind: 'league',
    name: name.trim(),
    variant,
    bestOf,
    createdAt: new Date().toISOString(),
    entrants,
    fixtures: rounds.flatMap((pairs, round) =>
      pairs.map(([homeId, awayId], slot) => ({
        id: newId('f'),
        round: round + 1,
        slot,
        homeId,
        awayId,
        winnerId: null,
        matchId: null,
        playedAt: null,
      })),
    ),
  }
}

// Every cup rounds up to the next power of two, so a field of five plays in a
// bracket of eight with three walkovers.
export function cupSize(count) {
  let size = 2
  while (size < count) size *= 2
  return size
}

// The winner of a tie moves into the next round: home when the tie was the
// first of its pair, away when it was the second. Running this again changes
// nothing, so it is safe to call after every result.
function propagateCup(competition) {
  if (competition.kind !== 'cup') return competition

  const key = (round, slot) => `${round}:${slot}`
  const slots = new Map(
    competition.fixtures.map((fixture) => [key(fixture.round, fixture.slot), fixture]),
  )
  let changed = false

  competition.fixtures.forEach((fixture) => {
    if (fixture.winnerId === null) return

    const target = slots.get(key(fixture.round + 1, Math.floor(fixture.slot / 2)))
    const side = fixture.slot % 2 === 0 ? 'homeId' : 'awayId'
    // A decided tie never rewrites a tie that already has a result.
    if (target === undefined || target[side] === fixture.winnerId || target.winnerId !== null) {
      return
    }

    slots.set(key(target.round, target.slot), { ...target, [side]: fixture.winnerId })
    changed = true
  })

  if (!changed) return competition
  return {
    ...competition,
    fixtures: competition.fixtures.map((fixture) =>
      slots.get(key(fixture.round, fixture.slot)),
    ),
  }
}

// A cup is a bracket: round one pairs the field, the walkovers hand their player
// the next round, and every tie after that starts empty.
export function createCup({ name, variant, bestOf, entrants }) {
  const size = cupSize(entrants.length)
  const ties = size / 2
  const byes = size - entrants.length
  const fixtures = []

  for (let slot = 0; slot < ties; slot += 1) {
    const player = entrants[slot]
    if (slot < byes) {
      fixtures.push({
        id: newId('f'),
        round: 1,
        slot,
        homeId: player.id,
        awayId: null,
        // Nobody to play: the walkover is already won.
        winnerId: player.id,
        matchId: null,
        playedAt: null,
      })
      continue
    }

    const from = byes + (slot - byes) * 2
    fixtures.push({
      id: newId('f'),
      round: 1,
      slot,
      homeId: entrants[from].id,
      awayId: entrants[from + 1].id,
      winnerId: null,
      matchId: null,
      playedAt: null,
    })
  }

  const depth = Math.round(Math.log2(size))
  for (let round = 2; round <= depth; round += 1) {
    const count = size / 2 ** round
    for (let slot = 0; slot < count; slot += 1) {
      fixtures.push({
        id: newId('f'),
        round,
        slot,
        homeId: null,
        awayId: null,
        winnerId: null,
        matchId: null,
        playedAt: null,
      })
    }
  }

  return propagateCup({
    id: newId('c'),
    kind: 'cup',
    name: name.trim(),
    variant,
    bestOf,
    createdAt: new Date().toISOString(),
    entrants,
    fixtures,
  })
}

// What a round is called, read back from how many rounds the bracket has.
export function roundName(competition, round) {
  const ties = competition.fixtures.filter((fixture) => fixture.round === 1).length
  const depth = Math.round(Math.log2(ties * 2))
  const fromFinal = depth - round
  if (fromFinal === 0) return 'Final'
  if (fromFinal === 1) return 'Semis'
  if (fromFinal === 2) return 'Quarters'
  return `Round ${round}`
}

export const isPending = (fixture) => fixture.winnerId === null

// Only a tie with both players named can be played; a branch still waiting on
// its feeder, or one that never had anybody, is just drawn.
export const isPlayable = (fixture) =>
  fixture.winnerId === null && fixture.homeId !== null && fixture.awayId !== null

// A walkover: the player went through without a match being played.
export const isBye = (fixture) => fixture.winnerId !== null && fixture.matchId === null

// The legs each side took, read from the match the fixture settled. A fixture
// settled against a match that is no longer here simply reads as null.
export function fixtureLegs(fixture, matches) {
  const match = matches.find((candidate) => candidate.id === fixture.matchId)
  return match === undefined ? null : match.legs
}

// Filing a match settles the fixture it was started from. Matching on the match
// id makes this safe to run more than once, which is how the app files a match.
// A fixture that already holds a result keeps it: a league tie is played once.
export function settleFixture(competitions, official, matchId, winnerId) {
  return competitions.map((competition) => {
    if (competition.id !== official.competitionId) return competition

    const index = competition.fixtures.findIndex((fixture) => fixture.id === official.fixtureId)
    if (index === -1) return competition

    const fixture = competition.fixtures[index]
    if (fixture.matchId === matchId) return competition
    if (fixture.winnerId !== null) return competition

    const fixtures = [...competition.fixtures]
    fixtures[index] = {
      ...fixture,
      matchId,
      winnerId,
      playedAt: new Date().toISOString(),
    }
    // A cup fills its next round the moment a tie is decided.
    return propagateCup({ ...competition, fixtures })
  })
}

// The table: three points a win, then leg difference, then the result between
// the two players concerned, then the order they joined the league in.
export function standings(competition, matches) {
  const rows = new Map(
    competition.entrants.map((entrant) => [
      entrant.id,
      {
        id: entrant.id,
        name: entrant.name,
        short: entrant.short,
        palette: entrant.palette,
        played: 0,
        wins: 0,
        losses: 0,
        legsFor: 0,
        legsAgainst: 0,
        points: 0,
      },
    ]),
  )

  competition.fixtures.forEach((fixture) => {
    if (fixture.winnerId === null) return
    const home = rows.get(fixture.homeId)
    const away = rows.get(fixture.awayId)
    if (home === undefined || away === undefined) return

    const legs = fixtureLegs(fixture, matches)
    const homeLegs = legs?.[fixture.homeId] ?? 0
    const awayLegs = legs?.[fixture.awayId] ?? 0

    home.played += 1
    away.played += 1
    home.legsFor += homeLegs
    home.legsAgainst += awayLegs
    away.legsFor += awayLegs
    away.legsAgainst += homeLegs

    if (fixture.winnerId === home.id) {
      home.wins += 1
      away.losses += 1
      home.points += 3
    } else {
      away.wins += 1
      home.losses += 1
      away.points += 3
    }
  })

  const joined = new Map(competition.entrants.map((entrant, index) => [entrant.id, index]))
  const legDiff = (row) => row.legsFor - row.legsAgainst

  // Head to head only speaks after points and leg difference have failed, and
  // only between two players who have actually met.
  const between = (a, b) =>
    competition.fixtures.find(
      (fixture) =>
        fixture.winnerId !== null &&
        ((fixture.homeId === a.id && fixture.awayId === b.id) ||
          (fixture.homeId === b.id && fixture.awayId === a.id)),
    )

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (legDiff(b) !== legDiff(a)) return legDiff(b) - legDiff(a)

    const meeting = between(a, b)
    if (meeting !== undefined) return meeting.winnerId === a.id ? -1 : 1

    return joined.get(a.id) - joined.get(b.id)
  })
}
