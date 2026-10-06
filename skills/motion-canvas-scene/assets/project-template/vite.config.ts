import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
  ],
  build: {
    rollupOptions: {
      input: 'motion-canvas-ts.html',
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
      plugins: [
        copy({
          targets: [
            { 
              src: 'public/animations/*.js', 
              dest: 'dist/' 
            },
          //   { 
          //     src: 'public/animations/src/*.js', 
          //     dest: 'dist/animations/src/' 
          //   },
          //   { 
          //     src: 'animations/public/_fonts/', 
          //     dest: 'dist/public/_fonts/' 
          //   },
          //   // { 
          //   //   src: 'dist/animations/src', 
          //   //   dest: 'dist/animations/' 
          //   // },
          ],
          hook: 'writeBundle' // run the plugin after the bundle is written
        })
      ]
    },
  },
});
