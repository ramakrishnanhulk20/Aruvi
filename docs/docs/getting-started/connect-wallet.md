---
sidebar_position: 2
title: Connect Your Wallet
---

# Connect Your Wallet

Aruvi works with standard Ethereum wallets. If you've used DeFi before, this will feel familiar.

## Supported Wallets

### MetaMask (Recommended)

MetaMask is the most tested wallet with Aruvi. If you're new to crypto, start here.

**Don't have MetaMask?**
1. Go to [metamask.io](https://metamask.io/)
2. Install the browser extension
3. Create a new wallet (write down your seed phrase somewhere safe!)
4. You're ready

### Other Wallets

These should also work, though we've tested less thoroughly:

- **Rabby** — works great, nice UI
- **Coinbase Wallet** — browser extension version
- **WalletConnect** — for mobile wallets

Hardware wallets like Ledger work too, but you'll need to enable "blind signing" for the encrypted transactions.

## Connecting

1. Click **Connect Wallet** in the top right
2. Pick your wallet from the list
3. Approve the connection in your wallet

The app will ask to connect to Sepolia testnet. This is important — Aruvi runs on Sepolia for now, not Ethereum mainnet.

## Network Setup

If your wallet doesn't have Sepolia configured, the app will offer to add it. Click approve and you're set.

**Manual setup** (if needed):

| Setting | Value |
|---------|-------|
| Network Name | Sepolia |
| RPC URL | https://rpc.sepolia.org |
| Chain ID | 11155111 |
| Currency Symbol | ETH |
| Block Explorer | https://sepolia.etherscan.io |

## Getting Sepolia ETH

You need a tiny bit of Sepolia ETH to pay for transaction gas. It's free:

- [Sepolia Faucet](https://sepoliafaucet.com/) — requires Alchemy account
- [Infura Faucet](https://www.infura.io/faucet/sepolia) — quick and easy
- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) — no login needed

Request 0.1 ETH. That's plenty for hundreds of test transactions.

## Troubleshooting

**"Wrong network" error**
Click the network switcher in MetaMask and select Sepolia.

**Connection keeps failing**
Try refreshing the page, or disconnect and reconnect your wallet.

**Transactions stuck pending**
Gas might be too low. In MetaMask, you can speed up or cancel pending transactions.

## What About Privacy?

Your wallet address is still visible when you connect — that's how Ethereum works. What's private is the *amounts* you send and receive. Nobody can see your balance or transaction values.

Think of it like this: people can see that you went to the store, but they can't see what you bought or how much you spent.
