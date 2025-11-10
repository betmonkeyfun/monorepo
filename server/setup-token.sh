#!/bin/bash

# Setup Token System for BetMonkey Casino
# This script configures the token system integration

set -e

echo "=================================================="
echo "BetMonkey Token System Setup"
echo "=================================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from env.example..."
    cp env.example .env
fi

# Token configuration
TOKEN_MINT="6wfhcne5ARYsuXTLQKQmrZJYuZfTngXur9QXw2YUsKfd"
TOKEN_AGENT_KEY="WzEyMCwxMTQsMjU1LDE1NSwyMTgsMTAzLDExLDIzNiwyNiwyMjUsMTM2LDIyLDEzOSwyMTcsMTg2LDM2LDM3LDMsMjU0LDU3LDI0MSw0MSwxNDYsMTQxLDU5LDIwOCwxMTUsMTkyLDIzLDExMyw4LDUwLDgsMjA0LDE1OCwxOTcsMTYsMTc0LDExMiw4NSwzLDExNiwzMiw4LDE4NSwyMzIsMTE1LDc1LDc0LDQ2LDE2MiwyNDQsMTk5LDIxOCwxOCwxNzksMjEwLDE4NiwxNjUsNzksMjI4LDI0OSw5LDk3XQo="

echo "Configuring token system..."

# Check if token config already exists
if grep -q "TOKEN_MINT=" .env; then
    echo "Token configuration found, updating..."
    sed -i.bak "s|TOKEN_MINT=.*|TOKEN_MINT=$TOKEN_MINT|" .env
    sed -i.bak "s|TOKEN_AGENT_PRIVATE_KEY=.*|TOKEN_AGENT_PRIVATE_KEY=$TOKEN_AGENT_KEY|" .env
    rm .env.bak 2>/dev/null || true
else
    echo "Adding token configuration to .env..."
    echo "" >> .env
    echo "# Token System Configuration" >> .env
    echo "TOKEN_MINT=$TOKEN_MINT" >> .env
    echo "TOKEN_AGENT_PRIVATE_KEY=$TOKEN_AGENT_KEY" >> .env
    echo "TOKEN_UPDATE_INTERVAL=60000" >> .env
fi

echo ""
echo "Token Configuration:"
echo "  Mint Address: $TOKEN_MINT"
echo "  Network: devnet"
echo "  Update Interval: 60 seconds"
echo ""

echo "Installing dependencies..."
npm install

echo ""
echo "Building project..."
npm run build

echo ""
echo "=================================================="
echo "Token System Setup Complete!"
echo "=================================================="
echo ""
echo "Token Features:"
echo "  - Dynamic pricing based on casino reserves"
echo "  - Bonding curve algorithm"
echo "  - Real-time price updates"
echo "  - Buy/Sell API endpoints"
echo ""
echo "API Endpoints:"
echo "  GET  /token/price          - Current token price"
echo "  GET  /token/stats          - Market statistics"
echo "  GET  /token/quote/buy      - Get buy quote"
echo "  GET  /token/quote/sell     - Get sell quote"
echo "  POST /token/buy            - Execute buy"
echo "  POST /token/sell           - Execute sell"
echo "  GET  /token/history        - Price history"
echo "  GET  /token/transactions   - Recent transactions"
echo "  GET  /token/info           - Token metadata"
echo ""
echo "To start the casino with token system:"
echo "  npm run dev:casino"
echo ""
echo "Or start all services:"
echo "  npm run dev"
echo ""
