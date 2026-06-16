#!/usr/bin/env bash
# Deploy script for Ragulin Realty.
# Pulls latest code from git, rebuilds backend & frontend, restarts services.
# Run on the server: cd /opt/ragulin-realty && ./deploy.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
BACKEND_SERVICE="ragulin-backend"

log() { echo -e "\033[1;36m==> $1\033[0m"; }

cd "$REPO_DIR"

log "Pulling latest changes from git..."
git pull --ff-only

# ── Backend ───────────────────────────────────────────────────────────────
log "Updating backend dependencies..."
"$BACKEND_DIR/venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

log "Running database migrations..."
(cd "$BACKEND_DIR" && "$BACKEND_DIR/venv/bin/alembic" upgrade head)

log "Restarting backend service ($BACKEND_SERVICE)..."
sudo systemctl restart "$BACKEND_SERVICE"
sudo systemctl --no-pager status "$BACKEND_SERVICE" | head -5

# ── Frontend ──────────────────────────────────────────────────────────────
log "Installing frontend dependencies..."
(cd "$FRONTEND_DIR" && npm ci)

log "Building frontend..."
(cd "$FRONTEND_DIR" && npm run build)

log "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

log "Deploy finished successfully."
