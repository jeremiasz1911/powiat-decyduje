#!/bin/bash

set -e

PROJECTS_DIR="$HOME/Documents/custom"
KEEP_PROJECT="$PROJECTS_DIR/powiat-decyduje"

echo "🧹 Safe cleanup macOS dev cache"
echo "Pomijam aktywny projekt: $KEEP_PROJECT"
echo ""

echo "1. Usuwam node_modules poza powiat-decyduje..."
find "$PROJECTS_DIR" \
  -path "$KEEP_PROJECT" -prune -o \
  -name node_modules -type d -prune -exec rm -rf {} +

echo "2. Usuwam build/cache poza powiat-decyduje..."
find "$PROJECTS_DIR" \
  -path "$KEEP_PROJECT" -prune -o \
  \( -name ".next" -o -name "dist" -o -name "build" -o -name ".expo" -o -name ".turbo" -o -name ".cache" \) \
  -type d -prune -exec rm -rf {} +

echo "3. Czyszczę npm cache..."
npm cache clean --force || true

echo "4. Czyszczę Expo cache..."
rm -rf "$HOME/.expo"

echo "5. Czyszczę Metro / React Native temp..."
rm -rf "$TMPDIR/metro-"*
rm -rf "$TMPDIR/react-"*
rm -rf "$TMPDIR/haste-map-"*

echo "6. Czyszczę Gradle cache..."
rm -rf "$HOME/.gradle/caches"

echo "7. Czyszczę Xcode DerivedData..."
rm -rf "$HOME/Library/Developer/XcodedData"

echo "8. Usuwam niedostępne iOS simulatory..."
xcrun simctl delete unavailable || true

echo "9. Czyszczę Homebrew cache..."
brew cleanup || true

echo "10. Czyszczę CocoaPocache..."
rm -rf "$HOME/Library/Caches/CocoaPods"

echo "11. Czyszczę TypeScript cache..."
rm -rf "$HOME/Library/Caches/typescript"

echo ""
echo "✅ Gotowe."
echo "Sprawdź miejsce:"
df -h
