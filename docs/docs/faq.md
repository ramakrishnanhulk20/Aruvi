---
sidebar_position: 8
title: FAQ
---

# Frequently Asked Questions

Quick answers to common questions about Aruvi.

## General

### What is Aruvi?

Aruvi is a payment system on Ethereum where transaction amounts are encrypted. Your balance and payment amounts are private — even from the blockchain itself. It's built on [Zama's fhEVM](https://www.zama.ai/fhevm), using Fully Homomorphic Encryption.

### How is this different from regular crypto payments?

Regular crypto payments are completely public. When you send Bitcoin or Ethereum, everyone can see exactly how much you sent. With Aruvi, the amounts are encrypted. People can see that you made a transaction, but not how much.

### Is Aruvi a new blockchain?

No. Aruvi runs on Ethereum (currently Sepolia testnet). It's a set of smart contracts that add privacy to existing tokens.

### Do I need to create an account?

No account needed. Just connect your existing Ethereum wallet. No email, no KYC, no signup.

### Is it free to use?

There's no Aruvi fee. You only pay standard Ethereum gas fees, which go to validators, not us.

---

## Privacy

### What exactly is hidden?

- ✅ Transaction amounts
- ✅ Your token balance
- ❌ Your wallet address
- ❌ Who you transact with
- ❌ When you transact

### Can you see my balance?

No. Nobody can see your balance — not us, not other users, not even blockchain validators. Only your wallet can decrypt it.

### Can the government see my transactions?

They can see that transactions occurred between addresses, but not the amounts. Whether address ownership can be determined depends on many factors outside Aruvi.

### How is this different from Tornado Cash?

Tornado Cash hides both amounts AND addresses through mixing. Aruvi only hides amounts but works with standard wallets and is easier to use. Different tools for different needs.

### Should I use a new wallet for Aruvi?

For maximum privacy, yes. If your main wallet is publicly linked to your identity, using a fresh wallet for Aruvi prevents that linkage.

---

## Technical

### What is FHE?

Fully Homomorphic Encryption — a type of encryption that allows computations on encrypted data. The blockchain can verify you have enough funds and process transfers without ever seeing the actual numbers.

### Who operates the encryption?

Encryption happens in your browser. Decryption goes through Zama's Gateway, but your keys never leave your device. The Gateway helps with decryption but can't see balances or steal funds.

### What if Zama's servers go down?

Your funds are safe in the smart contracts. You might temporarily be unable to see decrypted balances, but you could still send transactions. Zama is working on decentralizing the Gateway.

### Why are gas fees higher?

FHE operations require more computation than regular transfers. It's the cost of privacy. We're optimizing, and costs will decrease over time.

### Which wallets work?

Any Ethereum wallet: MetaMask, Rabby, Coinbase Wallet, hardware wallets, etc. Standard wallet, no special setup.

---

## Using Aruvi

### How do I get started?

1. Connect wallet to app.aruvi.io
2. Get test USDC from faucet
3. Wrap USDC into confidential tokens
4. Send your first private payment

[Full guide →](/docs/getting-started/quick-start)

### What tokens are supported?

Currently USDC on Sepolia testnet. More tokens coming as we approach mainnet.

### Can I use this for my business?

Absolutely! Aruvi is designed for businesses to accept private payments. You can:

- **Add a checkout button** to your website with a few lines of code
- **Create payment links** to share via email or social media  
- **Generate QR codes** for in-store payments
- **Set up subscriptions** for recurring billing

```html
<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.min.js"></script>
<div id="pay-btn"></div>
<script>
  Aruvi.init({ environment: 'testnet' });
  Aruvi.button('#pay-btn', {
    amount: '49.99',
    merchant: '0xYourWallet',
    onSuccess: (r) => console.log('Paid!', r)
  });
</script>
```

[Full SDK Documentation →](/docs/developers/frontend-sdk) | [Business Guide →](/docs/guides/business-payments)

### How do subscriptions work?

You set up a recurring payment with amount, recipient, and frequency. Anyone can trigger the payment once the interval passes (usually the recipient). [More details →](/docs/guides/subscriptions)

### How do refunds work?

Recipients can approve refunds at their discretion. It's not automatic — similar to how credit card chargebacks require merchant cooperation. [More details →](/docs/guides/refunds)

---

## Troubleshooting

### My balance shows 0

Give it a moment. Balance decryption takes a few seconds. If it's been more than a minute, try refreshing the page.

### Transaction stuck pending

Gas might be too low. In MetaMask, you can speed up or cancel pending transactions.

### "Insufficient balance" but I have funds

You might have regular USDC instead of confidential USDC. Go to the Wrap section to convert.

### Can't connect wallet

1. Make sure you're on Sepolia network
2. Try refreshing the page
3. Clear browser cache
4. Try a different browser

### Decryption keeps failing

The Zama Gateway might be under heavy load. Wait a minute and try again. Check Discord for any service announcements.

---

## Security

### Is this safe?

Aruvi uses established cryptography (FHE) and runs on audited smart contracts. However, like all DeFi, there are risks. Start with small amounts.

### What if I lose my keys?

Standard crypto rules apply — if you lose your wallet keys, you lose access to your funds. We can't help recover them.

### Has Aruvi been audited?

We're on testnet preparing for audits. Bug bounty is active. [Security details →](/docs/security/overview)

### Is Aruvi decentralized?

The smart contracts are decentralized and immutable. Decryption currently goes through Zama's Gateway, which is being decentralized.

### Can Aruvi be shut down?

The smart contracts can't be stopped by anyone, including us. The frontend is just a convenience — you could always interact directly with contracts.

---

## Roadmap

### When is mainnet?

After thorough testing and security audits. We'd rather be slow and safe than fast and vulnerable.

### What's coming next?

- More supported tokens
- Layer 2 deployments
- Decentralized Gateway
- Cross-chain bridges
- Mobile app

### How can I contribute?

- Test on Sepolia and report bugs
- Join Discord community
- Contribute to open source
- Spread the word

---

## Other

### Why the name "Aruvi"?

"Aruvi" means "waterfall" in Tamil. We liked the imagery of value flowing freely and naturally.

### Is there a token?

No. There's no Aruvi token. We're focused on building useful privacy tools, not speculation.

### How does Aruvi make money?

We don't currently. Future possibilities include optional premium features or enterprise services, but core functionality will always be free.

### Where can I learn more?

- **Documentation**: You're reading it!
- **Discord**: Join our community
- **Twitter**: @AruuiProtocol
- **GitHub**: Source code and issues

---

Still have questions? Ask in [Discord](#) or email hello@aruvi.io.
