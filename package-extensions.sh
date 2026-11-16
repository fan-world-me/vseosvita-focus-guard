#!/usr/bin/env bash
# Vseosvita Focus Guard — build script (Linux / macOS / WSL)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/src"
DIST="$ROOT/dist"
MF="$ROOT/manifests"

rm -rf "$DIST"

for BROWSER in firefox chrome; do
    UNPACKED="$DIST/$BROWSER-unpacked"
    mkdir -p "$UNPACKED"

    cp "$SRC"/* "$UNPACKED/"
    cp "$MF/$BROWSER/manifest.json" "$UNPACKED/manifest.json"

    ZIP="$DIST/vseosvita-focus-guard-$BROWSER.zip"
    (cd "$UNPACKED" && zip -qr "$ZIP" .)
    echo "[OK] $BROWSER -> $ZIP"
done

XPI="$DIST/vseosvita-focus-guard-firefox.xpi"
cp "$DIST/vseosvita-focus-guard-firefox.zip" "$XPI"
echo "[OK] xpi  -> $XPI"

echo ""
echo "dist/"
ls -1 "$DIST" | sed 's/^/  /'
