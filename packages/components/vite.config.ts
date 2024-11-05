/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
    }),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      formats: ["es", "umd"],
      name: 'Components',
      fileName: (format) => `main.${format}.js`
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime", 'react-dom'],
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "jsx",
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
  test: { environment: "jsdom", globals: true },
});
