import { useEffect } from 'react'
import { usePersistentState } from './usePersistentState'

// A saved player's short is the score board's three-letter code: the start of
// their name until they type one of their own.
export const shortOf = (player) => player.short || player.name.trim().slice(0, 3)

// A stable id the match records can point at, even after the player is renamed.
export function newPlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

// Players are always shown as a three-letter, uppercase code on the boards.
export const code = (name) => name.slice(0, 3).toUpperCase()

// Every player owns a two-colour palette; the score board alternates the pair
// row by row so a column reads as one player's kit. A player who is not acting
// wears the anonymous two-grey pair instead.
const PLAYER_PALETTES = ['one', 'two', 'three', 'four']

export const playerPalette = (index, acting) => {
  if (!acting) {
    return {
      '--player-base': 'var(--spectator-grey)',
      '--player-shade': 'var(--spectator-grey-deep)',
    }
  }
  const name = PLAYER_PALETTES[index]
  return {
    '--player-base': `var(--player-${name}-base)`,
    '--player-shade': `var(--player-${name}-shade)`,
  }
}

// The saved list, with the ids players saved before the stats screen never had.
// Both screens read through here, so a list opened straight from the menu is
// migrated before a match can be started from it.
export function usePlayers() {
  const [players, setPlayers, loaded] = usePersistentState('darts.players', [])

  useEffect(() => {
    if (!loaded || !players.some((player) => !player.id)) return
    setPlayers((current) =>
      current.map((player) => (player.id ? player : { ...player, id: newPlayerId() })),
    )
  }, [loaded, players, setPlayers])

  return [players, setPlayers, loaded]
}
