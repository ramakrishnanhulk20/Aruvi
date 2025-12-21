---
sidebar_position: 5
title: Refunds
---

# Refunds

Made a mistake? Product not delivered? Aruvi supports refunds for confidential payments.

## Requesting a Refund

If you sent money and need it back:

1. Go to **Activity** and find the transaction
2. Click on the transaction details
3. Click **Request Refund**
4. Add a reason (optional but helpful)
5. Submit the request

The recipient sees your refund request and can approve or decline.

## Processing Refunds (For Recipients)

When someone requests a refund from you:

1. Check **Activity** or **Refunds** page
2. You'll see pending refund requests
3. Review each request
4. Click **Approve** or **Decline**

**If you approve:**
- The original amount returns to the sender
- Transaction is marked as refunded

**If you decline:**
- Request is closed
- Original payment stands
- Requester can dispute off-chain if needed

## Refund States

| State | Meaning |
|-------|---------|
| **Pending** | Waiting for recipient decision |
| **Approved** | Money returned to sender |
| **Declined** | Recipient rejected the request |
| **Expired** | Request timed out |

## Time Limits

Refund requests have a window:

- **Request within**: 30 days of original payment (configurable)
- **Response time**: 7 days for recipient to respond
- **After expiry**: Request auto-declines

These limits prevent indefinite claims on old transactions.

## Privacy During Refunds

Refund amounts are encrypted, just like regular payments.

When you request a refund:
- The recipient can see a refund was requested
- The original (encrypted) amount is referenced
- No one else sees the amounts involved

## Partial Refunds

Currently, Aruvi supports full refunds only. Partial refunds are on the roadmap.

Workaround: Recipient can decline the full refund and send a new payment for the partial amount.

## Disputes

Aruvi is decentralized — there's no customer service to call.

If a refund is declined unfairly:
- Try reaching the recipient directly
- Use off-chain communication
- Document everything for any external dispute resolution

We're exploring decentralized dispute resolution for future versions.

## Merchant Considerations

If you're receiving payments as a business:

### Auto-Approve Settings

Some businesses auto-approve refunds within certain conditions:
- Within 24 hours
- Below certain amount
- Before product shipped

### Refund Policies

Display your refund policy clearly:
- In your checkout flow
- On payment requests
- In any confirmation messages

### Tracking

Keep records of:
- All refund requests
- Your responses
- Reasons for declining

## How It Works Technically

The refund flow:

1. **Request**: Sender creates refund request referencing original payment
2. **Review**: Recipient sees request, encrypted amount
3. **Approve**: Recipient calls `approveRefund` with encrypted amount
4. **Transfer**: Contract moves funds back to original sender

The smart contract doesn't enforce refunds — the recipient must approve. This matches real-world payment systems where merchants control refunds.

## Common Questions

### Can I refund a subscription payment?

Currently no. Subscriptions are designed for recurring payments where refunds don't typically apply. Cancel the subscription instead.

### What if recipient never responds?

Request expires after the timeout period (default 7 days). You'll need to reach them off-chain.

### Are refund requests private?

Yes. The request, amounts, and response are all encrypted. Third parties see that *something* happened but not what or how much.

### Can I cancel a refund request?

Yes, before it's processed:
1. Find the request in Activity
2. Click **Cancel Request**
3. Confirm

### What about gas fees?

- Requesting refund: Gas fee
- Approving refund: Gas fee
- Declining refund: Gas fee

Original transaction gas fees are never refunded — those went to validators.

## Best Practices

**For senders:**
- Request refunds promptly
- Provide clear reasons
- Keep records of what you sent and why you want it back

**For recipients:**
- Respond to requests quickly
- Be fair — your reputation matters
- Set clear policies upfront
