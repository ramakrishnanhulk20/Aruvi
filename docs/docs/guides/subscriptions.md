---
sidebar_position: 4
title: Subscriptions
---

# Subscriptions

Set up recurring private payments — rent, salaries, memberships, whatever repeats.

## Creating a Subscription

### For Payers (You're Paying)

1. Go to **Subscriptions** in the navigation
2. Click **Create New Subscription**
3. Fill in:
   - **Recipient**: Who gets paid
   - **Amount**: How much each period
   - **Frequency**: Daily, weekly, monthly
   - **Start Date**: When payments begin
4. Click **Create** and confirm

The first payment can be included immediately, or start on the date you specify.

### For Recipients (You're Receiving)

You don't need to do anything special. When someone creates a subscription paying you, payments just arrive on schedule.

Check **Activity** to see incoming subscription payments.

## Managing Subscriptions

### View Active Subscriptions

The Subscriptions page shows all your subscriptions:
- **Paying**: Subscriptions you're funding
- **Receiving**: Subscriptions paying you

Each shows:
- Recipient/sender address
- Amount per period
- Next payment date
- Status

### Execute a Payment

Subscriptions can be executed by anyone once the period elapses. Usually:
- The recipient runs it (they want their money!)
- Automation bots can run it
- You can run it manually

In the UI:
1. Find the subscription
2. If payment is due, you'll see "Execute" button
3. Click it, confirm, payment happens

### Cancel a Subscription

Changed your mind?

1. Find the subscription in your list
2. Click **Cancel**
3. Confirm the transaction

Cancellation is immediate. Any pending (unexecuted) payment is returned to you.

**Note:** Only the payer can cancel. Recipients can't cancel incoming subscriptions.

## How It Works Technically

Subscriptions use a pull model:

1. **Create**: Payer sets up subscription with encrypted amount
2. **Each Period**: Anyone can call `executeSubscription`
3. **Check**: Contract verifies enough time has passed
4. **Transfer**: If valid, moves encrypted funds from payer to recipient
5. **Update**: Next payment date is set

The payer doesn't need to be online. Once set up, it runs automatically when executed.

## Subscription States

| State | Description |
|-------|-------------|
| **Active** | Running normally |
| **Paused** | Temporarily stopped |
| **Cancelled** | Permanently ended |
| **Insufficient Funds** | Payer doesn't have enough |

### Insufficient Funds

What happens if you run out of money?

1. Execution attempt fails
2. Subscription stays active
3. Retry when balance replenished

The subscription doesn't auto-cancel on insufficient funds. You might just need to wrap more tokens.

## Use Cases

### Rent Payment

```
Amount: 1,500 USDC
Frequency: Monthly
Recipient: Landlord's address
```

Set it up once, never miss rent again.

### Salary

```
Amount: 5,000 USDC  
Frequency: Bi-weekly
Recipient: Employee's address
```

Great for DAOs paying contributors.

### Service Subscriptions

```
Amount: 9.99 USDC
Frequency: Monthly
Recipient: Service provider
```

Netflix-style recurring billing.

### Savings

```
Amount: 100 USDC
Frequency: Weekly
Recipient: Your savings wallet
```

Pay yourself first, automatically.

## Privacy with Subscriptions

All the usual privacy applies:

- ✅ Payment amounts are encrypted
- ✅ Your balance is hidden
- ❌ Addresses are visible
- ❌ Payment timing/frequency is visible

If subscription timing reveals information (e.g., salary payments), consider using a fresh wallet or varying the schedule slightly.

## Fees

- **Create subscription**: Gas fee
- **Execute payment**: Gas fee (paid by executor)
- **Cancel subscription**: Gas fee

No Aruvi fee on any operation.

## Limits and Considerations

- **No automatic execution**: Someone must call execute each period
- **Gas required**: Each execution costs gas
- **Balance needed**: Keep enough wrapped tokens for upcoming payments

For guaranteed execution, consider:
- Running your own automation
- Using a keeper service (coming soon)
- Asking recipients to execute (they're motivated!)

## Advanced: Contract Interaction

```javascript
// Create subscription
await gateway.createSubscription(
  recipientAddress,
  encryptedAmount,
  inputProof,
  intervalInSeconds
);

// Execute (anyone can call when due)
await gateway.executeSubscription(subscriptionId);

// Cancel (only payer)
await gateway.cancelSubscription(subscriptionId);
```

See [API Reference](/docs/api/payment-gateway) for complete details.
