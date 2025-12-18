# Aruvi Deployment Guide

This guide covers deploying Aruvi to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **WalletConnect Project ID**: Get from https://cloud.walletconnect.com
3. **Sepolia RPC URL**: From Infura, Alchemy, or other provider
4. **Contracts Deployed**: Use addresses from `contracts/.env.usdc` or `contracts/.env.xusd`

## Quick Deploy (Recommended)

### Using PowerShell (Windows)

```powershell
# Deploy with USDC system to preview
.\scripts\deploy-vercel.ps1 -ContractSystem usdc

# Deploy with xUSD system to production
.\scripts\deploy-vercel.ps1 -ContractSystem xusd -Production
```

### Using Bash (Linux/Mac)

```bash
# Make script executable
chmod +x scripts/deploy-vercel.sh

# Deploy with USDC system to preview
./scripts/deploy-vercel.sh usdc

# Deploy with xUSD system to production
./scripts/deploy-vercel.sh xusd --production
```

The script will:
1. ✅ Load contract addresses from the chosen system
2. ✅ Prompt for required configuration (RPC URL, WalletConnect ID, JWT Secret)
3. ✅ Configure all environment variables in Vercel
4. ✅ Deploy your application

## Manual Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Link Project

```bash
cd frontend
vercel link
```

### Step 3: Set Environment Variables

Choose your contract system (USDC or xUSD) and set variables:

```bash
# Required for both systems
vercel env add NEXT_PUBLIC_CHAIN_ID
# Enter: 11155111

vercel env add NEXT_PUBLIC_SEPOLIA_RPC
# Enter: https://sepolia.infura.io/v3/YOUR_KEY

vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# Enter: your_walletconnect_project_id

vercel env add NEXT_PUBLIC_RELAYER_URL
# Enter: https://relayer.testnet.zama.org

vercel env add JWT_SECRET
# Enter: (generate with: openssl rand -base64 32)
```

#### For USDC System

```bash
vercel env add NEXT_PUBLIC_XUSD_ADDRESS
# Enter: 0x5f8D47C1f04D45869DbdB2A90487aCa663DaF5D1

vercel env add NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS
# Enter: 0x5B263646A0C1db5A8d4e859B69B4b0f331a91D9a

vercel env add NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS
# Enter: 0x4C99fA33eC25E42cf40C0e4dEDfb1a47bC87bA09

vercel env add NEXT_PUBLIC_REFUND_MANAGER_ADDRESS
# Enter: 0xaB4b07A5D50ae2a71a60D92B5ef3B5bca850c863

vercel env add NEXT_PUBLIC_USDC_ADDRESS
# Enter: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

#### For xUSD System

```bash
vercel env add NEXT_PUBLIC_XUSD_ADDRESS
# Enter: 0xbA89Abc54c413443Ba727DF9b6E7219D240e9c67

vercel env add NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS
# Enter: 0xEcC6317EE8Af2cE4aC8d20af22a3E51a7c7DBEa4

vercel env add NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS
# Enter: 0x7B5E03a1C9C2C02C88F95cC3a35a86e57F0C84BD

vercel env add NEXT_PUBLIC_REFUND_MANAGER_ADDRESS
# Enter: 0x9b2a4f29aAF67e0c90f1567C0e27D3a1C9e37f86

vercel env add NEXT_PUBLIC_USDC_ADDRESS
# Enter: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

### Step 4: Configure Project Settings

In Vercel Dashboard:
1. Go to **Project Settings** → **General**
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to Next.js
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `.next`

### Step 5: Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CHAIN_ID` | Ethereum Sepolia chain ID | `11155111` |
| `NEXT_PUBLIC_SEPOLIA_RPC` | Sepolia RPC endpoint | `https://sepolia.infura.io/v3/...` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Get from cloud.walletconnect.com |
| `NEXT_PUBLIC_RELAYER_URL` | ZAMA FHE relayer URL | `https://relayer.testnet.zama.org` |
| `NEXT_PUBLIC_XUSD_ADDRESS` | xUSD wrapper contract | See `.env.usdc` or `.env.xusd` |
| `NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS` | Payment gateway contract | See `.env.usdc` or `.env.xusd` |
| `NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS` | Product registry contract | See `.env.usdc` or `.env.xusd` |
| `NEXT_PUBLIC_REFUND_MANAGER_ADDRESS` | Refund manager contract | See `.env.usdc` or `.env.xusd` |
| `NEXT_PUBLIC_USDC_ADDRESS` | Mock USDC contract | See `.env.usdc` or `.env.xusd` |
| `JWT_SECRET` | Secret for JWT tokens | Generate with `openssl rand -base64 32` |

## Post-Deployment Checklist

After deployment, verify:

- [ ] ✅ Deployment successful at provided URL
- [ ] ✅ Wallet connection works (MetaMask/WalletConnect)
- [ ] ✅ Can view token balances
- [ ] ✅ Wrap/unwrap functionality works
- [ ] ✅ Payment flow completes successfully
- [ ] ✅ Merchant dashboard accessible
- [ ] ✅ Admin panel requires authentication
- [ ] ✅ API endpoints respond correctly

## Troubleshooting

### Build Fails with "Cannot find module"

Make sure **Root Directory** is set to `frontend` in Vercel project settings.

### Wallet Connection Not Working

Check that `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly.

### Transactions Failing

Verify contract addresses match your deployed contracts in `contracts/.env.usdc` or `contracts/.env.xusd`.

### RPC Errors

Ensure `NEXT_PUBLIC_SEPOLIA_RPC` points to a valid, working Sepolia endpoint.

## Local Development

For local development, copy `.env.example` to `.env.local`:

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## Updating Deployment

After making code changes:

```bash
git add .
git commit -m "Your changes"
git push

# Vercel will auto-deploy from GitHub
# Or manually deploy:
cd frontend
vercel --prod
```

## Support

- **Documentation**: See [README.md](README.md)
- **Issues**: https://github.com/ramakrishnanhulk20/Aruvi/issues
- **ZAMA Docs**: https://docs.zama.ai/fhevm
