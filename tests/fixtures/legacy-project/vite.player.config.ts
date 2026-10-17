import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // The animations build writes to dist/animations; do not let this build wipe it.
    emptyOutDir: false,
    rollupOptions: {
      input: 'motion-canvas-ts.html',
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
    },
  },
});
