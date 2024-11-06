/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dts()],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'umd'],
      name: 'Components',
      fileName: (format) => `index.${format}.js`,
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
