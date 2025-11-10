#!/bin/bash
# Complete deployment script for Fly.io
set -e

echo "🚀 BetMonkey Fly.io Deployment Script"
echo "======================================"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Please log in to Fly.io:"
    fly auth login
fi

# Check if app exists
APP_NAME="betmonkey-server"
if ! fly apps list | grep -q "$APP_NAME"; then
    echo "📱 Creating new Fly.io app: $APP_NAME"
    fly apps create "$APP_NAME" --org personal
else
    echo "✅ App $APP_NAME already exists"
fi

# Create volume if it doesn't exist
echo ""
echo "💾 Checking for persistent volume..."
if ! fly volumes list | grep -q "betmonkey_data"; then
    echo "Creating volume betmonkey_data (1GB)..."
    fly volumes create betmonkey_data --size 1 --region iad --yes
else
    echo "✅ Volume betmonkey_data already exists"
fi

# Set secrets
echo ""
echo "🔐 Setting up secrets..."
bash ./fly-secrets-setup.sh

# Deploy
echo ""
echo "🚢 Deploying to Fly.io..."
fly deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Useful commands:"
echo "   fly status              - Check app status"
echo "   fly logs               - View logs"
echo "   fly ssh console        - SSH into the container"
echo "   fly open               - Open app in browser"
echo "   fly dashboard          - Open Fly.io dashboard"
echo ""
echo "🌐 Your app will be available at: https://$APP_NAME.fly.dev"
