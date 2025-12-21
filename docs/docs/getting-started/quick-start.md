---
sidebar_position: 1
title: Quick Start
---

# Quick Start

Ready to send your first private payment? You'll be up and running in about 5 minutes.

## What You'll Need

- A browser with [MetaMask](https://metamask.io/) installed
- Some Sepolia testnet ETH (for gas fees)
- A few minutes of your time

That's it. No account creation, no KYC, no email verification.

## The Fast Track

### 1. Connect Your Wallet

Head over to [app.aruvi.io](https://app.aruvi.io) and click "Connect Wallet" in the top right. MetaMask will pop up asking you to connect — just approve it.

If you're not on Sepolia testnet, the app will ask to switch networks. Click "Switch Network" and you're good.

### 2. Get Some Test USDC

You'll need wrapped confidential USDC to make payments. Here's the quickest path:

1. Go to the **Wrap** section in the app
2. If you don't have test USDC, there's a faucet link right there
3. Enter how much you want to wrap (start with 100 USDC for testing)
4. Click "Wrap" and confirm the transaction

Your balance won't show immediately — it takes a few blocks. Grab a coffee.

### 3. Send Your First Payment

Now for the fun part:

1. Click **Send** in the navigation
2. Paste in a friend's address (or use a second wallet you control)
3. Enter an amount
4. Hit "Send" and confirm in MetaMask

Done! You just made a private payment. The recipient can see they received money, but nobody else on the blockchain knows how much.

## What Just Happened?

When you wrapped your USDC, it got converted into an encrypted token. The amount is hidden using [Fully Homomorphic Encryption](/docs/concepts/fhe-encryption) — even the blockchain nodes can't see it.

When you sent money, the transfer happened entirely in encrypted form. No plaintext amounts anywhere.

## Next Steps

- [Connect a wallet](/docs/getting-started/connect-wallet) — more details on supported wallets
- [Get test tokens](/docs/getting-started/get-test-tokens) — if you need more USDC
- [Learn how it works](/docs/concepts/how-it-works) — the tech behind the magic
