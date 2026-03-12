#!/usr/bin/env bash
#
# Deploy the SoundPillow Express server to Azure App Service.
#
# Prerequisites:
#   - Azure CLI (`az`) installed and logged in
#   - Java (`jar`) on PATH (used instead of PowerShell's Compress-Archive
#     because the latter creates zips with Windows backslashes that break
#     rsync on the Linux App Service host)
#   - Node.js / npm
#
# Usage:
#   bash scripts/deploy-server.sh
#
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
APP_NAME="sound-pillow"
RESOURCE_GROUP="appsvc_linux_southeastasia"
SERVER_DIR="server"
DEPLOY_STAGING="deploy-staging"
ZIP_FILE="deploy.zip"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# ── Cleanup on exit (success, failure, or Ctrl+C) ───────────────────────────
cleanup() {
  echo "==> Cleaning up staging files..."
  rm -rf "$PROJECT_ROOT/$DEPLOY_STAGING" "$PROJECT_ROOT/$ZIP_FILE"
}
trap cleanup EXIT

# ── Step 1: Build the server ─────────────────────────────────────────────────
echo "==> Building server TypeScript..."
cd "$SERVER_DIR"
npm run build
echo "    Build complete."

# ── Step 2: Stage deployment files ───────────────────────────────────────────
echo "==> Staging deployment files..."
cd "$PROJECT_ROOT"
rm -rf "$DEPLOY_STAGING" "$ZIP_FILE"
mkdir -p "$DEPLOY_STAGING"

# Copy compiled JS (dist/), runtime data, package files
cp -r "$SERVER_DIR/dist"        "$DEPLOY_STAGING/dist"
cp -r "$SERVER_DIR/data"        "$DEPLOY_STAGING/data"
cp    "$SERVER_DIR/package.json" "$DEPLOY_STAGING/package.json"

# Install production dependencies only
echo "==> Installing production dependencies..."
cd "$DEPLOY_STAGING"
npm install --omit=dev
echo "    Dependencies installed."

# ── Step 3: Create zip with jar (avoids Windows backslash issue) ─────────────
echo "==> Creating deployment zip (using jar)..."
cd "$PROJECT_ROOT/$DEPLOY_STAGING"
jar -cMf "$PROJECT_ROOT/$ZIP_FILE" .
cd "$PROJECT_ROOT"
echo "    Zip created: $ZIP_FILE"

# ── Step 4: Deploy to Azure via az webapp deploy ─────────────────────────────
echo "==> Deploying to Azure App Service ($APP_NAME)..."
az webapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path "$ZIP_FILE" \
  --type zip

# ── Step 5: Health check ─────────────────────────────────────────────────────
echo "==> Running health check..."
APP_HOSTNAME=$(az webapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostName" -o tsv)
APP_URL="https://${APP_HOSTNAME}"
MAX_RETRIES=10
RETRY_DELAY=10

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "    Health check passed!"
    RESPONSE=$(curl -s "$APP_URL/api/health")
    echo "    Response: $RESPONSE"
    break
  fi
  if [ "$i" = "$MAX_RETRIES" ]; then
    echo "    WARNING: Health check failed after $MAX_RETRIES attempts (last HTTP $HTTP_CODE)"
    echo "    The deployment may still be starting up. Check manually:"
    echo "      curl $APP_URL/api/health"
    exit 1
  fi
  echo "    Attempt $i/$MAX_RETRIES - HTTP $HTTP_CODE, retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done

echo ""
echo "==> Deployment complete!"
echo "    App URL: $APP_URL"
