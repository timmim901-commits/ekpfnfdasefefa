#!/usr/bin/env bash
# export-pdf.sh - render a frontend-slides deck to PDF via headless Chromium.
#
# Usage:
#   scripts/export-pdf.sh index.html deck.pdf
#
# One page per slide at 1920x1080 (16:9). Deck must use the standard
# navigation JS: this script loads it with ?p=N to jump to each slide
# and prints that slide alone.
set -euo pipefail

INPUT="${1:-index.html}"
OUTPUT="${2:-deck.pdf}"

if [[ ! -f "$INPUT" ]]; then
  echo "input not found: $INPUT" >&2
  exit 2
fi

# Pick a Chromium binary.
BIN=""
for c in chromium chromium-browser google-chrome chrome \
         /opt/pw-browsers/chromium/chrome-linux/chrome \
         /opt/pw-browsers/chromium/chrome-linux64/chrome; do
  if command -v "$c" >/dev/null 2>&1 || [[ -x "$c" ]]; then
    BIN="$c"; break
  fi
done
if [[ -z "$BIN" ]]; then
  echo "no chromium binary found; install chromium or set BIN=/path/to/chrome" >&2
  exit 3
fi

# Count slides.
N=$(grep -c 'class="slide' "$INPUT" || true)
if [[ "$N" -lt 1 ]]; then
  echo "no .slide sections found in $INPUT" >&2
  exit 4
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

ABS=$(readlink -f "$INPUT")
PAGES=()
for i in $(seq 1 "$N"); do
  PAGE="$TMP/slide-$i.pdf"
  "$BIN" --headless=new --disable-gpu --no-sandbox \
    --virtual-time-budget=2000 \
    --print-to-pdf="$PAGE" \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    --window-size=1920,1080 \
    "file://$ABS?p=$i" >/dev/null 2>&1
  PAGES+=("$PAGE")
done

# Merge. Prefer pdfunite (poppler), fall back to ghostscript, else first page.
if command -v pdfunite >/dev/null 2>&1; then
  pdfunite "${PAGES[@]}" "$OUTPUT"
elif command -v gs >/dev/null 2>&1; then
  gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile="$OUTPUT" "${PAGES[@]}"
else
  echo "warning: neither pdfunite nor gs found; writing first slide only" >&2
  cp "${PAGES[0]}" "$OUTPUT"
fi

echo "wrote $OUTPUT ($N slides)"
