import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { strategyApiPlugin } from './server/vite-plugin-strategy-api.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), strategyApiPlugin()],
  server: {
    fs: {
      // Vite's strict allow-list treats any `:` in a path as invalid on macOS/Linux
      // (see isFileLoadingAllowed in Vite). Folders like `Challenges:Hackathons` then
      // always get 403 even though they're the real project root — disable strict for dev.
      strict: false,
    },
  },
})
