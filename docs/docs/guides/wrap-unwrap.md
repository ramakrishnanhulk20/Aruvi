---
sidebar_position: 3
title: Wrap & Unwrap
---

# Wrap & Unwrap Tokens

Wrapping converts regular tokens into confidential ones. Unwrapping does the reverse. Here's how to use both.

## Wrapping Tokens

Wrapping takes your regular USDC and gives you encrypted confidential USDC.

### Step-by-Step

1. **Go to Wrap**: Click the **Wrap** section in the navigation

2. **Check your balance**: You'll see your regular USDC balance. Need more? There's a faucet link.

3. **Enter amount**: Type how much you want to wrap. You can do partial amounts.

4. **Approve** (first time): If this is your first wrap, you need to approve the contract:
   - Click "Approve"
   - MetaMask asks to allow the contract to access your USDC
   - Confirm it
   - Wait for confirmation

5. **Wrap**: Now click "Wrap" and confirm in MetaMask

6. **Wait**: Transaction gets mined, your confidential balance updates

### What Happens

```
Your USDC wallet: 1000 USDC
                    ↓ [Wrap 500]
Your USDC wallet: 500 USDC
Your Confidential wallet: 500 cUSDC (encrypted)
```

The USDC goes into the wrapper contract. You receive an encrypted balance.

## Unwrapping Tokens

Unwrapping converts confidential tokens back to regular USDC.

### Step-by-Step

1. **Go to Unwrap**: Usually a tab in the Wrap section

2. **Check confidential balance**: Shows how much you can unwrap

3. **Enter amount**: How much to convert back

4. **Unwrap**: Click and confirm

5. **Receive USDC**: Regular USDC arrives in your wallet

### What Happens

```
Your Confidential wallet: 500 cUSDC
                            ↓ [Unwrap 200]
Your Confidential wallet: 300 cUSDC
Your USDC wallet: 200 USDC (added to existing)
```

## Approvals Explained

Before wrapping, you need to "approve" the contract. This is standard ERC20 behavior.

**Why?** Smart contracts can't just take your tokens. You have to explicitly allow them to move specific amounts.

**Types of approval:**

| Type | Pros | Cons |
|------|------|------|
| Exact amount | Most secure | Approve each time |
| Unlimited | One-time setup | Contract can move all tokens |

Aruvi requests exact amount approvals for better security.

**Revoking approval:** If you want to remove permission later, use a tool like [Revoke.cash](https://revoke.cash).

## Fees

**Wrapping**: Gas fee only. No Aruvi fee.

**Unwrapping**: Gas fee only. No Aruvi fee.

Gas is paid in ETH (Sepolia ETH on testnet). Keep some ETH in your wallet.

## When to Wrap

Wrap when you want to:
- Send private payments
- Keep your balance hidden
- Use any Aruvi feature

You don't need to wrap your entire balance. Keep some regular USDC for:
- Services that don't support confidential tokens
- Quick DeFi trades
- Lower gas costs when privacy isn't needed

## When to Unwrap

Unwrap when you want to:
- Use regular DeFi protocols
- Send to an exchange
- Use USDC somewhere that needs plaintext tokens

## Common Questions

### Why can't I unwrap everything?

There might be tokens locked in pending transactions or subscriptions. Wait for those to complete.

### Why is my confidential balance wrong?

Decryption takes a moment. Refresh the page or wait a few seconds. If it's been a while, there might be a network issue.

### Can I wrap other tokens?

Currently just USDC. More tokens coming soon — check the roadmap.

### What if I wrap and immediately unwrap?

Works fine, but you'll pay gas twice. No value is lost, just gas fees.

### Is there a minimum amount?

Technically no, but gas costs make very small amounts impractical. Wrapping $1 worth when gas costs $0.50 doesn't make much sense.

## Advanced: Direct Contract Interaction

For developers or power users, you can interact directly:

```javascript
// Approve
await usdc.approve(wrapperAddress, amount);

// Wrap
await wrapper.wrap(amount);

// Unwrap (amount is encrypted)
await wrapper.unwrap(encryptedAmount, inputProof);
```

See the [API Reference](/docs/api/confidential-wrapper) for full contract details.
