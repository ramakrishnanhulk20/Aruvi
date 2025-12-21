---
sidebar_position: 2
title: ConfidentialWrapper
---

# ConfidentialUSDCWrapper API

Contract for wrapping USDC into confidential (encrypted) tokens.

**Address (Sepolia):** `0x7df31ba1e1e6a2A7e6f29FB4ED2F3ED7C5F9E9A5`

## Write Functions

### wrap

Convert regular USDC to confidential USDC.

```solidity
function wrap(uint256 amount) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `uint256` | Amount of USDC to wrap (6 decimals) |

**Requirements:**
- Caller must have approved this contract for `amount` of USDC
- Caller must have sufficient USDC balance

**Emits:** `Wrapped(account, amount)`

**Example:**
```typescript
// First approve
await usdc.approve(wrapperAddress, 100_000000n);

// Then wrap
await wrapper.wrap(100_000000n); // Wrap 100 USDC
```

---

### unwrap

Convert confidential USDC back to regular USDC.

```solidity
function unwrap(
    einput encryptedAmount,
    bytes calldata inputProof
) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `encryptedAmount` | `einput` | Encrypted amount to unwrap |
| `inputProof` | `bytes` | Encryption proof |

**Requirements:**
- Caller must have sufficient encrypted balance

**Emits:** `Unwrapped(account, amount)`

**Example:**
```typescript
const { handles, inputProof } = await encryptAmount(50_000000n);
await wrapper.unwrap(handles[0], inputProof);
```

---

### transferEncrypted

Transfer confidential tokens to another address.

```solidity
function transferEncrypted(
    address to,
    einput encryptedAmount,
    bytes calldata inputProof
) external returns (bool)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `to` | `address` | Recipient address |
| `encryptedAmount` | `einput` | Encrypted transfer amount |
| `inputProof` | `bytes` | Encryption proof |

**Returns:** `bool` — Success status

**Emits:** `ConfidentialTransfer(from, to)`

---

### approveEncrypted

Approve another address to spend your confidential tokens.

```solidity
function approveEncrypted(
    address spender,
    einput encryptedAmount,
    bytes calldata inputProof
) external returns (bool)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `spender` | `address` | Address to approve |
| `encryptedAmount` | `einput` | Encrypted allowance |
| `inputProof` | `bytes` | Encryption proof |

**Returns:** `bool` — Success status

**Emits:** `EncryptedApproval(owner, spender)`

---

### transferFromEncrypted

Transfer from another account (requires approval).

```solidity
function transferFromEncrypted(
    address from,
    address to,
    einput encryptedAmount,
    bytes calldata inputProof
) external returns (bool)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | Source address |
| `to` | `address` | Destination address |
| `encryptedAmount` | `einput` | Encrypted amount |
| `inputProof` | `bytes` | Encryption proof |

**Requirements:**
- Caller must have sufficient allowance from `from`

---

## Read Functions

### balanceOfEncrypted

Get encrypted balance of an account.

```solidity
function balanceOfEncrypted(
    address account
) external view returns (euint64)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `account` | `address` | Account to check |

**Returns:** `euint64` — Encrypted balance (must be decrypted client-side)

**Example:**
```typescript
const encryptedBalance = await wrapper.balanceOfEncrypted(userAddress);
// Decrypt using fhevmjs
const balance = await fhevm.decrypt(encryptedBalance, ...);
```

---

### allowanceEncrypted

Get encrypted allowance.

```solidity
function allowanceEncrypted(
    address owner,
    address spender
) external view returns (euint64)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | `address` | Token owner |
| `spender` | `address` | Approved spender |

**Returns:** `euint64` — Encrypted allowance

---

### totalWrapped

Get total amount of USDC wrapped (plaintext).

```solidity
function totalWrapped() external view returns (uint256)
```

**Returns:** `uint256` — Total USDC held in contract

---

### underlyingToken

Get address of underlying USDC token.

```solidity
function underlyingToken() external view returns (address)
```

**Returns:** `address` — USDC contract address

---

### decimals

Get token decimals.

```solidity
function decimals() external view returns (uint8)
```

**Returns:** `uint8` — Always 6 (matching USDC)

---

### name

Get token name.

```solidity
function name() external view returns (string memory)
```

**Returns:** `string` — "Confidential USDC"

---

### symbol

Get token symbol.

```solidity
function symbol() external view returns (string memory)
```

**Returns:** `string` — "cUSDC"

---

## Events

### Wrapped

Emitted when USDC is wrapped.

```solidity
event Wrapped(
    address indexed account,
    uint256 amount
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `account` | `address` | User who wrapped |
| `amount` | `uint256` | Amount wrapped |

### Unwrapped

Emitted when confidential USDC is unwrapped.

```solidity
event Unwrapped(
    address indexed account,
    uint256 amount
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `account` | `address` | User who unwrapped |
| `amount` | `uint256` | Amount unwrapped |

### ConfidentialTransfer

Emitted on encrypted transfer.

```solidity
event ConfidentialTransfer(
    address indexed from,
    address indexed to
);
```

**Note:** Amount is not included — it's confidential!

### EncryptedApproval

Emitted when approval is set.

```solidity
event EncryptedApproval(
    address indexed owner,
    address indexed spender
);
```

---

## Decryption

To read an encrypted balance, you need to decrypt it:

### Using fhevmjs

```typescript
import { createInstance } from 'fhevmjs';

async function getBalance(userAddress: string) {
  // 1. Get encrypted balance
  const encryptedBalance = await wrapper.balanceOfEncrypted(userAddress);
  
  // 2. Initialize fhevm
  const fhevm = await createInstance({
    networkUrl: 'https://rpc.sepolia.org',
  });
  
  // 3. Request reencryption (decryption)
  const { publicKey, privateKey } = fhevm.generateKeypair();
  const eip712 = fhevm.createEIP712(publicKey, wrapperAddress);
  const signature = await signer.signTypedData(eip712);
  
  const decrypted = await fhevm.reencrypt(
    encryptedBalance,
    privateKey,
    publicKey,
    signature,
    wrapperAddress,
    userAddress
  );
  
  return decrypted;
}
```

### Decryption Permissions

Only the balance owner can decrypt their balance. This requires:
1. Ownership proof (signature)
2. Valid keypair for reencryption
3. Request to the Zama Gateway

---

## Error Codes

| Error | Description |
|-------|-------------|
| `InsufficientBalance()` | Not enough tokens |
| `InsufficientAllowance()` | Not enough allowance |
| `InvalidAmount()` | Amount is zero |
| `TransferFailed()` | USDC transfer failed |

---

## Integration with PaymentGateway

The PaymentGateway uses this wrapper internally:

```solidity
// PaymentGateway.sol
function sendConfidential(address to, einput amount, bytes calldata proof) {
    // Transfers confidential tokens
    wrapper.transferFromEncrypted(msg.sender, to, amount, proof);
    // ...
}
```

Users typically interact via PaymentGateway, not directly with the wrapper.
