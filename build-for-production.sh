#!/bin/bash
set -e

echo "========================================================"
echo "  JOBBYCART ATS - PRODUCTION BUILD FOR HOSTINGER"
echo "========================================================"

cd "$(dirname "$0")/frontend"
echo "[1/3] Compiling React Vite Frontend..."
npm run build

echo "[2/3] Merging frontend assets into backend/public/..."
mkdir -p ../backend/public/assets
cp -f dist/index.html ../backend/public/index.html
cp -rf dist/assets/* ../backend/public/assets/
cp -f public/jobbycart-logo.png ../backend/public/jobbycart-logo.png

echo "[3/3] Build complete!"
echo "The 'backend' directory now contains both Laravel and the React frontend."
