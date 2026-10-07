import { defineConfig } from "vite";
import motionCanvas from "@canvas-commons/vite-plugin";

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
  // Emit asset URLs (imported images) relative to the bundle. With the default "/" the deck requests them from the site root, gets a 404, and the player stays black.
  base: "./",
  // yoga-layout uses top-level await, which the dev server's default es2020 pre-bundling target rejects. Without this, `vite` fails on start.
  optimizeDeps: { esbuildOptions: { target: "esnext" } },
  build: {
    // The output sits outside this directory, so vite will not empty it unless told to. Emptying it on each build removes the bundles of deleted scenes. It never touches the player bundle in ../dist.
    outDir: "../dist/animations",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
    },
  },
});
