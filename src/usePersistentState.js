import { useEffect, useState } from 'react'
import { Preferences } from '@capacitor/preferences'

/**
 * useState that reads from and writes to on-device storage (Capacitor
 * Preferences) so the value survives app restarts and is shared with the
 * native layer on Android.
 */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(initialValue)
  const [loaded, setLoaded] = useState(false)

  // Load once per key. Nothing is written until the read has finished, so a
  // slow read can never overwrite stored data with the initial value.
  useEffect(() => {
    let cancelled = false

    Preferences.get({ key })
      .then(({ value: stored }) => {
        if (cancelled || stored === null) return
        try {
          setValue(JSON.parse(stored))
        } catch {
          // Unreadable value: keep the initial one and let the next write replace it.
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    if (!loaded) return
    Preferences.set({ key, value: JSON.stringify(value) }).catch((error) => {
      console.error(`Could not persist "${key}"`, error)
    })
  }, [key, value, loaded])

  return [value, setValue, loaded]
}
