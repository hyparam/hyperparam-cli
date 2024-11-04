/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  /// ^ https://github.com/vitejs/vite/discussions/15547#discussioncomment-8950765
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
        // assetFileNames: "assets/[name][extname]",
        // entryFileNames: "[name].js",
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
