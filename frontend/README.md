# Aruvi Frontend

Private payment gateway frontend built with Next.js 14, RainbowKit, and Zama FHEVM.

## Features

- 🔐 **Confidential Payments** - FHE encrypted amounts on-chain
- 🎨 **Pixel Glitch Design** - Unique retro-futuristic aesthetic
- 🌙 **Dark/Light Mode** - Full theme support
- 📱 **Mobile Responsive** - Works on all devices
- 🔗 **RainbowKit** - Best-in-class wallet connection
- 🔒 **JWT Auth** - Secure merchant authentication

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID (11155111 for Sepolia) |
| `NEXT_PUBLIC_SEPOLIA_RPC` | Sepolia RPC URL |
| `NEXT_PUBLIC_WRAPPER_ADDRESS` | Confidential token wrapper |
| `NEXT_PUBLIC_GATEWAY_ADDRESS` | Payment gateway contract |
| `NEXT_PUBLIC_REFUND_MANAGER_ADDRESS` | Refund manager contract |
| `NEXT_PUBLIC_RELAYER_URL` | Zama relayer endpoint |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `JWT_SECRET` | Secret for JWT signing |

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── checkout/          # Customer checkout flow
│   ├── dashboard/         # Merchant dashboard
│   └── api/               # API routes
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Header, Footer
├── hooks/                 # React hooks
│   ├── useFhevm.tsx       # FHEVM SDK integration
│   ├── usePaymentGateway.ts
│   ├── useConfidentialToken.ts
│   └── useRefundManager.ts
├── lib/                   # Utilities
│   ├── contracts.ts       # Contract ABIs & addresses
│   ├── wagmi.ts           # Wagmi config
│   └── utils.ts           # Helper functions
├── stores/                # Zustand stores
└── providers/             # React providers
```

## Pages

### Landing (`/`)
Marketing page showcasing Aruvi's features.

### Checkout (`/checkout`)
Customer payment flow:
1. Connect wallet
2. Wrap ERC20 → Confidential token
3. Authorize gateway as operator
4. Make encrypted payment

### Dashboard (`/dashboard`)
Merchant portal:
- View encrypted payment history
- Decrypt revenue totals (client-side)
- Process refunds
- Make totals public for tax compliance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom pixel theme
- **Wallet**: RainbowKit + Wagmi v2
- **State**: Zustand
- **Animations**: Framer Motion
- **FHE**: Zama Relayer SDK v0.3.0-6
- **Auth**: JWT + EIP-712 signatures

## Design System

### Colors
- **Primary**: Light pink (`#FF6B8A`)
- **Accent**: Yellow (`#FFE500`)
- **Dark mode**: Deep purple-black

### Typography
- **Headers**: Press Start 2P (pixel font)
- **Body**: Inter
- **Code**: JetBrains Mono

### Effects
- Glitch animations on hover
- Scanline overlay
- Pixel grid backgrounds
- Retro shadow effects

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| Wrapper | `0x0e564030B638EA79307a54b7B7f8105f27d04E80` |
| Gateway | `0xff711932eF6058003bEe66e3f3Ced5fBA45640F4` |
| Refund Manager | `0xCF03d4099F749193d9eD921D1C48e5adBc09EF81` |

## License

MIT
