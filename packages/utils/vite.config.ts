/// <reference types="vitest/config" />
import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'umd'],
      name: 'HyparamUtils',
      fileName: (format) => `index.${format}.min.js`,
    },
    sourcemap: true,
  },
  test: { globals: true },
})
