#!/usr/bin/env bash
# Box-side daily refresh: pull public job feeds, publish the here.now preview, and
# commit the new data to GitHub. Safe to run by hand or from a scheduled routine.
#   bash /workspace/vil-rebuild/github-push/scripts/refresh_and_publish.sh
set -euo pipefail

REPO="${REPO:-/workspace/vil-rebuild/github-push}"
SITE="${SITE:-/workspace/vil-rebuild/site}"
PUBLISH="${PUBLISH:-/workspace/publish-here-now.sh}"
SLUG="${SLUG:-mineral-soul-hbbv}"
LOG_DIR="${LOG_DIR:-/workspace/vil-rebuild/logs}"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/refresh-$(date +%Y%m%d-%H%M).log"
exec > >(tee -a "$LOG") 2>&1

echo "== $(date) refresh start"
cd "$REPO"
git pull --rebase --autostash origin main || echo "warning: git pull failed, continuing with local copy"

python3 scripts/build_jobs.py

# Sync the public site files into the here.now publish folder (no docs, scripts, or git data).
mkdir -p "$SITE/data"
cp -r ./*.html assets "$SITE/"
cp data/jobs.json data/meta.json data/mos.json "$SITE/data/"
cp README.md "$SITE/"

(cd "$SITE" && bash "$PUBLISH" . --slug "$SLUG" --client gilfoyle)

git add data/jobs.json data/meta.json
if git diff --cached --quiet; then
  echo "No job changes to commit."
else
  git commit -m "Refresh jobs data $(date -u +%Y-%m-%d)"
  git push origin main || echo "warning: git push failed; data is still live on the preview"
fi
echo "== $(date) refresh done"
