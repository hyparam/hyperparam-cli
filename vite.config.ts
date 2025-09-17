import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/ and
// https://vitest.dev/config/#configuring-vitest
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  test: { environment: 'jsdom', globals: true },
})
