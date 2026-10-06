#!/usr/bin/env bash
# Symlink each skill into a skills directory so this repo stays the source of truth.
#
# Usage: install.sh [--dry-run] [--uninstall] [--target DIR]
#   --target DIR  skills directory (default: $HOME/.claude/skills)
#   --dry-run     print what would happen and change nothing
#   --uninstall   remove only symlinks that point into this repo's skills/
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
target="${HOME:?HOME is not set}/.claude/skills"
dry=0
uninstall=0

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --uninstall) uninstall=1 ;;
    --target)
      [ $# -ge 2 ] || { echo "error: --target needs a directory" >&2; exit 2; }
      target=$2; shift ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "error: unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

if [ ! -d "$repo/skills" ]; then
  echo "error: no skills/ directory found at $repo/skills" >&2
  exit 1
fi

run() { if [ "$dry" = 1 ]; then echo "dry-run: would $*"; else "$@"; fi; }

[ "$dry" = 1 ] && echo "dry-run: no changes will be made (target: $target)"

if [ "$uninstall" = 0 ]; then
  [ -d "$target" ] || run mkdir -p "$target"
  for d in "$repo"/skills/*/; do
    name=$(basename "$d")
    dest="$target/$name"
    if [ -e "$dest" ] && [ ! -L "$dest" ]; then
      echo "SKIP $name: real directory exists at $dest"
      continue
    fi
    if [ "$dry" = 1 ]; then
      echo "dry-run: would link $name -> $repo/skills/$name"
    else
      ln -sfn "$repo/skills/$name" "$dest"
      echo "linked $name"
    fi
  done
else
  for d in "$repo"/skills/*/; do
    name=$(basename "$d")
    dest="$target/$name"
    if [ ! -L "$dest" ]; then
      [ -e "$dest" ] && echo "SKIP $name: not a symlink"
      continue
    fi
    if [ "$(readlink "$dest")" != "$repo/skills/$name" ]; then
      echo "SKIP $name: symlink points elsewhere ($(readlink "$dest"))"
      continue
    fi
    if [ "$dry" = 1 ]; then
      echo "dry-run: would remove $dest"
    else
      rm "$dest"
      echo "removed $name"
    fi
  done
fi
