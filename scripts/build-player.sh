#!/usr/bin/env bash
# Build the player bundle and copy it into the extension, where the Lua adds it to every deck.
#
# Usage: build-player.sh [--check]
#   --check  build, then fail if the committed bundle differs (for CI); changes nothing
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
src="$repo/scripts/player"
dest="$repo/skills/motion-canvas-scene/assets/project-template/_extensions/andrie/motion-canvas/canvas-commons-bundle.js"

(cd "$src" && npm ci --silent && npm run build --silent)

if [ "${1:-}" = "--check" ]; then
  cmp -s "$src/dist/canvas-commons-bundle.js" "$dest" || { echo "error: $dest is stale; run scripts/build-player.sh" >&2; exit 1; }
  echo "ok: committed bundle matches a fresh build"
else
  cp "$src/dist/canvas-commons-bundle.js" "$dest"
  echo "wrote $dest"
fi
