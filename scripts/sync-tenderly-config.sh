#!/bin/bash
# Syncs tenderly.json from mainnet.json, then applies any overrides
# from tenderly-overrides.json on top.
#
# Usage: ./scripts/sync-tenderly-config.sh
#
# To override a specific address for Tenderly, add it to
# config/tenderly-overrides.json, e.g.:
#   { "GEB_SAFE_ENGINE": "0xNewTenderlyAddress..." }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

MAINNET="$CONFIG_DIR/mainnet.json"
OVERRIDES="$CONFIG_DIR/tenderly-overrides.json"
OUTPUT="$CONFIG_DIR/tenderly.json"

if [ ! -f "$MAINNET" ]; then
  echo "Error: $MAINNET not found"
  exit 1
fi

# Start from mainnet
cp "$MAINNET" "$OUTPUT"

# Apply overrides if the file exists and is non-empty
if [ -f "$OVERRIDES" ] && [ -s "$OVERRIDES" ]; then
  # Use node to merge since it's already a project dependency
  node -e "
    const fs = require('fs');
    const mainnet = JSON.parse(fs.readFileSync('$OUTPUT', 'utf8'));
    const overrides = JSON.parse(fs.readFileSync('$OVERRIDES', 'utf8'));
    const merged = { ...mainnet, ...overrides };
    fs.writeFileSync('$OUTPUT', JSON.stringify(merged, null, 2) + '\n');
  "
  echo "Synced config/tenderly.json from mainnet.json with overrides applied"
else
  echo "Synced config/tenderly.json from mainnet.json (no overrides)"
fi
