#!/bin/bash
set -e

echo "Building Angular Application..."
cd archive
npm run build
cd ..

echo "Cleaning up old build files in root..."
rm -f main-*.js polyfills-*.js styles-*.css index.html 404.html favicon.ico 3rdpartylicenses.txt

echo "Deploying new build to root..."
cp -r archive/dist/archive/browser/* ./

echo "Clean up build directories..."
rm -rf archive/dist

echo "Deploy complete!"
