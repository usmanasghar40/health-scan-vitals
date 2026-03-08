#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[deploy] Installing dependencies"
npm ci

echo "[deploy] Building frontend bundle"
npm run build

echo "[deploy] Removing dev dependencies"
npm prune --omit=dev

echo "[deploy] Restarting Node app"
mkdir -p tmp
touch tmp/restart.txt

echo "[deploy] Deployment complete"
