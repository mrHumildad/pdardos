import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset URLs so the bundle loads from Capacitor's local server,
  // a subpath, or a plain file without absolute paths breaking.
  base: './',
  build: {
    // The Android WebView on older devices is not evergreen, so keep the
    // bundle within ES2017 syntax instead of Vite's modern default target.
    target: 'es2017',
  },
})
