---
sidebar_position: 3
title: Integration Guide
---

# Integration Guide

Want to accept Aruvi payments in your app? Here's how to integrate.

## Quick Integration

The simplest integration is a payment link:

```html
<a href="https://app.aruvi.io/pay?to=0xYOUR_ADDRESS&amount=100">
  Pay $100 with Aruvi
</a>
```

User clicks → Aruvi opens → They pay → Done.

## JavaScript SDK

For deeper integration, use the contracts directly with ethers or viem.

### Setup

```bash
npm install viem wagmi @tanstack/react-query
```

### Connect to Contracts

```typescript
import { createPublicClient, http, createWalletClient } from 'viem';
import { sepolia } from 'viem/chains';

// Contract ABIs
import { paymentGatewayABI } from './abis/PaymentGateway';
import { wrapperABI } from './abis/ConfidentialUSDCWrapper';

const PAYMENT_GATEWAY = '0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b';
const WRAPPER = '0xf99376BE228E8212C3C9b8B746683C96C1517e8B';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});
```

### Check Balance

```typescript
async function getEncryptedBalance(address: string) {
  const balance = await publicClient.readContract({
    address: WRAPPER,
    abi: wrapperABI,
    functionName: 'balanceOfEncrypted',
    args: [address],
  });
  
  return balance; // Encrypted - needs decryption
}
```

### Send Payment

```typescript
import { createInstance } from 'fhevmjs';

async function sendPayment(
  to: string, 
  amount: bigint,
  walletClient: WalletClient
) {
  // 1. Initialize FHE
  const fhevm = await createInstance({
    networkUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  });
  
  // 2. Encrypt the amount
  const input = fhevm.createEncryptedInput(
    PAYMENT_GATEWAY,
    walletClient.account.address
  );
  input.add64(amount);
  const { inputProof, handles } = input.encrypt();
  
  // 3. Send transaction
  const hash = await walletClient.writeContract({
    address: PAYMENT_GATEWAY,
    abi: paymentGatewayABI,
    functionName: 'send',
    args: [to, handles[0], inputProof],
  });
  
  return hash;
}
```

### Listen for Payments

```typescript
import { parseAbiItem } from 'viem';

// Watch for incoming payments
publicClient.watchContractEvent({
  address: PAYMENT_GATEWAY,
  abi: paymentGatewayABI,
  eventName: 'PaymentSent',
  args: {
    to: YOUR_ADDRESS, // Filter to your address
  },
  onLogs: (logs) => {
    logs.forEach(log => {
      console.log('Payment received!', {
        from: log.args.from,
        paymentId: log.args.paymentId,
      });
    });
  },
});
```

## React Integration

### With wagmi v2

```tsx
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseAbi } from 'viem';

const paymentGatewayABI = parseAbi([
  'function send(address to, bytes32 encryptedAmount, bytes proof) returns (bytes32)',
  'event PaymentSent(bytes32 indexed paymentId, address indexed from, address indexed to)',
]);

function PayButton({ to, amount }: { to: string; amount: bigint }) {
  const { writeContract, isPending } = useWriteContract();
  
  const handlePay = async () => {
    // Encrypt amount with fhevmjs first
    const { handles, inputProof } = await encryptAmount(amount);
    
    writeContract({
      address: PAYMENT_GATEWAY,
      abi: paymentGatewayABI,
      functionName: 'send',
      args: [to, handles[0], inputProof],
    });
  };
  
  return (
    <button onClick={handlePay} disabled={isPending}>
      {isPending ? 'Sending...' : 'Pay Now'}
    </button>
  );
}
```

### FHE Provider

Wrap your app with FHE context:

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { createInstance, FhevmInstance } from 'fhevmjs';

const FhevmContext = createContext<FhevmInstance | null>(null);

export function FhevmProvider({ children }) {
  const [fhevm, setFhevm] = useState(null);
  
  useEffect(() => {
    createInstance({
      networkUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    }).then(setFhevm);
  }, []);
  
  if (!fhevm) return <div>Loading encryption...</div>;
  
  return (
    <FhevmContext.Provider value={fhevm}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  return useContext(FhevmContext);
}
```

## Webhook Integration

For server-side notifications, index blockchain events:

### Option 1: Run Your Own Indexer

```typescript
// Simple event indexer
import { createPublicClient, http, webSocket } from 'viem';

const client = createPublicClient({
  chain: sepolia,
  transport: webSocket('wss://sepolia.infura.io/ws/v3/YOUR_KEY'),
});

client.watchContractEvent({
  address: PAYMENT_GATEWAY,
  abi: paymentGatewayABI,
  eventName: 'PaymentSent',
  onLogs: async (logs) => {
    for (const log of logs) {
      // Call your webhook
      await fetch('https://your-api.com/webhook', {
        method: 'POST',
        body: JSON.stringify({
          event: 'payment',
          from: log.args.from,
          to: log.args.to,
          paymentId: log.args.paymentId.toString(),
          transactionHash: log.transactionHash,
        }),
      });
    }
  },
});
```

### Option 2: Use The Graph

Deploy a subgraph for indexed queries:

```graphql
# schema.graphql
type Payment @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  paymentId: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
}
```

## Common Patterns

### Checkout Flow

```typescript
// 1. Create order in your database
const order = await createOrder({ items, total });

// 2. Generate payment request
const paymentUrl = `https://app.aruvi.io/pay?` + 
  `to=${YOUR_MERCHANT_ADDRESS}` +
  `&amount=${order.total}` +
  `&ref=${order.id}`;

// 3. Redirect user
window.location.href = paymentUrl;

// 4. In webhook, mark order as paid
app.post('/webhook', (req, res) => {
  const { paymentId, ref } = req.body;
  markOrderPaid(ref, paymentId);
});
```

### Subscription Setup

```typescript
async function createSubscription(
  recipient: string,
  monthlyAmount: bigint,
  walletClient: WalletClient
) {
  const fhevm = await createInstance({ networkUrl });
  
  const input = fhevm.createEncryptedInput(
    PAYMENT_GATEWAY,
    walletClient.account.address
  );
  input.add64(monthlyAmount);
  const { inputProof, handles } = input.encrypt();
  
  const MONTHLY = 30 * 24 * 60 * 60; // 30 days in seconds
  
  return walletClient.writeContract({
    address: PAYMENT_GATEWAY,
    abi: paymentGatewayABI,
    functionName: 'createSubscription',
    args: [recipient, handles[0], inputProof, BigInt(MONTHLY)],
  });
}
```

## Testing Integration

### Sepolia Testnet

All development should happen on Sepolia:

```typescript
const config = {
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  paymentGateway: '0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b',
  wrapper: '0xf99376BE228E8212C3C9b8B746683C96C1517e8B',
  usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
};
```

### Get Test Tokens

Direct users to the faucet or provide test tokens programmatically.

## Error Handling

```typescript
try {
  await sendPayment(to, amount, walletClient);
} catch (error) {
  if (error.message.includes('insufficient')) {
    // User needs to wrap more USDC
    showError('Please wrap more USDC first');
  } else if (error.message.includes('rejected')) {
    // User cancelled in wallet
    showError('Transaction cancelled');
  } else {
    // Unknown error
    showError('Payment failed. Please try again.');
  }
}
```

## Next Steps

- [API Reference](/docs/api/payment-gateway) — Full contract documentation
- [Frontend SDK](/docs/developers/frontend-sdk) — React components and hooks
- [Security](/docs/security/overview) — Best practices for integration
