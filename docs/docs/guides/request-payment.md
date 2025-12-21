---
sidebar_position: 2
title: Request Payment
---

# Request Payment

Sometimes you need to ask someone for money rather than sending it. Aruvi makes payment requests easy and private.

## Create a Request

### Basic Request

1. Click **Request** in the navigation
2. Enter the payer's address (who should pay you)
3. Enter the amount you're requesting
4. Optionally add a note (like "For dinner last night")
5. Click **Create Request**

The request is recorded on-chain. The payer can fulfill it whenever they're ready.

### Payment Links

For one-time payments from anyone:

1. In the Request section, click **Create Payment Link**
2. Set the amount (optional — leave blank for any amount)
3. Add a description
4. Click **Create Link**

You get a unique URL and QR code. Share either one:
- Send the link via text, email, or chat
- Show the QR code for in-person payments

When someone clicks the link, Aruvi opens with your details pre-filled.

## Understanding Requests

### Request States

| State | Meaning |
|-------|---------|
| **Pending** | Waiting for payment |
| **Completed** | Paid in full |
| **Cancelled** | You cancelled it |
| **Expired** | Time limit passed (if set) |

### What's Visible On-Chain

- Your address (who requested)
- Their address (who should pay)
- That a request exists
- **Not** the amount (encrypted!)

Even the request amount stays private.

## Fulfilling a Request

When someone requests money from you:

1. You'll see it in your **Activity** feed
2. Click on the request to see details
3. Click **Pay** to fulfill it
4. Confirm the transaction

The payment goes directly to the requester. The request status updates to completed.

## Managing Your Requests

### View Sent Requests

Go to **Activity** to see requests you've created. You can filter by status:
- All requests
- Pending only
- Completed only

### Cancel a Request

Changed your mind? 
1. Find the request in Activity
2. Click on it
3. Click **Cancel Request**
4. Confirm the cancellation

Cancelling is free (no gas) if done before payment.

### Request Expiration

By default, requests don't expire. But you can set an expiration when creating:

1. Click "Advanced Options" when creating a request
2. Set an expiration date
3. After that date, the request auto-cancels

Good for time-sensitive situations.

## Use Cases

### Splitting Bills

Out to dinner with friends?

1. Pay the whole bill yourself
2. Create requests to each friend for their share
3. They pay you back when convenient

### Freelance Work

Finished a project?

1. Create a payment link with the invoice amount
2. Send it to your client
3. They click and pay — simple

### Rent or Recurring Payments

Need monthly rent from a roommate?

1. Create a request each month
2. They pay when they see it

(Or set up a [subscription](/docs/guides/subscriptions) for automatic payments!)

### Donations

Accepting donations for your project?

1. Create a payment link without a set amount
2. Share widely
3. People contribute whatever they want

## Tips for Payment Links

**Keep them organized**: Name your links clearly. "Coffee fund" is better than "Link 1".

**Track usage**: The Activity page shows who paid through each link.

**Secure sharing**: Payment links aren't secret, but they are tied to your address. Anyone with the link can pay you — that's usually fine, but keep it in mind.

**QR codes**: Great for in-person payments. The recipient's phone opens Aruvi directly.

## Privacy Considerations

When you create a request:
- Your address is visible to the payer
- The payer's address is visible to you
- **Amounts are always encrypted**

Payment links are slightly more exposed since anyone with the link can see your address. Use fresh wallets if you need address privacy for specific situations.
