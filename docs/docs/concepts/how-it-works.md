---
sidebar_position: 1
title: How Aruvi Works
---

# How Aruvi Works

Aruvi is a payment system where amounts are hidden but everything else works like normal crypto. Here's the big picture.

## The Problem We Solve

On regular blockchains, everything is public. Send someone 500 USDC and:

- Everyone sees you sent exactly 500
- Everyone sees your wallet balance
- Anyone can track all your transactions
- Your financial life is an open book

This is fine for some things, but terrible for most real-world payments. You wouldn't want your salary, medical bills, or subscription costs visible to the world.

## Our Solution

Aruvi encrypts the amounts. That's it. Simple idea, complex implementation.

When you send 500 USDC through Aruvi:
- ✅ The blockchain records that a transaction happened
- ✅ The sender and receiver addresses are visible
- ❌ The amount is encrypted — nobody can see the 500
- ❌ Your balance is encrypted too

## The Flow

Here's what happens when you use Aruvi:

```
Regular USDC → [Wrap] → Confidential USDC → [Use Privately] → [Unwrap] → Regular USDC
```

### 1. Wrap Your Tokens

You start with regular USDC (or other tokens). The wrap operation:
- Takes your plaintext tokens
- Deposits them in our smart contract
- Issues you encrypted tokens of equal value

Think of it like exchanging cash for casino chips, except the chips are encrypted.

### 2. Use Privately

Now you can:
- **Send** money to anyone
- **Receive** money from anyone
- **Check** your balance (only you can see it)
- **Request** payments
- **Set up** subscriptions

All amounts stay encrypted the entire time.

### 3. Unwrap When Needed

When you want regular tokens back:
- The unwrap operation decrypts and verifies your balance
- Your confidential tokens are burned
- You receive regular USDC

## The Secret Sauce: FHE

What makes this possible is **Fully Homomorphic Encryption (FHE)**. 

Normal encryption: encrypt → can't do anything with it → decrypt

FHE: encrypt → **do math on encrypted values** → decrypt result

This means the blockchain can process your payment without ever seeing the actual numbers. It verifies you have enough funds, calculates the new balances, and updates everything — all while encrypted.

[Learn more about FHE →](/docs/concepts/fhe-encryption)

## What's Still Visible

We're honest about what Aruvi hides and what it doesn't:

| Visible | Hidden |
|---------|--------|
| Your wallet address | Transaction amounts |
| That a transaction occurred | Your balance |
| Transaction timestamps | Payment totals |
| Gas fees | Subscription amounts |

If you need address privacy too, you'd combine Aruvi with something like Tornado Cash or a fresh wallet. Different tools for different threats.

## Trust Model

Aruvi runs on smart contracts. There's no company holding your money, no servers processing your transactions. 

Once deployed, the contracts work autonomously. Even we can't:
- See your balances
- Block your transactions  
- Freeze your funds
- Access your encryption keys

Your keys, your money. That's the whole point.
