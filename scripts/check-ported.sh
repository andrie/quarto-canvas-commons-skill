#!/usr/bin/env bash
# Fails if any ported skill still mentions the old scope, or the drifted TEXT colour.
set -u
cd "$(dirname "$0")/.."
status=0
if grep -rn "@motion-canvas/" skills seed --include='*.md' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' | grep -v 'PORT-NOTE'; then
  echo "FAIL: old @motion-canvas/ scope found (mark deliberate mentions with PORT-NOTE)"; status=1
fi
if grep -rnE "TEXT[^A-Za-z]*['\"]?#447099" skills seed; then
  echo "FAIL: Colors.TEXT drifted to #447099"; status=1
fi
if grep -rnE "@canvas-commons/(2d|core)/lib/" skills seed --include='*.ts' --include='*.tsx' | grep -v 'PORT-NOTE'; then
  echo "FAIL: deep import of @canvas-commons/(2d|core)/lib/ (0.4.0 exposes only the package root; mark deliberate mentions with PORT-NOTE)"; status=1
fi
# Line's startOffset, endOffset and lineDashOffset do not match: only the bare node props offsetX/offsetY do.
if grep -rnE "\boffset[XY]\b" skills seed --include='*.ts' --include='*.tsx' --include='*.js' --include='*.md' | grep -v 'PORT-NOTE'; then
  echo "FAIL: offsetX/offsetY node props are anchorX/anchorY in 0.4.0 (mark deliberate migration notes with PORT-NOTE)"; status=1
fi
[ $status -eq 0 ] && echo "OK: no stale references"
exit $status
