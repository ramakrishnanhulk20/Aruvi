---
sidebar_position: 4
title: Confidential Tokens
---

# Confidential Tokens

Confidential tokens are the encrypted versions of regular ERC20 tokens. They're what make private payments possible.

## How They Work

When you wrap regular USDC into confidential USDC:

1. **Deposit**: Your regular USDC goes into the wrapper contract
2. **Mint**: You receive an equal amount of confidential USDC
3. **Encryption**: Your balance is stored as encrypted data

The confidential token mirrors the value 1:1, but the amounts are hidden.

```
100 USDC → [Wrap] → 100 Confidential USDC (encrypted)
```

## The Wrapping Process

### Step 1: Approve

Before wrapping, you approve the wrapper contract to move your tokens:

```javascript
// User approves wrapper to spend their USDC
usdc.approve(wrapperAddress, amount);
```

This is standard ERC20 behavior — nothing special here.

### Step 2: Wrap

Then you call wrap with your amount:

```javascript
// Wrap 100 USDC into confidential tokens
wrapper.wrap(100_000000); // 100 USDC with 6 decimals
```

Behind the scenes:
1. Contract takes your USDC
2. Contract encrypts the amount
3. Contract adds to your encrypted balance

### Step 3: Receive

Your confidential balance updates. In the UI, you'll see your new balance after a brief decryption delay.

## The Unwrapping Process

When you want regular tokens back:

```javascript
// Unwrap 50 confidential USDC back to regular USDC
wrapper.unwrap(encryptedAmount);
```

The process:
1. Contract verifies your encrypted balance is sufficient
2. Contract subtracts from your encrypted balance
3. Contract sends regular USDC to your wallet

## Privacy Properties

### What's Encrypted

- Your confidential token balance
- Transfer amounts
- The total supply (sum of all balances)

### What's Visible

- That you hold *some* confidential tokens
- Token transfer events (without amounts)
- The wrapper contract address

## Two-Step Transfer Pattern

Because FHE operations can be complex, Aruvi uses a two-step pattern for some operations:

### Step 1: Initiate
Create the transfer with encrypted amount:
```javascript
gateway.send(recipient, encryptedAmount, proof);
```

### Step 2: Execute
After FHE processing, complete the transfer:
```javascript
// Usually automatic, but can be manual if needed
gateway.executePendingTransfer(transferId);
```

This separation ensures reliability even with network issues.

## Balance Decryption

Your encrypted balance is just bytes on-chain. To see actual numbers:

1. **Request**: Your wallet asks the Zama Gateway for decryption
2. **Prove**: You sign a message proving you own the address
3. **Decrypt**: Gateway decrypts and returns the value
4. **Display**: Your browser shows the balance

This happens automatically in the Aruvi app. You just see your balance.

## Supported Tokens

Currently, Aruvi supports:

| Token | Contract | Status |
|-------|----------|--------|
| USDC | Confidential wrapper | ✅ Live |

More tokens coming:
- USDT
- DAI
- WETH

The wrapper architecture makes adding new tokens straightforward.

## Comparison to Regular Tokens

| Feature | Regular ERC20 | Confidential Token |
|---------|--------------|-------------------|
| Balance visible | ✅ Public | ❌ Encrypted |
| Transfer amounts | ✅ Public | ❌ Encrypted |
| Standard wallets | ✅ Yes | ✅ Yes |
| DeFi compatible | ✅ Yes | ⚠️ Limited |
| Transfer speed | Fast | Slightly slower |
| Gas cost | Lower | Higher |

## Technical Details

Confidential tokens implement a modified ERC20 interface:

```solidity
// Standard ERC20 balance is always 0
function balanceOf(address) returns (uint256);

// Encrypted balance for FHE operations
function balanceOfEncrypted(address) returns (euint64);

// Transfer with encrypted amount
function transferEncrypted(address to, einput amount, bytes calldata inputProof);
```

The contract maintains both interfaces for compatibility, but real balances live in the encrypted mapping.

## Best Practices

1. **Keep some unwrapped**: For easy spending at services that don't support confidential tokens
2. **Batch your wrapping**: Reduce gas costs by wrapping larger amounts less frequently  
3. **Understand the delay**: Decryption takes a moment — don't panic if balance shows 0 briefly
4. **Check allowances**: Make sure you've approved enough for your intended wrapping amount
