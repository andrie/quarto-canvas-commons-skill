# Regenerating the generated reference data

Maintainer-only. Not needed to use the skill.

Regenerate only when Canvas Commons ships an API-affecting version, and record the new version and commit in the "Generated reference data" heading of `SKILL.md`. The generators read TypeScript sources and docs from a clone and build nothing. They need only the `typescript` package.

```bash
git clone --depth 1 https://github.com/canvas-commons/canvas-commons /tmp/cc   # check packages/core/package.json says the version you want
cd skills/motion-canvas-api
TS=/path/to/node_modules/typescript   # e.g. a project's animations/node_modules/typescript, or `npm install --no-save typescript` in a temp directory
node scripts/generate-api-search.js --repo /tmp/cc --ts $TS --out references/api-search-index.json
node scripts/generate-component-hierarchy.js --repo /tmp/cc --ts $TS --out references/component-hierarchy.md
```

The generator tests need `typescript` too: run them with `TS_PATH=$TS node --test tests/*.test.js` or after `npm install --no-save typescript`. Without it they fail on purpose; set `SKIP_GENERATOR_TESTS=1` to skip them explicitly.

Do not rely on building the clone. At commit 2da1d4a the repo uses pnpm (there is no lerna), `pnpm install --frozen-lockfile` works, but `pnpm run build` and `pnpm run docs:build` both failed here (tsdown cannot import `unrun`; Docusaurus fails without the built packages), under pnpm 10 and under the pinned pnpm 11.0.8.
