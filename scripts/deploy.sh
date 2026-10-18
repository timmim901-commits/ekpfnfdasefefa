#!/usr/bin/env bash
# deploy.sh - publish a frontend-slides deck.
#
# Modes:
#   scripts/deploy.sh gh-pages [DIR]    # push DIR (default: .) to gh-pages
#   scripts/deploy.sh dir OUT [DIR]     # copy a build to OUT
#   scripts/deploy.sh serve [PORT]      # local preview, default port 8080
set -euo pipefail

MODE="${1:-serve}"

case "$MODE" in
  gh-pages)
    SRC="${2:-.}"
    if ! git -C "$SRC" rev-parse >/dev/null 2>&1; then
      echo "$SRC is not inside a git repo" >&2; exit 2
    fi
    BRANCH=gh-pages
    TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
    cp -R "$SRC"/* "$TMP"/
    git -C "$TMP" init -q
    git -C "$TMP" checkout -q -b "$BRANCH"
    git -C "$TMP" add -A
    git -C "$TMP" -c user.email=deploy@local -c user.name=deploy commit -q -m "deploy"
    REMOTE=$(git -C "$SRC" remote get-url origin)
    git -C "$TMP" push -q --force "$REMOTE" "$BRANCH"
    echo "pushed $SRC to $BRANCH on $REMOTE"
    ;;

  dir)
    OUT="${2:-}"
    SRC="${3:-.}"
    if [[ -z "$OUT" ]]; then echo "usage: deploy.sh dir OUT [SRC]" >&2; exit 2; fi
    mkdir -p "$OUT"
    cp -R "$SRC"/* "$OUT"/
    echo "copied $SRC to $OUT"
    ;;

  serve)
    PORT="${2:-8080}"
    echo "serving on http://localhost:$PORT (ctrl-c to stop)"
    python3 -m http.server "$PORT"
    ;;

  *)
    echo "unknown mode: $MODE" >&2
    echo "usage:" >&2
    echo "  deploy.sh gh-pages [DIR]" >&2
    echo "  deploy.sh dir OUT [DIR]" >&2
    echo "  deploy.sh serve [PORT]" >&2
    exit 2
    ;;
esac
