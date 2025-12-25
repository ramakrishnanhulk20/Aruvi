---
sidebar_position: 2
title: Smart Contracts
---

# Smart Contracts

Technical reference for Aruvi's smart contracts on Sepolia.

## Deployed Addresses

| Contract | Address |
|----------|---------|
| PaymentGateway | `0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b` |
| ConfidentialUSDCWrapper | `0xf99376BE228E8212C3C9b8B746683C96C1517e8B` |
| ProductRegistry | `0x...` |
| RefundManager | `0x...` |
| USDC (Circle) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

## PaymentGateway

The main entry point for payments.

### Functions

#### send
Send encrypted payment to a recipient.

```solidity
function send(
    address recipient,
    externalEuint64 encryptedAmount,
    bytes calldata proof
) external returns (bytes32 paymentId)
```

**Parameters:**
- `recipient`: Recipient address
- `encryptedAmount`: FHE-encrypted payment amount (bytes32)
- `proof`: Encryption proof from fhevmjs

**Returns:** Unique payment ID (bytes32)

#### createRequest
Create a payment request (payment link).

```solidity
function createRequest(
    externalEuint64 encryptedAmount,
    bytes calldata proof,
    uint256 expiresIn
) external returns (bytes32 requestId)
```

#### fulfillRequest
Pay a pending request.

```solidity
function fulfillPaymentRequest(
    uint256 requestId
) external
```

#### createSubscription
Set up recurring payments.

```solidity
function createSubscription(
    address recipient,
    einput encryptedAmount,
    bytes calldata inputProof,
    uint256 interval
) external returns (uint256 subscriptionId)
```

**Parameters:**
- `recipient`: Who receives payments
- `encryptedAmount`: Encrypted amount per period
- `inputProof`: Encryption proof
- `interval`: Seconds between payments

#### executeSubscription
Execute a due subscription payment.

```solidity
function executeSubscription(
    uint256 subscriptionId
) external
```

Can be called by anyone once the interval has passed.

#### cancelSubscription
Stop a subscription.

```solidity
function cancelSubscription(
    uint256 subscriptionId
) external
```

Only callable by the subscription payer.

### Events

```solidity
event PaymentSent(
    uint256 indexed paymentId,
    address indexed from,
    address indexed to
);

event PaymentRequestCreated(
    uint256 indexed requestId,
    address indexed from,
    address indexed to
);

event SubscriptionCreated(
    uint256 indexed subscriptionId,
    address indexed payer,
    address indexed recipient,
    uint256 interval
);

event SubscriptionExecuted(
    uint256 indexed subscriptionId,
    uint256 executionNumber
);

event SubscriptionCancelled(
    uint256 indexed subscriptionId
);
```

## ConfidentialUSDCWrapper

Wraps regular USDC into confidential tokens.

### Functions

#### wrap
Convert USDC to confidential USDC.

```solidity
function wrap(uint256 amount) external
```

Requires prior ERC20 approval.

#### unwrap
Convert confidential USDC back to regular USDC.

```solidity
function unwrap(
    einput encryptedAmount,
    bytes calldata inputProof
) external
```

#### balanceOfEncrypted
Get encrypted balance.

```solidity
function balanceOfEncrypted(
    address account
) external view returns (euint64)
```

Returns the encrypted balance. Decrypt client-side.

#### transferEncrypted
Transfer confidential tokens directly.

```solidity
function transferEncrypted(
    address to,
    einput encryptedAmount,
    bytes calldata inputProof
) external returns (bool)
```

### Events

```solidity
event Wrapped(address indexed account, uint256 amount);
event Unwrapped(address indexed account, uint256 amount);
event ConfidentialTransfer(
    address indexed from,
    address indexed to
);
```

## ProductRegistry

Manage products for marketplace features.

### Functions

#### registerProduct
```solidity
function registerProduct(
    bytes32 productId,
    einput encryptedPrice,
    bytes calldata inputProof,
    string calldata metadata
) external
```

#### updateProductPrice
```solidity
function updateProductPrice(
    bytes32 productId,
    einput newEncryptedPrice,
    bytes calldata inputProof
) external
```

#### getProduct
```solidity
function getProduct(
    bytes32 productId
) external view returns (Product memory)
```

## RefundManager

Handle refund requests.

### Functions

#### requestRefund
```solidity
function requestRefund(
    uint256 paymentId,
    bytes calldata reason
) external returns (uint256 refundId)
```

#### approveRefund
```solidity
function approveRefund(uint256 refundId) external
```

Only callable by original payment recipient.

#### declineRefund
```solidity
function declineRefund(uint256 refundId) external
```

### Events

```solidity
event RefundRequested(
    uint256 indexed refundId,
    uint256 indexed paymentId,
    address indexed requester
);

event RefundApproved(uint256 indexed refundId);
event RefundDeclined(uint256 indexed refundId);
```

## FHE Types Reference

Aruvi uses these Zama fhEVM types:

| Type | Description | Use Case |
|------|-------------|----------|
| `euint64` | Encrypted uint64 | Balances, amounts |
| `ebool` | Encrypted boolean | Conditional logic |
| `einput` | Input ciphertext | Function parameters |

### Creating Encrypted Inputs

```typescript
import { createInstance } from 'fhevmjs';

const fhevm = await createInstance({ networkUrl });

// Create input builder
const input = fhevm.createEncryptedInput(
  contractAddress,
  signerAddress
);

// Add values to encrypt
input.add64(amount);

// Generate proof and handles
const { inputProof, handles } = input.encrypt();
```

### Decrypting Values

```typescript
// Request decryption
const balance = await fhevm.reencrypt(
  encryptedBalance,
  privateKey,
  publicKey,
  signature,
  contractAddress,
  signerAddress
);
```

## Development Setup

### Clone and Install

```bash
git clone https://github.com/aruvi-project/aruvi
cd aruvi/contracts
npm install
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

### Deploy to Sepolia

```bash
# Set environment variables
export PRIVATE_KEY=your_key
export SEPOLIA_RPC_URL=your_rpc

npx hardhat deploy --network sepolia
```

## Gas Costs

Approximate gas costs (will vary):

| Operation | Gas (approx) |
|-----------|-------------|
| Wrap | 150,000 |
| Unwrap | 200,000 |
| Send | 250,000 |
| Create Subscription | 300,000 |
| Execute Subscription | 200,000 |

FHE operations are more expensive than standard ERC20.

## Security Considerations

- All amounts use encrypted arithmetic
- Access control via `onlyOwner` and role checks
- Reentrancy guards on state-changing functions
- Input validation on all public functions

See [Security Overview](/docs/security/overview) for more details.
