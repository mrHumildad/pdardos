import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import CompetitionScreen from './CompetitionScreen'
import CompetitionsScreen from './CompetitionsScreen'
import ConfigScreen from './ConfigScreen'
import CreateCompetitionScreen from './CreateCompetitionScreen'
import CricketScreen from './CricketScreen'
import EndScreen from './EndScreen'
import MainMenu from './MainMenu'
import PlayersScreen from './PlayersScreen'
import StatsDetailScreen from './StatsDetailScreen'
import { createCup, createLeague, settleFixture } from './competition'
import { createGame, finalizeMatch, undoDart } from './game'
import {
  buildDoc,
  mergeDoc,
  mergeMatchList,
  mergePlayerList,
  parseDoc,
  shareDoc,
} from './groupFile'
import { shortOf, usePlayers } from './players'
import { usePersistentState } from './usePersistentState'
import './App.css'

// A back press can only be tried on a device, so the log is part of the bundle
// on purpose: WebView console messages show up in `adb logcat`.
const log = (...args) => console.log('[darts]', ...args)

const isNative = Capacitor.isNativePlatform()

// Old matches are dropped once the log reaches this length, so the whole record
// stays a small JSON value in Preferences.
const MAX_MATCHES = 300

const summary = (game) =>
  game === null
    ? 'setup'
    : {
        round: game.round,
        turn: game.turn,
        dartsLeft: game.dartsLeft,
        darts: game.darts,
        undone: game.history.length,
        winner: game.winner,
      }

function App() {
  // The app has three screens and the game outlives the game screen, so Continue
  // can hand the same game back after a visit to the menu.
  const [screen, setScreen] = useState('menu')
  const [game, setGame] = useState(null)
  // The filed matches, read here so a finished match is filed the moment its
  // winning dart lands and the stats screens always see the same list.
  const [matches, setMatches, matchesLoaded] = usePersistentState('darts.matches', [])
  // The player whose detail screen is open; null everywhere else.
  const [statsPlayer, setStatsPlayer] = useState(null)
  // The saved players and the ids deleted since. Held here rather than inside
  // the players screen, because the group file reads the same list and the
  // setup screen must see it too.
  const [players, setPlayers] = usePlayers()
  const [deletions, setDeletions] = usePersistentState('darts.playerDeletions', [])
  // The leagues made here, and the one whose screen is open. They are built on
  // this phone from the saved players, so no group code is involved.
  const [competitions, setCompetitions, competitionsLoaded] = usePersistentState(
    'darts.competitions',
    [],
  )
  const [competitionId, setCompetitionId] = useState(null)
  const gameRef = useRef(game)
  const screenRef = useRef(screen)
  const inGame = screen === 'game' && game !== null
  // Web only: a history entry of our own, so a back press lands in the app
  // instead of leaving the page.
  const guard = useRef(false)
  const droppingGuard = useRef(false)

  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  useEffect(() => {
    log('state', { screen, game: summary(game) })
  }, [screen, game])

  // File a finished match by its id, so the record is written once even if the
  // effect runs twice. Taking the winning dart back removes the record, and
  // throwing it again files the same id afresh.
  useEffect(() => {
    if (game === null || !matchesLoaded) return
    if (game.winner === null) {
      setMatches((current) =>
        current.some((match) => match.id === game.matchId)
          ? current.filter((match) => match.id !== game.matchId)
          : current,
      )
      return
    }

    const record = finalizeMatch(game)
    if (record === null) return
    setMatches((current) =>
      current.some((match) => match.id === record.id)
        ? current
        : [...current, record].slice(-MAX_MATCHES),
    )
  }, [game, matchesLoaded, setMatches])

  // A match started from a league fixture settles that fixture as it is filed,
  // so the table moves the moment the winning dart lands. Matching on the match
  // id keeps one match from settling a fixture twice.
  useEffect(() => {
    if (!competitionsLoaded) return
    if (game === null || game.winner === null || !game.official) return
    const winner = game.players.find((player) => player.id === game.winner)
    if (winner === undefined) return
    setCompetitions((current) =>
      settleFixture(current, game.official, game.matchId, winner.userId),
    )
  }, [game, competitionsLoaded, setCompetitions])

  // An imported file is folded in with whatever this phone holds right now, so
  // a match filed while the file was being read is never dropped.
  const handleMerge = useCallback(
    (merged) => {
      const dead = new Set(merged.deletions)
      setPlayers((current) => mergePlayerList(current, merged.players, dead))
      setMatches((current) => mergeMatchList(current, merged.matches, MAX_MATCHES))
      setDeletions((current) => {
        if (merged.deletions.every((id) => current.includes(id))) return current
        return [...new Set([...current, ...merged.deletions])]
      })
    },
    [setPlayers, setMatches, setDeletions],
  )

  // Hand this phone's whole record to another app as one file. The share sheet
  // decides where it goes; the app only writes the JSON.
  const exportFile = useCallback(async () => {
    try {
      await shareDoc(buildDoc({ players, matches, deletions }))
    } catch (error) {
      log('export failed', error)
    }
  }, [players, matches, deletions])

  // Fold a received file in. The merge only adds, so a stale file can never
  // erase a match or player this phone already has.
  const importFile = useCallback(
    async (file) => {
      try {
        const doc = parseDoc(await file.text())
        log('import', { players: doc.players.length, matches: doc.matches.length })
        handleMerge(mergeDoc({ players, matches, deletions }, doc, MAX_MATCHES))
      } catch (error) {
        log('import failed', error)
      }
    },
    [players, matches, deletions, handleMerge],
  )

  const addPlayer = useCallback(
    (player) => setPlayers((current) => [...current, player]),
    [setPlayers],
  )

  // A player leaves the shared list for everyone, so the id is remembered as
  // deleted and travels as a tombstone instead of being forgotten here.
  const removePlayer = useCallback(
    (id) => {
      setPlayers((current) => current.filter((player) => player.id !== id))
      setDeletions((current) => (current.includes(id) ? current : [...current, id]))
    },
    [setPlayers, setDeletions],
  )

  // A pending fixture starts its match on the league's terms: the two entrants
  // and the variant and length the league was made with. The setup screen is
  // skipped because there is nothing left to choose.
  const startFixture = useCallback(
    (competition, fixture) => {
      const roster = [fixture.homeId, fixture.awayId].map((id) => {
        const entrant = competition.entrants.find((candidate) => candidate.id === id)
        const saved = players.find((player) => player.id === id)
        return {
          id,
          name: saved === undefined ? entrant.name : saved.name,
          short: saved === undefined ? entrant.short : shortOf(saved),
        }
      })

      setGame(
        createGame(roster, competition.variant, competition.bestOf, {
          competitionId: competition.id,
          kind: competition.kind,
          name: competition.name,
          fixtureId: fixture.id,
        }),
      )
      setScreen('game')
    },
    [players],
  )

  // One dart back, whoever asked for it. The ref is updated here as well so two
  // presses in a row undo two darts instead of applying the same undo twice.
  const handleBack = useCallback(() => {
    const current = gameRef.current
    if (screenRef.current === 'game' && current !== null) {
      // A league result is official the moment it is filed: the fixture has
      // already read it, so there is no dart to take back.
      if (current.official && current.winner !== null) {
        log('back: official result is final')
        return
      }
      const next = undoDart(current)
      log('back: undo', { from: summary(current), to: summary(next) })
      gameRef.current = next
      setGame(next)
      return
    }
    if (screenRef.current === 'stats-detail') {
      log('back: players')
      setScreen('players')
      return
    }
    if (screenRef.current === 'league' || screenRef.current === 'league-new') {
      log('back: leagues')
      setScreen('leagues')
      return
    }
    if (screenRef.current === 'leagues') {
      log('back: menu')
      setScreen('menu')
      return
    }
    if (screenRef.current === 'setup' || screenRef.current === 'players') {
      log('back: menu')
      setScreen('menu')
      return
    }
    log('back: no screen behind, leaving the app')
    CapacitorApp.exitApp()
  }, [])

  // The Android back button takes one dart back inside the game instead of
  // walking the WebView history, which would leave the whole game behind.
  useEffect(() => {
    if (!isNative) {
      log('back: web, using the history guard')
      return undefined
    }

    let cancelled = false
    let handle = null

    CapacitorApp.addListener('backButton', () => {
      log('back: native button', { canGoBack: window.history.length > 1 })
      handleBack()
    })
      .then((registered) => {
        if (cancelled) {
          registered.remove()
          return
        }
        handle = registered
        log('back: native listener registered')
      })
      .catch((error) => log('back: native listener FAILED', error))

    return () => {
      cancelled = true
      handle?.remove()
    }
  }, [handleBack])

  // Without a native back event, the browser back button would unload the app.
  // While a game runs, keep one extra history entry so the press lands on us.
  useEffect(() => {
    if (isNative || !inGame || guard.current) return
    window.history.pushState({ darts: 'back-guard' }, '')
    guard.current = true
    log('back: history guard pushed', { webHistory: window.history.length })
  }, [inGame])

  useEffect(() => {
    if (isNative) return undefined

    const onPopState = () => {
      if (droppingGuard.current) {
        droppingGuard.current = false
        return
      }
      if (gameRef.current === null) return
      log('back: browser history back', { webHistory: window.history.length })
      handleBack()
      window.history.pushState({ darts: 'back-guard' }, '')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [handleBack])

  // Leaving the game keeps it in state so Continue resumes it untouched.
  const exitToMenu = useCallback(() => {
    log('back: home, leaving the game')
    if (!isNative && guard.current) {
      guard.current = false
      droppingGuard.current = true
      window.history.back()
    }
    setScreen('menu')
  }, [])

  if (inGame) {
    // A finished match has nothing left to score, so the board gives way to the
    // result. Undo (the back button) still takes the winning dart back.
    if (game.winner !== null) {
      return (
        <EndScreen
          game={game}
          onRematch={() =>
            setGame(
              createGame(
                game.players.map((player) => ({
                  id: player.userId,
                  name: player.name,
                  short: player.short,
                })),
                game.variant,
                game.bestOf,
              ),
            )
          }
          onHome={exitToMenu}
        />
      )
    }
    return <CricketScreen game={game} onChange={setGame} onExit={exitToMenu} />
  }

  if (screen === 'setup') {
    return (
      <ConfigScreen
        players={players}
        onAddPlayer={() => setScreen('players')}
        onStart={(roster, variant, bestOf) => {
          setGame(createGame(roster, variant, bestOf))
          setScreen('game')
        }}
      />
    )
  }

  if (screen === 'players') {
    return (
      <PlayersScreen
        players={players}
        onAddPlayer={addPlayer}
        onRemovePlayer={removePlayer}
        onBack={() => setScreen('menu')}
        onOpenStats={(player) => {
          setStatsPlayer(player)
          setScreen('stats-detail')
        }}
      />
    )
  }

  if (screen === 'league-new') {
    return (
      <CreateCompetitionScreen
        players={players}
        onCreate={(fields) => {
          const competition = fields.kind === 'cup' ? createCup(fields) : createLeague(fields)
          setCompetitions((current) => [...current, competition])
          setCompetitionId(competition.id)
          setScreen('league')
        }}
      />
    )
  }

  if (screen === 'leagues' || screen === 'league') {
    const competition =
      screen === 'league'
        ? competitions.find((candidate) => candidate.id === competitionId)
        : undefined

    // A league id with no league behind it (never created, or gone) simply
    // shows the list, rather than an empty screen with no way out.
    if (competition === undefined) {
      return (
        <CompetitionsScreen
          competitions={competitions}
          onOpen={(id) => {
            setCompetitionId(id)
            setScreen('league')
          }}
          onCreate={() => setScreen('league-new')}
          onBack={() => setScreen('menu')}
        />
      )
    }

    return (
      <CompetitionScreen
        competition={competition}
        matches={matches}
        onPlay={(fixture) => startFixture(competition, fixture)}
        onBack={() => setScreen('leagues')}
      />
    )
  }

  if (screen === 'stats-detail' && statsPlayer !== null) {
    return (
      <StatsDetailScreen
        player={statsPlayer}
        matches={matches}
        onBack={() => setScreen('players')}
      />
    )
  }

  return (
    <MainMenu
      canContinue={game !== null}
      onNewGame={() => setScreen('setup')}
      onContinue={() => setScreen('game')}
      onPlayers={() => setScreen('players')}
      onLeagues={() => setScreen('leagues')}
      onImport={importFile}
      onExport={exportFile}
    />
  )
}

export default App
