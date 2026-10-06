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
[ $status -eq 0 ] && echo "OK: no stale references"
exit $status
