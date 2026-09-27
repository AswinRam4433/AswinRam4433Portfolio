#!/usr/bin/env bash
#
# Build the site exactly the way CI does.
#
#   Hugo  →  blogs/public/      long-form content, rendered from Markdown
#         →  blogs/public/**/index.json   feeds consumed by the root pages
#
# then assembles everything Vercel serves into dist/:
#
#   dist/index.html          ← hand-written root pages
#   dist/blog.html
#   dist/bookshelf.html
#   dist/css/ dist/js/ ...   ← assets and images
#   dist/blogs/...           ← Hugo output, served under /blogs/
#
# Usage:
#   bash scripts/build.sh
#   python3 -m http.server -d dist 8000    # preview at http://localhost:8000
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d blogs/themes/blowfish ]; then
  echo "✗ blogs/themes/blowfish is missing — the theme is gitignored and must be" >&2
  echo "  downloaded once after cloning. See README.md → Local development." >&2
  exit 1
fi

echo "→ Building Hugo site"
# Wipe previous Hugo output first. Hugo does not delete destinations it no
# longer generates, so a page that stops being built — e.g. an entry that was
# published and then set to `draft: true` — would otherwise survive as stale
# HTML in books/public/ and get deployed anyway. A fresh checkout (what CI
# does) never has this problem; a local rebuild does.
rm -rf blogs/public
# --buildDrafts=false is passed explicitly (CLI flags beat config) so a draft
# can never reach production even if `buildDrafts` in config/_default/hugo.toml
# is ever flipped to true by accident. This build is what CI deploys.
# To preview drafts locally, use `hugo server --source blogs/ -D` instead.
hugo --source blogs/ --minify --buildDrafts=false

echo "→ Assembling dist/"
rm -rf dist
mkdir -p dist
# Every .html at the repo root becomes a top-level page, so a new page ships
# without editing this script or the workflow.
cp ./*.html bazinga.png github-mark-white.png CNAME dist/
cp -r css js dist/
cp -r blogs/public dist/blogs

echo "✓ dist/ ready — $(find dist -type f | wc -l | tr -d ' ') files"
echo "  preview with: python3 -m http.server -d dist 8000"
