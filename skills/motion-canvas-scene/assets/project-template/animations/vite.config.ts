import { defineConfig } from "vite";
import motionCanvas from "@canvas-commons/vite-plugin";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
    motionCanvas({
      project: [
        "./src/smoke.ts",
      ],
    }),
  ],
  // Keep symlinked paths (the shared library at src/lib), or rollup resolves the real path and cannot find @canvas-commons/2d from library files.
  resolve: { preserveSymlinks: true },
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
