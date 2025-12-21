# @aruvi/sdk

Official JavaScript SDK for **Aruvi** - Privacy-First Payments powered by Fully Homomorphic Encryption (FHE).

Accept confidential payments on your website with just a few lines of code. Like PayPal, but privacy-preserving.

[![npm version](https://badge.fury.io/js/%40aruvi%2Fsdk.svg)](https://www.npmjs.com/package/@aruvi/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Privacy-First**: Payments encrypted with FHE - amounts hidden on-chain
- ⚡ **Easy Integration**: Add payments in minutes with drop-in components
- 🎨 **Customizable**: Styled buttons and modal that match your brand
- ⚛️ **React Support**: First-class React components and hooks
- 🔐 **Secure Verification**: Server-side payment verification utilities
- 📱 **Mobile Ready**: Responsive checkout that works on all devices

## Installation

```bash
npm install @aruvi/sdk
# or
yarn add @aruvi/sdk
# or
pnpm add @aruvi/sdk
```

### CDN (Browser)

```html
<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk@latest/dist/aruvi-sdk.min.js"></script>
```

## Quick Start

### Vanilla JavaScript

```html
<div id="pay-button"></div>

<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk@latest/dist/aruvi-sdk.min.js"></script>
<script>
  // Initialize
  Aruvi.init({
    merchantAddress: '0xYourWalletAddress',
    environment: 'testnet', // or 'mainnet'
  });

  // Create a pay button
  Aruvi.button('#pay-button', {
    amount: '25.00',
    description: 'Premium Plan',
    onSuccess: (result) => {
      console.log('Paid!', result.paymentId);
      // Verify payment on your server
    },
    onError: (error) => {
      console.error('Payment failed:', error.message);
    },
  });
</script>
```

### React

```tsx
import { AruviProvider, AruviButton } from '@aruvi/sdk/react';

function App() {
  return (
    <AruviProvider
      config={{
        merchantAddress: '0xYourWalletAddress',
        environment: 'testnet',
      }}
    >
      <CheckoutPage />
    </AruviProvider>
  );
}

function CheckoutPage() {
  return (
    <AruviButton
      payment={{
        amount: '99.00',
        description: 'Annual Subscription',
      }}
      onSuccess={(result) => {
        console.log('Payment successful!', result);
      }}
      variant="primary"
      size="large"
    />
  );
}
```

## API Reference

### Initialization

```javascript
Aruvi.init({
  merchantAddress: '0x...', // Required: Your wallet address
  environment: 'testnet',   // 'testnet' or 'mainnet'
  appUrl: 'https://...',    // Optional: Custom app URL
  theme: {
    primaryColor: '#0070ba',
    borderRadius: 12,
  },
});
```

### Creating Buttons

```javascript
// Using the global instance
Aruvi.button('#container', payment, options);

// Using the class
const aruvi = new Aruvi(config);
const button = aruvi.createButton('#container', payment, options);
```

#### Payment Options

| Property | Type | Description |
|----------|------|-------------|
| `amount` | `string` | Required. Amount in USDC (e.g., '25.00') |
| `description` | `string` | Optional. Shown to customer |
| `reference` | `string` | Optional. Your order reference |
| `metadata` | `object` | Optional. Custom data returned in callbacks |
| `customerEmail` | `string` | Optional. For receipts |

#### Button Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | 'Pay with Aruvi' | Button text |
| `variant` | `string` | 'primary' | 'primary', 'secondary', 'outline', 'dark' |
| `size` | `string` | 'medium' | 'small', 'medium', 'large' |
| `showLogo` | `boolean` | `true` | Show Aruvi logo |
| `disabled` | `boolean` | `false` | Disable button |

### Callbacks

```javascript
{
  onSuccess: (result) => {
    // Payment completed successfully
    // result.paymentId - Unique payment ID
    // result.transactionHash - Blockchain tx hash
    // result.amount - Amount paid
  },
  
  onError: (error) => {
    // Payment failed
    // error.code - Error code
    // error.message - Human-readable message
  },
  
  onCancel: () => {
    // User closed checkout without paying
  },
  
  onPending: (txHash) => {
    // Transaction submitted, awaiting confirmation
  },
}
```

### Manual Checkout

```javascript
const aruvi = new Aruvi(config);

aruvi.checkout({
  amount: '50.00',
  description: 'Order #12345',
  onSuccess: handleSuccess,
  onError: handleError,
});

// Close checkout programmatically
aruvi.closeCheckout();
```

### Payment Links

```javascript
// Generate a shareable payment link
const link = aruvi.createPaymentLink({
  amount: '100.00',
  description: 'Invoice #12345',
});
// Returns: https://app.aruvi.io/pay?to=0x...&amount=100.00&desc=Invoice%20%2312345
```

### Payment Verification

```javascript
// Verify by payment ID
const isValid = await aruvi.verifyPayment(paymentId, expectedAmount);

// Verify by transaction hash
const isValid = await aruvi.verifyTransaction(txHash);
```

### Event Listeners

```javascript
aruvi.on('checkout:open', () => console.log('Checkout opened'));
aruvi.on('checkout:close', () => console.log('Checkout closed'));
aruvi.on('payment:success', (event) => console.log('Paid!', event.data));
aruvi.on('payment:error', (event) => console.log('Failed', event.data));
aruvi.on('payment:cancel', () => console.log('Cancelled'));
aruvi.on('payment:pending', (event) => console.log('Pending', event.data.transactionHash));

// Remove listener
const unsubscribe = aruvi.on('payment:success', handler);
unsubscribe(); // Stop listening
```

## React Components

### AruviProvider

Wrap your app to provide Aruvi context:

```tsx
<AruviProvider config={{ merchantAddress: '0x...' }}>
  <App />
</AruviProvider>
```

### AruviButton

Drop-in payment button:

```tsx
<AruviButton
  payment={{ amount: '25.00', description: 'Product' }}
  onSuccess={(result) => console.log(result)}
  variant="primary"
  size="large"
/>
```

### CheckoutTrigger

For custom button designs:

```tsx
<CheckoutTrigger
  payment={{ amount: '25.00' }}
  onSuccess={handleSuccess}
>
  {({ onClick, isLoading }) => (
    <MyCustomButton onClick={onClick} loading={isLoading}>
      Buy Now
    </MyCustomButton>
  )}
</CheckoutTrigger>
```

### PaymentLink

Generate shareable links:

```tsx
<PaymentLink payment={{ amount: '50.00' }} newTab>
  Click to Pay $50
</PaymentLink>
```

### useAruvi Hook

Access Aruvi methods directly:

```tsx
function MyComponent() {
  const { checkout, verifyPayment, createPaymentLink } = useAruvi();
  
  const handlePurchase = () => {
    checkout({
      amount: '99.00',
      onSuccess: async (result) => {
        const verified = await verifyPayment(result.paymentId);
        if (verified) {
          // Fulfill order
        }
      },
    });
  };
  
  return <button onClick={handlePurchase}>Purchase</button>;
}
```

### usePaymentStatus Hook

Monitor payment status:

```tsx
function OrderStatus({ paymentId }) {
  const { isLoading, isVerified, error } = usePaymentStatus({
    paymentId,
    pollInterval: 5000, // Check every 5 seconds
  });
  
  if (isLoading) return <p>Checking payment...</p>;
  if (isVerified) return <p>✅ Payment confirmed!</p>;
  if (error) return <p>❌ {error}</p>;
  return null;
}
```

## Server-Side Verification

Always verify payments on your backend before fulfilling orders:

```javascript
// Node.js example
const { verifyPayment } = require('@aruvi/sdk');

app.post('/api/orders/complete', async (req, res) => {
  const { paymentId, orderId, amount } = req.body;
  
  // Verify the payment on-chain
  const result = await verifyPayment({
    paymentId,
    merchantAddress: process.env.MERCHANT_ADDRESS,
    expectedAmount: amount,
    environment: 'mainnet',
  });
  
  if (!result.verified) {
    return res.status(400).json({ error: 'Payment not verified' });
  }
  
  // Payment is valid - fulfill the order
  await fulfillOrder(orderId);
  res.json({ success: true });
});
```

## Webhooks (Coming Soon)

Configure webhooks to receive real-time payment notifications:

```javascript
// POST /api/webhooks/aruvi
app.post('/api/webhooks/aruvi', (req, res) => {
  // Verify signature
  const signature = req.headers['x-aruvi-signature'];
  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'payment.completed':
      await handlePaymentCompleted(data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
  }
  
  res.json({ received: true });
});
```

## Styling

The SDK injects minimal styles automatically. To customize:

```css
/* Override button styles */
.aruvi-button {
  /* Your custom styles */
}

/* Override modal styles */
.aruvi-modal-container {
  /* Your custom styles */
}
```

Or import the CSS file and modify:

```javascript
import '@aruvi/sdk/dist/aruvi-sdk.css';
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  AruviConfig,
  PaymentRequest,
  PaymentResult,
  PaymentError,
  AruviCallbacks,
} from '@aruvi/sdk';
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security

- All payments are processed through Aruvi's secure checkout
- Payment amounts are encrypted using Fully Homomorphic Encryption
- Always verify payments server-side before fulfilling orders
- Use HTTPS in production

## Support

- 📚 [Documentation](https://docs.aruvi.io)
- 💬 [Discord](https://discord.gg/aruvi)
- 🐛 [GitHub Issues](https://github.com/aruvi/sdk/issues)

## License

MIT © Aruvi
