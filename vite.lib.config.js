/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname (fileURLToPath (import.meta.url ))

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'lib'),
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'umd'],
      name: 'Hyperparam',
      fileName: (format) => `index.${format}.min.js`,
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react/jsx-runtime': 'jsx',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
  test: { environment: 'jsdom', globals: true },
})
