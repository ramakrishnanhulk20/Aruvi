---
sidebar_position: 3
title: Get Test Tokens
---

# Get Test Tokens

To use Aruvi, you need two things: Sepolia ETH (for gas) and wrapped USDC (for payments).

## Sepolia ETH

Every transaction on Ethereum costs a small fee called "gas." On Sepolia testnet, the ETH is free.

### Faucets

Pick one that works for you:

| Faucet | Pros | Cons |
|--------|------|------|
| [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) | No login required | Sometimes slow |
| [Infura](https://www.infura.io/faucet/sepolia) | Fast, reliable | Needs free account |
| [Alchemy](https://sepoliafaucet.com/) | Generous amounts | Needs Alchemy account |

**How much do you need?**
0.05 ETH is enough for dozens of transactions. Request 0.1 to be safe.

### If Faucets Are Dry

Sometimes faucets run low. A few backup options:

1. Ask in the [Aruvi Discord](#) — community members often help
2. Try again in a few hours
3. Use a different faucet from the list

## Test USDC

Aruvi uses a test version of USDC on Sepolia. You'll wrap this into confidential tokens.

### Getting Test USDC

1. Open Aruvi and go to the **Wrap** section
2. You'll see a "Get Test USDC" link if your balance is low
3. Click it to receive test tokens from our faucet

The faucet gives you 1,000 test USDC at a time. That's plenty for testing all features.

### Wrapping Into Confidential Tokens

Once you have USDC, you need to wrap it:

1. In the **Wrap** section, enter the amount to wrap
2. You'll first need to "Approve" the contract to use your USDC
3. Then click "Wrap" to convert it

After wrapping, your USDC becomes **encrypted**. Your balance shows as an encrypted value that only you can decrypt.

## Token Addresses

If you need to add tokens to MetaMask manually:

| Token | Address |
|-------|---------|
| USDC (Circle) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| Confidential USDC | `0xf99376BE228E8212C3C9b8B746683C96C1517e8B` |

**To add to MetaMask:**
1. Open MetaMask → Assets → Import tokens
2. Paste the address
3. MetaMask fills in the rest
4. Click "Add Custom Token"

## Understanding Your Balances

After wrapping, you'll have two balances:

- **USDC** — regular tokens, visible to everyone
- **Confidential USDC** — encrypted, only you see the real amount

The app handles decrypting your confidential balance automatically. It might take a moment to load after you first connect.

## Quick Test

Here's a way to verify everything is working:

1. Wrap 100 USDC
2. Send 10 to another address you control
3. Check that you received it in the other wallet
4. Unwrap some back to regular USDC

If all that works, you're all set! 🎉
