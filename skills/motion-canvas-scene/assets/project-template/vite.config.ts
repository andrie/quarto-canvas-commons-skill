import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'motion-canvas-ts.html',
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
    },
  },
});
