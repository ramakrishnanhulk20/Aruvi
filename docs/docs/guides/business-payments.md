---
sidebar_position: 6
title: Business Payments
---

# Business Payments

Aruvi isn't just for individuals. Here's how to use it for business payments while maintaining privacy.

## Business Dashboard

The Business section in Aruvi provides:

- **Payment overview**: See incoming payments
- **Invoice management**: Create and track invoices
- **Customer tools**: Payment links and QR codes
- **Analytics**: Volume and trends (privacy-preserving)

## Creating Invoices

For business-to-business or customer invoices:

1. Go to **Business** → **Create Invoice**
2. Fill in:
   - Customer identifier (optional, for your records)
   - Amount
   - Description
   - Due date
3. Generate the invoice
4. Share via link, email, or QR code

When paid, the invoice automatically marks complete.

## Payment Links for Products

Selling something specific? Create a dedicated payment link:

1. **Business** → **Payment Links**
2. Click **Create New Link**
3. Set:
   - Product/service name
   - Fixed amount or variable
   - Link name (for your tracking)
4. Get your link and QR code

Use these for:
- Website checkout buttons
- Point-of-sale QR displays
- Email "Pay Now" links
- Social media payment requests

## QR Codes

Every payment link generates a QR code. Uses:

### In-Store Payments
Print the QR code. Customers scan with their phone, confirm, done.

### On Receipts
Add QR code to receipts for tips or additional purchases.

### At Events
Display codes for ticket sales, donations, or merchandise.

### Download Options
- SVG (scalable, good for print)
- PNG (standard image format)

## Privacy for Business

Business payments have some different privacy considerations:

### What You See
- All incoming payments
- Customer addresses
- Amounts (decrypted for you)

### What Customers See
- Your receiving address
- The amount they paid
- Transaction confirmation

### What Third Parties See
- Payment happened
- Addresses involved
- **Not** amounts or details

### Reporting and Taxes

You can decrypt all your received amounts for accounting. Export your transaction history for records.

Aruvi doesn't provide tax advice — consult professionals for your jurisdiction.

## Accepting Payments

### Website Integration (Recommended)

The easiest way to accept payments on your website is with the **Aruvi SDK**:

```html
<!-- Add to your website -->
<script src="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@aruvi/sdk/dist/aruvi-sdk.css">

<div id="pay-button"></div>

<script>
  Aruvi.init({ environment: 'testnet' });
  
  Aruvi.button('#pay-button', {
    amount: '29.99',
    merchant: '0xYOUR_WALLET',
    description: 'Product Name',
    onSuccess: (result) => {
      // Payment complete! Deliver the product
      window.location.href = '/thank-you';
    }
  });
</script>
```

This gives your customers a professional checkout experience with wallet connection, payment confirmation, and success handling.

📚 **[Full SDK Documentation →](/docs/developers/frontend-sdk)**

### Simple Payment Links

For email invoices, social media, or quick sharing:

```
https://app.aruvi.io/pay?to=YOUR_ADDRESS&amount=100&desc=Invoice%20123
```

Or generate links programmatically:

```javascript
const link = Aruvi.createPaymentLink({
  amount: '100.00',
  merchant: '0xYourAddress',
  description: 'Invoice #123'
});
```

### QR Codes

Every payment link can be converted to a QR code for:
- In-store displays
- Printed invoices
- Event tickets
- Restaurant tables

### API Integration

For advanced integrations, see the [Developer Integration Guide](/docs/developers/integration).

## Managing Customers

### Without Collecting Data

You can accept payments without storing any customer data:
- They pay, you deliver
- No database of customer info to protect
- Addresses are pseudonymous

### With Customer Tracking

If you need to track customers:
- Store address ↔ customer mapping in your own database
- Reference invoice IDs in transaction memos
- Use your own CRM connected via webhooks

## Payouts to Multiple Recipients

Need to pay several people (employees, vendors, affiliates)?

Currently, send individual transactions. Batch payments coming in future updates.

## Recurring Business Payments

### Collecting Subscriptions
1. Send customers a link to subscribe
2. They set up the recurring payment
3. Execute payments as they come due

### Paying Subscriptions
Set up subscriptions for regular business expenses:
- SaaS subscriptions
- Contractor retainers
- Rent and utilities

## Analytics

The Business dashboard shows:

- **Total received** (this month/all time)
- **Number of transactions**
- **Unique customers** (by address)

All viewable to you. Not exposed to blockchain observers.

## Multi-Wallet Setup

Many businesses use separate wallets for:
- **Receiving**: Customer-facing payments
- **Operations**: Day-to-day expenses
- **Savings/Treasury**: Long-term holdings

Aruvi works with any wallet structure. Connect the appropriate wallet for each task.

## Security Best Practices

1. **Use a hardware wallet** for significant funds
2. **Separate hot and cold storage** — receiving wallet vs. treasury
3. **Regular audits** — check balances and transaction history
4. **Backup everything** — seed phrases in secure locations
5. **Limit access** — not everyone needs the main wallet

## Getting Help

For business inquiries:
- Check our [FAQ](/docs/faq)
- Join the [Discord community](#)
- Email business@aruvi.io
