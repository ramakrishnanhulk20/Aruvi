#!/bin/bash
# Deploy Aruvi to Vercel with environment variables
# Usage: ./deploy-vercel.sh [usdc|xusd] [--production]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CONTRACT_SYSTEM="${1:-usdc}"
PRODUCTION="${2}"

echo -e "${BLUE}🚀 Aruvi Vercel Deployment Script${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Validate contract system
if [[ "$CONTRACT_SYSTEM" != "usdc" && "$CONTRACT_SYSTEM" != "xusd" ]]; then
    echo -e "${RED}❌ Invalid contract system. Use 'usdc' or 'xusd'${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Load contract addresses
ENV_FILE="contracts/.env.${CONTRACT_SYSTEM}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Contract environment file not found: $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using ${CONTRACT_SYSTEM^^} contract system${NC}"
echo ""

# Parse env file
declare -A ENV_VARS
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes and whitespace
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    ENV_VARS[$key]=$value
done < "$ENV_FILE"

# Prompt for user-specific variables
echo -e "${YELLOW}📝 Please provide the following configuration:${NC}"
echo ""

read -p "Sepolia RPC URL (e.g., https://sepolia.infura.io/v3/YOUR_KEY): " SEPOLIA_RPC
if [ -z "$SEPOLIA_RPC" ]; then
    echo -e "${RED}❌ Sepolia RPC URL is required${NC}"
    exit 1
fi

read -p "WalletConnect Project ID (get from https://cloud.walletconnect.com): " WALLETCONNECT_ID
if [ -z "$WALLETCONNECT_ID" ]; then
    echo -e "${RED}❌ WalletConnect Project ID is required${NC}"
    exit 1
fi

read -p "JWT Secret (press Enter to generate random): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✓ Generated random JWT secret${NC}"
fi

# Build environment variables
declare -A DEPLOY_VARS=(
    ["NEXT_PUBLIC_CHAIN_ID"]="11155111"
    ["NEXT_PUBLIC_SEPOLIA_RPC"]="$SEPOLIA_RPC"
    ["NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"]="$WALLETCONNECT_ID"
    ["NEXT_PUBLIC_RELAYER_URL"]="https://relayer.testnet.zama.org"
    ["NEXT_PUBLIC_XUSD_ADDRESS"]="${ENV_VARS[XUSD_ADDRESS]}"
    ["NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS"]="${ENV_VARS[PAYMENT_GATEWAY_ADDRESS]}"
    ["NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS"]="${ENV_VARS[PRODUCT_REGISTRY_ADDRESS]}"
    ["NEXT_PUBLIC_REFUND_MANAGER_ADDRESS"]="${ENV_VARS[REFUND_MANAGER_ADDRESS]}"
    ["NEXT_PUBLIC_USDC_ADDRESS"]="${ENV_VARS[USDC_ADDRESS]}"
    ["JWT_SECRET"]="$JWT_SECRET"
)

echo ""
echo -e "${BLUE}📋 Environment Variables to be set:${NC}"
echo ""
for key in "${!DEPLOY_VARS[@]}"; do
    if [ "$key" == "JWT_SECRET" ]; then
        echo "  $key = ***hidden***"
    else
        echo "  $key = ${DEPLOY_VARS[$key]}"
    fi
done | sort
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
    exit 0
fi

# Set environment variables in Vercel
echo -e "${BLUE}📤 Setting environment variables in Vercel...${NC}"
echo ""

SCOPE="preview,development"
if [ "$PRODUCTION" == "--production" ]; then
    SCOPE="production"
fi

for key in "${!DEPLOY_VARS[@]}"; do
    value="${DEPLOY_VARS[$key]}"
    echo "Setting $key..."
    
    # Remove existing variable (ignore errors)
    vercel env rm "$key" $SCOPE --yes 2>/dev/null || true
    
    # Add new variable
    echo "$value" | vercel env add "$key" $SCOPE
done

echo ""
echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Deploy
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
echo ""

cd frontend

if [ "$PRODUCTION" == "--production" ]; then
    vercel --prod
else
    vercel
fi

cd ..

echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Verify deployment at the URL shown above"
echo "  2. Test wallet connection"
echo "  3. Test wrap/unwrap functionality"
echo "  4. Test payment flow"
echo ""
