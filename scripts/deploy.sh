#!/usr/bin/env bash
set -euo pipefail

# Azure deployment script for SoundPillow server
# Usage: npm run deploy

APP_NAME="sound-pillow"
RESOURCE_GROUP="appsvc_linux_southeastasia"
STAGING_DIR="/tmp/server-prod"
ZIP_PATH="/tmp/server-deploy.zip"
SERVER_DIR="$(cd "$(dirname "$0")/../server" && pwd)"

# Ensure az CLI is available
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
if ! command -v az &>/dev/null; then
  echo "❌ Azure CLI not found. Install it first."
  exit 1
fi

echo "📦 Packaging server..."
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp "$SERVER_DIR/package.json" "$STAGING_DIR/"
cp -r "$SERVER_DIR/dist" "$STAGING_DIR/"
cp -r "$SERVER_DIR/data" "$STAGING_DIR/"

cd "$STAGING_DIR"
npm install --omit=dev --silent

rm -f "$ZIP_PATH"
zip -rq "$ZIP_PATH" .

echo "🚀 Deploying to Azure ($APP_NAME)..."
az webapp deployment source config-zip \
  -n "$APP_NAME" \
  -g "$RESOURCE_GROUP" \
  --src "$ZIP_PATH" \
  --output none

echo "✅ Deployed! Verifying..."
sleep 5
HEALTH=$(curl -sf "https://${APP_NAME}-emdgctephrfpbcf3.southeastasia-01.azurewebsites.net/api/health" || echo '{"ok":false}')
echo "   Health: $HEALTH"

rm -rf "$STAGING_DIR" "$ZIP_PATH"
echo "🌙 Done."
