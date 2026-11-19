import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

// The group's record is one JSON file and nothing else. There is no server: a
// phone writes the file and hands it to any app on the share sheet (WhatsApp,
// Drive, Quick Share), a friend opens that file in the Group screen, and the two
// records are folded together. Importing only adds, so an older file can be read
// at any time without erasing a match the other phone filed since.

export const DOC_VERSION = 1

// Saved players are add-only, so two files can be merged by id and never
// disagree; a deleted player is a tombstone in the list of deleted ids, which
// wins wherever it arrives from.
export function mergePlayerList(local, incoming, deleted) {
  const dead = deleted instanceof Set ? deleted : new Set(deleted)
  const byId = new Map()
  local.forEach((player) => {
    if (player && !dead.has(player.id)) byId.set(player.id, player)
  })
  incoming.forEach((player) => {
    if (player && !dead.has(player.id) && !byId.has(player.id)) byId.set(player.id, player)
  })
  const next = [...byId.values()]
  const same =
    next.length === local.length && next.every((player, index) => player === local[index])
  return same ? local : next
}

// A filed match is immutable and carries its own id, so the newest 300 across
// both phones are the whole shared history.
export function mergeMatchList(local, incoming, limit) {
  const byId = new Map()
  local.forEach((match) => byId.set(match.id, match))
  incoming.forEach((match) => {
    if (match && !byId.has(match.id)) byId.set(match.id, match)
  })
  const next = [...byId.values()]
    .sort((a, b) => (a.endedAt < b.endedAt ? -1 : 1))
    .slice(-limit)
  const same =
    next.length === local.length && next.every((match, index) => match === local[index])
  return same ? local : next
}

// The whole record as it is handed over: plain arrays, because a file has no
// Firebase-shaped node to write into.
export function buildDoc({ players, matches, deletions }) {
  return {
    v: DOC_VERSION,
    exportedAt: new Date().toISOString(),
    players,
    matches,
    deletions,
  }
}

// A file from another phone, checked just enough that a wrong file says so
// instead of scattering nonsense through the record.
export function parseDoc(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('not a darts group file')
  }
  if (data === null || typeof data !== 'object' || data.v !== DOC_VERSION) {
    throw new Error('not a darts group file')
  }
  const list = (value) => (Array.isArray(value) ? value : [])
  return {
    players: list(data.players).filter((player) => player && typeof player === 'object'),
    matches: list(data.matches).filter((match) => match && typeof match === 'object'),
    deletions: list(data.deletions).filter((id) => typeof id === 'string'),
  }
}

// Fold an imported file into this phone's copy: the union of deletions, the
// add-only player list and the newest matches. The changed flags tell the caller
// whether anything is worth writing back into React state.
export function mergeDoc(local, incoming, limit) {
  const deletions = [...new Set([...local.deletions, ...incoming.deletions])]
  const dead = new Set(deletions)
  const players = mergePlayerList(local.players, incoming.players, dead)
  const matches = mergeMatchList(local.matches, incoming.matches, limit)

  return {
    players,
    matches,
    deletions,
    playersChanged: players !== local.players,
    matchesChanged: matches !== local.matches,
    deletionsChanged: deletions.length !== local.deletions.length,
  }
}

const fileName = () => `darts-${new Date().toISOString().slice(0, 10)}.json`

// Hand the file to another app. On the phone that is the Android share sheet
// over a cache file; in the browser it is a download, so the web build keeps
// working for development.
export async function shareDoc(doc) {
  const text = JSON.stringify(doc, null, 2)
  const name = fileName()

  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return
  }

  const { uri } = await Filesystem.writeFile({
    path: name,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({ title: 'Darts group', url: uri, dialogTitle: 'Share group file' })
}
