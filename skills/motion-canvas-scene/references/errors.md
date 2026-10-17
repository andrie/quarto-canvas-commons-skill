# Common errors and fixes

Match the error text from `tsc`, `vite build` or the browser console against the tables below.

### TypeScript errors (from `tsc`)

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module './scenes/<name>?scene'` | Scene file doesn't exist or path is wrong | Check filename matches import in .ts project file |
| `Type 'X' is not assignable to type 'Y'` | Wrong property type | Check API for correct type (e.g., number vs string) |
| `Property 'X' does not exist on type 'Y'` | Typo in property name or missing import | Check node type supports the property. `offset`, `offsetX` and `offsetY` are now `anchor`, `anchorX` and `anchorY` | <!-- PORT-NOTE: deliberate migration note -->
| `Cannot find module '@canvas-commons/2d/lib/components'` (or any `lib/...` path) | 0.4.0 has no deep imports; the package `exports` map only exposes the root | Import from `@canvas-commons/2d` or `@canvas-commons/core`. Fix these first: they cascade into misleading errors such as `Property 'width' does not exist on type 'Database'` |
| `Could not find a declaration file for module 'chroma-js'` or `Export assignment cannot be used when targeting ECMAScript modules` | Type errors inside the library's own `.d.ts` files | Set `"skipLibCheck": true` in `animations/tsconfig.json` |
| `Implicit 'any' type` for community parsers | Missing type declarations for `lezer-r` etc. | Add a `.d.ts` file: `declare module 'lezer-r' { ... }` |

### Vite errors (from `vite build`)

| Error | Cause | Fix |
|-------|-------|-----|
| `Could not resolve './src/<name>.ts'` | Project file not registered in vite.config.ts | Add to `project` array |
| `Failed to resolve import` | Missing npm dependency | Run `npm --prefix ./animations install <package>` |
| `"@canvas-commons/vite-plugin" resolved to an ESM file. ESM file cannot be loaded by require` | The plugin is ESM-only and `animations/package.json` has no `"type": "module"` | Add `"type": "module"` to `animations/package.json` |
| `Cannot find module '@canvas-commons/editor'` | The vite plugin needs the editor package but does not declare it | Add `@canvas-commons/editor` to `devDependencies` in `animations/package.json` |

### Runtime errors (in browser)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank animation player | Wrong `src` path in shortcode | The shortcode path must be `./animations/src/<name>.js`; the player resolves it relative to `dist/`, so it must map to the built file `dist/animations/src/<name>.js` |
| Deployed deck is blank, network tab shows a 404 for `dist/animations/src/<name>.js` | The scene `.js` returned 404 on the host: `resources` is not recursive, or `dist/` was not uploaded | Set `resources: - dist/**` (not `dist/*/*`), and `curl` the deployed `dist/animations/src/<name>.js`. See "How the Makefile ties them together" in `references/project-architecture.md` |
| Animation doesn't appear | Player not loaded | Check the slide uses the `{{< canvas-commons >}}` shortcode (the extension adds the player only then) and that the rendered output lists `canvas-commons-bundle.js` under `<deck>_files/`. A project with an old `include-in-header` script for `motion-canvas-ts.js`: see "Moving a project to the bundled player" in `references/validate.md` |
| Colors wrong | Hardcoded hex instead of style constants | Use `Posit.blue`, `Colors.KEYWORD` etc. from styles.ts |
