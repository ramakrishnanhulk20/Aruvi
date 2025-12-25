---
sidebar_position: 1
title: Architecture
---

# Architecture Overview

A look at how Aruvi is built, for developers who want to understand the system or build on it.

## High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Smart          │────▶│   Zama          │
│   (React/Vite)  │     │   Contracts      │     │   fhEVM         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Wallet        │     │   Sepolia        │     │   Zama          │
│   (MetaMask)    │     │   Network        │     │   Gateway       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Smart Contracts

Four main contracts power Aruvi:

### PaymentGateway.sol

The main contract users interact with. Handles:
- Confidential transfers
- Payment requests
- Subscriptions
- Refund workflows

```solidity
contract AruviPaymentGateway {
    function send(address recipient, externalEuint64 encryptedAmount, bytes calldata proof) returns (bytes32);
    function createRequest(externalEuint64 encryptedAmount, bytes calldata proof, uint256 expiresIn) returns (bytes32);
    function fulfillRequest(bytes32 requestId, externalEuint64 encryptedAmount, bytes calldata proof) returns (bytes32);
    function createSubscription(address recipient, externalEuint64 encryptedAmount, bytes calldata proof, uint256 interval) returns (bytes32);
    function refund(bytes32 paymentId);
    // ... more functions
}
```

### ConfidentialUSDCWrapper.sol

Converts regular USDC to confidential tokens:
- Wrap: Regular → Encrypted
- Unwrap: Encrypted → Regular
- Manages encrypted balances

```solidity
contract ConfidentialUSDCWrapper {
    function wrap(uint256 amount);
    function unwrap(einput amount, bytes calldata proof);
    function balanceOfEncrypted(address account) returns (euint64);
}
```

### ProductRegistry.sol

For marketplace and business features:
- Product definitions
- Pricing (encrypted)
- Merchant management

### RefundManager.sol

Handles the refund lifecycle:
- Request tracking
- Approval workflow
- Fund return logic

## Frontend Stack

Built with modern React:

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build | Vite |
| Routing | React Router |
| State | React Query + Zustand |
| Styling | Tailwind CSS |
| Web3 | wagmi v2 + viem |
| FHE | fhevmjs |

### Key Directories

```
frontend/src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and helpers
├── pages/          # Route components
└── providers/      # Context providers
```

### Important Hooks

```typescript
// Connect to wallet
useAccount()

// Read contract data
useReadContract()

// Write to contracts
useWriteContract()

// FHE encryption
useFhevmInstance()

// Decrypt balances
useConfidentialToken()
```

## FHE Integration

We use Zama's fhEVM for encryption:

### Encryption Flow

```typescript
// 1. Get fhEVM instance
const fhevm = await initFhevm();

// 2. Create encrypted input
const input = fhevm.createEncryptedInput(contractAddress, userAddress);
input.add64(amount); // Encrypt the amount

// 3. Get proof and ciphertext
const { inputProof, handles } = input.encrypt();

// 4. Send to contract
await contract.send(recipient, handles[0], inputProof);
```

### Decryption Flow

```typescript
// 1. Request decryption from Gateway
const decryptedValue = await fhevm.decrypt(
  encryptedValue,
  contractAddress
);

// 2. Value arrives via callback/request
```

## Data Flow: Sending Payment

Let's trace a payment through the system:

1. **User Input**: Amount entered in UI
2. **Encryption**: fhevmjs encrypts the amount client-side
3. **Transaction**: Wallet signs, sends to PaymentGateway
4. **Contract Logic**: 
   - Verifies encrypted balance ≥ encrypted amount (using FHE comparison)
   - Subtracts from sender (encrypted arithmetic)
   - Adds to receiver (encrypted arithmetic)
   - Emits event
5. **Confirmation**: Frontend sees event, updates UI
6. **Balance Refresh**: User's balance decrypted via Gateway

## State Management

### Blockchain State (Authoritative)
- Encrypted balances
- Transaction history
- Subscription details

### Frontend Cache (React Query)
- Decrypted balance
- Recent transactions
- User preferences

### Wallet State (wagmi)
- Connection status
- Current account
- Network info

## Event System

Contracts emit events for indexing:

```solidity
event ConfidentialTransfer(
    address indexed from,
    address indexed to,
    uint256 indexed paymentId
    // Note: no amount - it's confidential!
);

event SubscriptionCreated(
    uint256 indexed subscriptionId,
    address indexed payer,
    address indexed recipient
);
```

Frontend listens for these to update UI.

## Security Architecture

### Client-Side
- Private keys never leave wallet
- Encryption happens locally
- No sensitive data to our servers

### Contract-Side
- Access control on admin functions
- Reentrancy protection
- Input validation

### Network-Side
- Standard Ethereum security model
- Zama Gateway for decryption
- No single point of failure

## Testing Strategy

### Unit Tests
```bash
cd contracts
npx hardhat test
```

### Integration Tests
Full flow tests with encrypted values:
```bash
npx hardhat test test/PaymentGateway.wrapper.test.ts
```

### Local Development
```bash
# Start local node with fhEVM support
npx hardhat node

# Deploy contracts
npx hardhat deploy --network localhost
```

## Deployment

### Contract Deployment

Contracts are deployed via Hardhat:

```bash
npx hardhat deploy --network sepolia
```

Deployment scripts in `/contracts/deploy/`.

### Frontend Deployment

Static site, deployable anywhere:

```bash
cd frontend
npm run build
# Deploy dist/ to your host
```

## Future Architecture

Planned improvements:
- Layer 2 scaling
- Cross-chain bridges
- Additional token support
- Keeper network integration
