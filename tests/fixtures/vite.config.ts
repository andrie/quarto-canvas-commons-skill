import { defineConfig } from "vite";
import motionCanvas from "@canvas-commons/vite-plugin";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
    motionCanvas({
      project: [
        "./src/hexagons.ts",
        // "./src/retired.ts",
        "./src/infosec-triad.ts",
        "./src/multi-database.ts",
      ],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        dir: "../dist/animations",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },  
      plugins: [
      ],
    },
  },
});
