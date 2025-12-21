---
sidebar_position: 4
title: Aruvi SDK
---

# Aruvi SDK

Accept private payments on your website with the Aruvi SDK. Add a checkout button, embed a payment modal, or create payment links — all with complete transaction privacy.

## Why Use Aruvi for Your Business?

- **Privacy-First**: Transaction amounts are encrypted. Competitors can't see your sales volume.
- **Low Fees**: Minimal blockchain gas fees, no payment processor markup.
- **No Chargebacks**: Crypto payments are final (refunds are optional and controlled by you).
- **Global**: Accept payments from anyone with an Ethereum wallet.
- **Self-Custody**: Funds go directly to your wallet — no intermediaries.

---

## Quick Start (5 Minutes)

The fastest way to accept Aruvi payments — a single script tag:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Store</title>
</head>
<body>
  <h1>Premium Membership - $49.99</h1>
  
  <!-- 1. Add the Aruvi SDK -->
  <script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.css">
  
  <!-- 2. Add a Pay Button -->
  <div id="aruvi-button"></div>
  
  <script>
    // 3. Initialize and create button
    Aruvi.init({
      environment: 'testnet', // Use 'mainnet' for production
    });
    
    Aruvi.button('#aruvi-button', {
      amount: '49.99',
      merchant: '0xYOUR_WALLET_ADDRESS',
      description: 'Premium Membership',
      onSuccess: function(result) {
        alert('Payment successful! Transaction: ' + result.transactionHash);
        // Redirect to success page or unlock content
        window.location.href = '/thank-you?tx=' + result.transactionHash;
      },
      onError: function(error) {
        console.error('Payment failed:', error);
      }
    });
  </script>
</body>
</html>
```

That's it! Users click the button → Aruvi checkout opens → They pay → You get notified.

---

## Installation Options

### Option 1: CDN (Recommended for simple sites)

```html
<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.css">
```

### Option 2: NPM (For React/Vue/Angular apps)

```bash
npm install @aruvi/sdk
```

```javascript
import { Aruvi } from '@aruvi/sdk';
import '@aruvi/sdk/styles.css';
```

### Option 3: React Components

```bash
npm install @aruvi/sdk
```

```jsx
import { AruviProvider, AruviButton } from '@aruvi/sdk/react';
import '@aruvi/sdk/styles.css';
```

---

## Integration Methods

### Method 1: Checkout Button

The simplest integration — a styled "Pay with Aruvi" button:

```javascript
// Initialize once
Aruvi.init({ environment: 'testnet' });

// Create a button
Aruvi.button('#pay-button', {
  amount: '25.00',
  merchant: '0xYourAddress',
  description: 'Product Name',
  reference: 'ORDER-123', // Your order ID
  onSuccess: (result) => {
    console.log('Paid!', result.transactionHash);
  }
});
```

**Button Options:**

| Option | Type | Description |
|--------|------|-------------|
| `amount` | string | Payment amount in USD (e.g., "49.99") |
| `merchant` | string | Your wallet address |
| `description` | string | What the payment is for |
| `reference` | string | Your order/invoice ID |
| `metadata` | object | Custom data (stored in transaction) |
| `variant` | string | "primary", "secondary", or "outline" |
| `size` | string | "small", "medium", or "large" |
| `onSuccess` | function | Called after successful payment |
| `onError` | function | Called if payment fails |
| `onCancel` | function | Called if user cancels |

---

### Method 2: Checkout Modal

Open a full checkout experience programmatically:

```javascript
Aruvi.init({ environment: 'testnet' });

// When user clicks your own button
document.getElementById('my-checkout-btn').onclick = function() {
  Aruvi.checkout({
    amount: '99.00',
    merchant: '0xYourAddress',
    description: 'Annual Subscription',
    reference: 'SUB-456',
    email: 'customer@email.com', // Optional: pre-fill
    onSuccess: (result) => {
      // Payment complete!
      fetch('/api/activate-subscription', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'SUB-456',
          txHash: result.transactionHash,
          paymentId: result.paymentId
        })
      });
    },
    onCancel: () => {
      console.log('User closed checkout');
    }
  });
};
```

---

### Method 3: Payment Links

Generate shareable payment links:

```javascript
const link = Aruvi.createPaymentLink({
  amount: '50.00',
  merchant: '0xYourAddress',
  description: 'Consulting Fee',
  reference: 'INV-789'
});

// Returns: https://app.aruvi.io/pay?merchant=0x...&amount=50.00&...
console.log(link);

// Use in email, SMS, social media, etc.
```

**Use Cases:**
- Invoice emails: "Click here to pay"
- Social media: Share a payment link
- QR codes: Convert link to QR
- SMS: Text payment requests

---

### Method 4: React Components

For React applications, use the pre-built components:

```jsx
import { AruviProvider, AruviButton } from '@aruvi/sdk/react';

function App() {
  return (
    <AruviProvider config={{ environment: 'testnet' }}>
      <CheckoutPage />
    </AruviProvider>
  );
}

function CheckoutPage() {
  return (
    <div>
      <h1>Complete Your Purchase</h1>
      
      <AruviButton
        payment={{
          amount: '29.99',
          merchant: '0xYourAddress',
          description: 'Pro Plan',
          reference: 'order-123'
        }}
        onSuccess={(result) => {
          // Redirect to success page
          router.push(`/success?tx=${result.transactionHash}`);
        }}
        onError={(error) => {
          toast.error('Payment failed');
        }}
        label="Subscribe Now"
        variant="primary"
        size="large"
      />
    </div>
  );
}
```

**Available React Components:**

| Component | Description |
|-----------|-------------|
| `<AruviProvider>` | Wraps your app, initializes SDK |
| `<AruviButton>` | Styled payment button |
| `<CheckoutTrigger>` | Headless, use your own button UI |
| `<PaymentLink>` | Generates and displays payment link |

**React Hooks:**

```jsx
import { useAruvi, usePaymentStatus } from '@aruvi/sdk/react';

function CustomCheckout() {
  const { checkout, isCheckoutOpen, verifyPayment } = useAruvi();
  
  const handlePay = () => {
    checkout({
      amount: '100.00',
      merchant: '0x...',
      onSuccess: async (result) => {
        // Verify on your server
        const verified = await verifyPayment(result.paymentId);
        if (verified) {
          // Grant access
        }
      }
    });
  };
  
  return <button onClick={handlePay}>Pay $100</button>;
}
```

---

## Server-Side Verification

**Important:** Always verify payments on your server before delivering goods/services.

### Node.js Example

```javascript
const { verifyPayment } = require('@aruvi/sdk/verify');

app.post('/api/verify-payment', async (req, res) => {
  const { paymentId, expectedAmount } = req.body;
  
  try {
    const result = await verifyPayment(paymentId, {
      expectedAmount,
      environment: 'testnet'
    });
    
    if (result.verified) {
      // Payment is real and matches expected amount
      await unlockUserContent(result.to, result.paymentId);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Verification by Transaction Hash

```javascript
const { verifyPaymentByTxHash } = require('@aruvi/sdk/verify');

const result = await verifyPaymentByTxHash(
  '0x1234...', // Transaction hash
  {
    expectedRecipient: '0xYourAddress',
    environment: 'testnet'
  }
);
```

---

## Complete E-commerce Example

Here's a full checkout flow for an online store:

### 1. Product Page (Frontend)

```html
<div class="product">
  <h2>Wireless Headphones</h2>
  <p class="price">$79.99</p>
  <div id="buy-button"></div>
</div>

<script>
Aruvi.init({ environment: 'testnet' });

// Create order first, then show payment button
async function initCheckout() {
  // Create order on your server
  const response = await fetch('/api/create-order', {
    method: 'POST',
    body: JSON.stringify({
      product: 'wireless-headphones',
      price: 79.99
    })
  });
  const order = await response.json();
  
  // Now show payment button with order reference
  Aruvi.button('#buy-button', {
    amount: '79.99',
    merchant: '0xYOUR_STORE_WALLET',
    description: 'Wireless Headphones',
    reference: order.id, // Links payment to your order
    onSuccess: async (result) => {
      // Notify your server
      await fetch('/api/payment-complete', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          transactionHash: result.transactionHash,
          paymentId: result.paymentId
        })
      });
      
      // Show success
      window.location.href = '/order-confirmed?id=' + order.id;
    }
  });
}

initCheckout();
</script>
```

### 2. Order API (Backend)

```javascript
// POST /api/create-order
app.post('/api/create-order', async (req, res) => {
  const { product, price } = req.body;
  
  const order = await db.orders.create({
    product,
    price,
    status: 'pending',
    createdAt: new Date()
  });
  
  res.json({ id: order.id });
});

// POST /api/payment-complete
app.post('/api/payment-complete', async (req, res) => {
  const { orderId, transactionHash, paymentId } = req.body;
  
  // Verify the payment is real
  const { verifyPayment } = require('@aruvi/sdk/verify');
  const verification = await verifyPayment(paymentId);
  
  if (!verification.verified) {
    return res.status(400).json({ error: 'Invalid payment' });
  }
  
  // Update order status
  await db.orders.update(orderId, {
    status: 'paid',
    transactionHash,
    paymentId,
    paidAt: new Date()
  });
  
  // Send confirmation email, trigger fulfillment, etc.
  await sendOrderConfirmation(orderId);
  
  res.json({ success: true });
});
```

---

## Webhooks (Event Notifications)

For real-time notifications when payments arrive, set up an event listener:

```javascript
// In your backend, listen for blockchain events
const { createPaymentListener } = require('@aruvi/sdk/verify');

const listener = createPaymentListener({
  merchantAddress: '0xYourAddress',
  environment: 'testnet',
  onPayment: async (payment) => {
    console.log('Payment received!', {
      from: payment.from,
      paymentId: payment.paymentId,
      transactionHash: payment.transactionHash
    });
    
    // Find order by reference and mark as paid
    const order = await db.orders.findByReference(payment.reference);
    if (order) {
      await markOrderPaid(order.id, payment.transactionHash);
    }
  }
});

listener.start();
```

---

## Styling & Customization

### Button Variants

```javascript
// Primary (blue gradient) - default
Aruvi.button('#btn1', { ...options, variant: 'primary' });

// Secondary (light background)
Aruvi.button('#btn2', { ...options, variant: 'secondary' });

// Outline (transparent with border)
Aruvi.button('#btn3', { ...options, variant: 'outline' });
```

### Button Sizes

```javascript
Aruvi.button('#btn', { ...options, size: 'small' });  // Compact
Aruvi.button('#btn', { ...options, size: 'medium' }); // Default
Aruvi.button('#btn', { ...options, size: 'large' });  // Prominent
```

### Custom CSS

Override the default styles:

```css
/* Custom button styles */
.aruvi-button {
  font-family: 'Your Font', sans-serif !important;
  border-radius: 4px !important;
}

/* Custom modal styles */
.aruvi-modal-overlay {
  background: rgba(0, 0, 0, 0.8) !important;
}

.aruvi-modal-container {
  border-radius: 16px !important;
}
```

---

## Testing

### Testnet Setup

1. Use `environment: 'testnet'` in your config
2. Connect with a testnet wallet (get Sepolia ETH from a faucet)
3. Get test cUSDC from the Aruvi app

### Test Payments

```javascript
// Always use testnet during development
Aruvi.init({ environment: 'testnet' });

// Test with small amounts
Aruvi.checkout({
  amount: '0.01', // 1 cent
  merchant: '0xYourTestWallet',
  description: 'Test Payment',
  onSuccess: (result) => {
    console.log('Test payment succeeded!', result);
  }
});
```

---

## Going to Production

When ready for real payments:

1. **Switch to mainnet:**
   ```javascript
   Aruvi.init({ environment: 'mainnet' });
   ```

2. **Use your production wallet address**

3. **Set up server-side verification** (required!)

4. **Test the full flow** with a real small payment

---

## FAQ

### How do I know if a payment is real?

Always verify payments server-side using `verifyPayment()`. Never trust client-side callbacks alone for valuable transactions.

### What currency does Aruvi use?

Aruvi uses cUSDC (Confidential USDC) — a privacy-wrapped version of Circle's USDC stablecoin. 1 cUSDC = 1 USD.

### Are there any fees?

Only standard Ethereum gas fees. Aruvi doesn't charge processing fees.

### What if a customer wants a refund?

You control refunds. Use the Aruvi app or SDK to send money back to the customer's address.

### Can I accept subscription payments?

Yes! Use the subscription features in the Aruvi app or integrate programmatically. See [Subscriptions Guide](/docs/guides/subscriptions).

---

## Need Help?

- 📖 [Full API Reference](/docs/api/payment-gateway)
- 🔧 [Contract Integration](/docs/developers/contracts)
- 🔐 [Security Best Practices](/docs/security/overview)
