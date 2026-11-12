#!/usr/bin/env bash
# Build aplikasi lalu kirim isi dist/ ke branch gh-pages (GitHub Pages).
# Pakai: npm run deploy   (dari Git Bash)
# Hasil: https://hanisarinurahman.github.io/Apk_HanisariNurahman_2225250108/
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=$(git remote get-url origin)
npm run build
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "$REMOTE" gh-pages
rm -rf .git
echo "Terkirim. Situs diperbarui dalam 1–3 menit."
