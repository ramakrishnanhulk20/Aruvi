---
sidebar_position: 1
title: Send Money
---

# Send Money

Sending private payments is Aruvi's bread and butter. Here's how to do it.

## Quick Send

The fastest way to send money:

1. Open Aruvi and connect your wallet
2. Click **Send** in the navigation
3. Enter the recipient's address
4. Enter the amount
5. Click **Send** and confirm in MetaMask

That's it. The recipient gets private tokens. Nobody sees the amount.

## Detailed Walkthrough

### Step 1: Navigate to Send

From the dashboard, click the **Send** button. You'll see the send form.

### Step 2: Enter Recipient

Paste the recipient's Ethereum address. The form validates it's a proper address format.

**Tips:**
- Double-check the address — crypto transactions are irreversible
- Consider sending a small test amount first
- You can scan a QR code if the recipient shares one

### Step 3: Enter Amount

Type how much you want to send. The form shows your available balance.

**Note:** You're sending confidential tokens. Make sure you have wrapped USDC, not regular USDC.

### Step 4: Review

Before confirming, you'll see:
- Recipient address
- Amount to send
- Estimated gas fee

Take a second to verify everything.

### Step 5: Confirm Transaction

Click **Send**. MetaMask pops up with the transaction details.

**What you'll see in MetaMask:**
- The transaction calls the PaymentGateway contract
- Gas estimate
- **Not** the amount (that's encrypted!)

Click confirm. The transaction submits to the network.

### Step 6: Wait for Confirmation

The transaction needs to be mined. Usually takes 10-30 seconds on Sepolia.

You'll see a success message once confirmed.

## What Happens Behind the Scenes

When you click send:

1. **Encrypt**: Your browser encrypts the amount using FHE
2. **Submit**: The encrypted amount goes to the smart contract
3. **Verify**: Contract checks you have sufficient (encrypted) balance
4. **Transfer**: Contract moves encrypted value between accounts
5. **Update**: Both balances update (still encrypted)

Nobody except you and the recipient ever sees the actual amount.

## Using Payment Links

Instead of entering an address, you can use a payment link:

1. The recipient creates a payment link in **Request**
2. They share the link with you
3. Click the link — it opens Aruvi with details pre-filled
4. Just confirm and send

Payment links can include suggested amounts and notes.

## Sending to Multiple Recipients

Need to send to several people? Currently you'll need to:

1. Send to the first recipient
2. Wait for confirmation
3. Send to the next recipient
4. Repeat

Batch payments are on our roadmap for future releases.

## Transaction Fees

You pay gas in ETH (Sepolia ETH for testnet). The payment itself has no Aruvi fee.

Gas costs are higher than regular ERC20 transfers because of FHE computation. Expect roughly 3-5x a normal transfer's gas cost.

## Troubleshooting

### "Insufficient balance"
You might have regular USDC but not confidential USDC. Go to **Wrap** and convert some tokens first.

### Transaction stuck pending
Gas might be too low. In MetaMask, you can speed up the transaction by paying more gas.

### Balance didn't update
Give it a moment. Decryption takes time. Refresh the page if it's been more than a minute.

### Wrong network
Make sure you're on Sepolia. The app will prompt you to switch if needed.

## Security Tips

1. **Verify addresses carefully** — transactions can't be reversed
2. **Start small** — send a test transaction first
3. **Check your balance** — make sure you have enough wrapped tokens
4. **Keep some ETH** — you always need gas money
