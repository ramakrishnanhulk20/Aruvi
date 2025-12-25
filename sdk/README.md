# @aruvi/sdk

Official JavaScript SDK for **Aruvi** - Privacy-First Payments powered by Fully Homomorphic Encryption (FHE).

Accept confidential payments on your website with just a few lines of code. Transaction amounts are encrypted on-chain - only sender and recipient can see them.

[![npm version](https://badge.fury.io/js/%40aruvi%2Fsdk.svg)](https://www.npmjs.com/package/@aruvi/sdk)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Links

- 📚 **Documentation**: [aruvi-documentation.vercel.app](https://aruvi-documentation.vercel.app)
- 🚀 **Live App**: [aruvi-dapp.vercel.app](https://aruvi-dapp.vercel.app)
- 💻 **GitHub**: [github.com/ramakrishnanhulk20/Aruvi](https://github.com/ramakrishnanhulk20/Aruvi)
- 📦 **npm**: [npmjs.com/package/@aruvi/sdk](https://www.npmjs.com/package/@aruvi/sdk)

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
```

or

```bash
yarn add @aruvi/sdk
```

or

```bash
pnpm add @aruvi/sdk
```

### CDN (Browser)

```html
<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk@latest/dist/aruvi-sdk.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@aruvi/sdk@latest/dist/aruvi-sdk.css">
```

## Quick Start

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@aruvi/sdk@latest/dist/aruvi-sdk.css">
</head>
<body>
  <div id="pay-button"></div>

  <script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk@latest/dist/aruvi-sdk.min.js"></script>
  <script>
    // Initialize Aruvi
    Aruvi.init({
      merchantAddress: '0xYourWalletAddress',
      environment: 'testnet', // 'testnet' for Sepolia, 'mainnet' for production
    });

    // Create a pay button
    Aruvi.button('#pay-button', {
      amount: '25.00',
      currency: 'USDC',
      description: 'Premium Plan',
      onSuccess: (result) => {
        console.log('Payment successful!', result.paymentId);
        // Verify payment on your server
      },
      onError: (error) => {
        console.error('Payment failed:', error.message);
      },
    });
  </script>
</body>
</html>
```

### React

```tsx
import { AruviProvider, AruviButton } from '@aruvi/sdk/react';
import '@aruvi/sdk/styles.css';

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
  const handleSuccess = (result) => {
    console.log('Payment ID:', result.paymentId);
    console.log('Transaction:', result.txHash);
    // Send paymentId to your backend for verification
  };

  const handleError = (error) => {
    console.error('Payment error:', error.message);
  };

  return (
    <AruviButton
      payment={{
        amount: '99.00',
        currency: 'USDC',
        description: 'Annual Subscription',
      }}
      onSuccess={handleSuccess}
      onError={handleError}
      variant="primary"
      size="large"
    />
  );
}

export default App;
```

## API Reference

### `Aruvi.init(config)`

Initialize the SDK with your configuration.

```javascript
Aruvi.init({
  merchantAddress: '0x...', // Your wallet address to receive payments
  environment: 'testnet',   // 'testnet' (Sepolia) or 'mainnet'
  theme: 'light',           // 'light' or 'dark' (optional)
});
```

### `Aruvi.button(selector, options)`

Create a payment button.

```javascript
Aruvi.button('#button-container', {
  amount: '50.00',           // Payment amount
  currency: 'USDC',          // Currency (default: 'USDC')
  description: 'Product',    // What the payment is for
  metadata: { orderId: '123' }, // Custom data (optional)
  onSuccess: (result) => {}, // Success callback
  onError: (error) => {},    // Error callback
  onCancel: () => {},        // Cancel callback (optional)
});
```

### `Aruvi.checkout(options)`

Open checkout modal programmatically.

```javascript
Aruvi.checkout({
  amount: '100.00',
  description: 'Order #12345',
  onSuccess: (result) => {
    // Payment completed
  },
});
```

### Payment Result Object

```typescript
interface PaymentResult {
  paymentId: string;    // Unique payment identifier (bytes32)
  txHash: string;       // Transaction hash on blockchain
  amount: string;       // Payment amount
  from: string;         // Sender address
  to: string;           // Recipient (merchant) address
  timestamp: number;    // Unix timestamp
}
```

## Server-Side Verification

Always verify payments on your backend before fulfilling orders.

```javascript
import { verifyPayment } from '@aruvi/sdk';

// On your server
async function handlePaymentWebhook(paymentId) {
  const result = await verifyPayment(paymentId, {
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
    gatewayAddress: '0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b',
  });

  if (result.verified) {
    console.log('Payment verified!');
    console.log('From:', result.from);
    console.log('To:', result.to);
    // Fulfill order
  } else {
    console.log('Payment not verified:', result.error);
  }
}
```

## Contract Addresses (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| AruviPaymentGateway | `0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b` |
| ConfidentialUSDCWrapper | `0xf99376BE228E8212C3C9b8B746683C96C1517e8B` |
| USDC (Circle) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

## Styling

Import the default styles:

```javascript
import '@aruvi/sdk/styles.css';
```

Or customize with CSS variables:

```css
:root {
  --aruvi-primary: #6366f1;
  --aruvi-primary-hover: #4f46e5;
  --aruvi-text: #1f2937;
  --aruvi-background: #ffffff;
  --aruvi-border: #e5e7eb;
  --aruvi-border-radius: 8px;
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { 
  AruviConfig,
  PaymentOptions,
  PaymentResult,
  VerificationResult 
} from '@aruvi/sdk';
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

BSD-3-Clause License - see [LICENSE](https://github.com/ramakrishnanhulk20/Aruvi/blob/master/LICENSE) for details.

## Author

Built with 🔐 by [Ram](https://github.com/ramakrishnanhulk20)

## Support

- 📖 [Documentation](https://aruvi-documentation.vercel.app)
- 🐛 [Report Issues](https://github.com/ramakrishnanhulk20/Aruvi/issues)
- 💬 [Discussions](https://github.com/ramakrishnanhulk20/Aruvi/discussions)
