import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte()
  ],
  server: {
    allowedHosts: ['accessory-processor-retained-roberts.trycloudflare.com'],
    proxy: {
      '/api/print': 'http://localhost:8080',
      '/api/printers': 'http://localhost:8080',
      '/api/printer/status': 'http://localhost:8080',
      '/api/server-info': 'http://localhost:8080',
    }
  }
})
