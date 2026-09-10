import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` permite servir la app desde https://<usuario>.github.io/fit/
// En local (dev/preview) siempre se sirve desde la raiz.
const base = process.env.APP_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
