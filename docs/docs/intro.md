---
sidebar_position: 1
slug: /intro
---

# Welcome to Aruvi

**Aruvi** is a privacy-first payment platform built on [Zama's fhEVM](https://www.zama.ai/fhevm). It allows you to send, receive, and manage payments with **complete confidentiality** — transaction amounts are encrypted and invisible to everyone except the parties involved.

## What Makes Aruvi Different?

Traditional blockchain payments have a fundamental problem: **everything is public**. When you send crypto, anyone can see:
- How much you sent
- Who you sent it to
- Your entire transaction history

This is like having your bank statement posted on a billboard. Aruvi changes that.

### 🔒 True Financial Privacy

With Aruvi, your payment amounts are encrypted using **Fully Homomorphic Encryption (FHE)**. This means:

- **Only you** can see your balance
- **Only you and the recipient** know the payment amount
- **No one** can track your spending patterns
- **Businesses** can accept payments without exposing their revenue

### 💸 Familiar Payment Experience

Despite the advanced cryptography under the hood, Aruvi feels like any modern payment app:

- Send money with an address or payment link
- Request payments from anyone
- Set up recurring subscriptions
- Accept payments for your business
- Issue refunds when needed

### 🏪 For Businesses

Accept private payments on your website with just a few lines of code:

```html
<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.min.js"></script>
<div id="pay-button"></div>
<script>
  Aruvi.init({ environment: 'testnet' });
  Aruvi.button('#pay-button', {
    amount: '49.99',
    merchant: '0xYourWallet',
    description: 'Premium Plan',
    onSuccess: (result) => {
      // Payment received!
    }
  });
</script>
```

[Learn more about business integration →](/docs/developers/frontend-sdk)

## How It Works (Simplified)

1. **Wrap your USDC** → Converts regular USDC into confidential cUSDC
2. **Send privately** → The amount is encrypted; only you and recipient see it
3. **Recipient unwraps** → Convert back to regular USDC when needed

The encryption happens automatically. You don't need to understand cryptography — just use Aruvi like any payment app.

## Network Information

| Property | Value |
|----------|-------|
| **Network** | Ethereum Sepolia (Testnet) |
| **Token** | cUSDC (Confidential USDC) |
| **Underlying** | Circle USDC |
| **Encryption** | Zama fhEVM (Fully Homomorphic Encryption) |

## Use Cases

### For Individuals
- **Private transfers**: Send money without revealing amounts
- **Salary payments**: Receive income privately
- **Donations**: Support causes anonymously

### For Businesses
- **E-commerce**: Accept payments without exposing revenue
- **Subscriptions**: Recurring billing with privacy
- **Invoicing**: Send professional payment requests
- **Point of sale**: QR codes for in-person payments

:::tip Ready to start?
Head to the [Quick Start Guide](/docs/getting-started/quick-start) to make your first private payment in under 5 minutes.
:::
