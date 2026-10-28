#!/bin/sh
# One-command start for macOS / Linux
cd "$(dirname "$0")"
if [ ! -d node_modules ] || [ ! -d server/node_modules ] || [ ! -d client/node_modules ]; then
  echo "Installing dependencies (first run only)..."
  npm run setup || exit 1
fi
npm run dev
