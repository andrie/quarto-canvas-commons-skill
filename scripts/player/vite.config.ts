import { defineConfig } from "vite";

// One classic script, because the extension adds it as a plain <script src> (no type="module").
export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: "src/main.ts",
      formats: ["iife"],
      name: "CanvasCommonsPlayer",
      fileName: () => "canvas-commons-bundle.js",
    },
  },
});
