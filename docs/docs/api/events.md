---
sidebar_position: 3
title: Events
---

# Contract Events

All events emitted by Aruvi contracts. Use these for indexing, notifications, and tracking.

## Querying Events

### Using viem

```typescript
import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// Get past events
const logs = await client.getLogs({
  address: PAYMENT_GATEWAY,
  event: parseAbiItem('event PaymentSent(uint256 indexed paymentId, address indexed from, address indexed to)'),
  fromBlock: 1000000n,
  toBlock: 'latest',
  args: {
    to: userAddress, // Filter to specific recipient
  },
});
```

### Using ethers

```typescript
const filter = gateway.filters.PaymentSent(null, null, userAddress);
const events = await gateway.queryFilter(filter, -10000);
```

### Watching Real-time

```typescript
client.watchContractEvent({
  address: PAYMENT_GATEWAY,
  abi: gatewayAbi,
  eventName: 'PaymentSent',
  onLogs: (logs) => {
    console.log('New payment:', logs);
  },
});
```

---

## PaymentGateway Events

### PaymentSent

Emitted when a confidential payment is made.

```solidity
event PaymentSent(
    uint256 indexed paymentId,
    address indexed from,
    address indexed to
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `paymentId` | ✅ | Unique payment identifier |
| `from` | ✅ | Sender address |
| `to` | ✅ | Recipient address |

**Use cases:**
- Track incoming payments
- Build transaction history
- Trigger notifications

**Note:** Amount is NOT included — it's confidential.

---

### PaymentRequestCreated

Emitted when someone requests a payment.

```solidity
event PaymentRequestCreated(
    uint256 indexed requestId,
    address indexed from,
    address indexed to
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `requestId` | ✅ | Request identifier |
| `from` | ✅ | Requested payer |
| `to` | ✅ | Requester (recipient) |

---

### PaymentRequestFulfilled

Emitted when a request is paid.

```solidity
event PaymentRequestFulfilled(
    uint256 indexed requestId
);
```

---

### PaymentRequestCancelled

Emitted when a request is cancelled.

```solidity
event PaymentRequestCancelled(
    uint256 indexed requestId
);
```

---

### SubscriptionCreated

Emitted when a new subscription starts.

```solidity
event SubscriptionCreated(
    uint256 indexed subscriptionId,
    address indexed payer,
    address indexed recipient,
    uint256 interval
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `subscriptionId` | ✅ | Subscription identifier |
| `payer` | ✅ | Who pays |
| `recipient` | ✅ | Who receives |
| `interval` | ❌ | Seconds between payments |

---

### SubscriptionExecuted

Emitted each time a subscription payment is made.

```solidity
event SubscriptionExecuted(
    uint256 indexed subscriptionId,
    uint256 executionCount
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `subscriptionId` | ✅ | Which subscription |
| `executionCount` | ❌ | How many times executed total |

---

### SubscriptionCancelled

Emitted when subscription is cancelled.

```solidity
event SubscriptionCancelled(
    uint256 indexed subscriptionId
);
```

---

## ConfidentialUSDCWrapper Events

### Wrapped

Emitted when USDC is wrapped into confidential tokens.

```solidity
event Wrapped(
    address indexed account,
    uint256 amount
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `account` | ✅ | User who wrapped |
| `amount` | ❌ | USDC amount wrapped |

**Note:** Wrap amount IS visible (it's the input before encryption).

---

### Unwrapped

Emitted when confidential tokens are unwrapped.

```solidity
event Unwrapped(
    address indexed account,
    uint256 amount
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `account` | ✅ | User who unwrapped |
| `amount` | ❌ | USDC amount received |

---

### ConfidentialTransfer

Emitted on encrypted token transfer.

```solidity
event ConfidentialTransfer(
    address indexed from,
    address indexed to
);
```

| Parameter | Indexed | Description |
|-----------|---------|-------------|
| `from` | ✅ | Sender |
| `to` | ✅ | Recipient |

**Note:** No amount — it's encrypted!

---

## RefundManager Events

### RefundRequested

Emitted when refund is requested.

```solidity
event RefundRequested(
    uint256 indexed refundId,
    uint256 indexed paymentId,
    address indexed requester
);
```

---

### RefundApproved

Emitted when refund is approved.

```solidity
event RefundApproved(
    uint256 indexed refundId
);
```

---

### RefundDeclined

Emitted when refund is declined.

```solidity
event RefundDeclined(
    uint256 indexed refundId
);
```

---

## Event Indexing Strategies

### Full Indexer

For complete history, index all events:

```typescript
const eventTypes = [
  'PaymentSent',
  'SubscriptionCreated',
  'SubscriptionExecuted',
  'Wrapped',
  'Unwrapped',
];

for (const eventName of eventTypes) {
  const logs = await client.getLogs({
    address: contractAddress,
    event: abiEvents[eventName],
    fromBlock: deploymentBlock,
    toBlock: 'latest',
  });
  
  for (const log of logs) {
    await database.insert({
      event: eventName,
      ...log.args,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    });
  }
}
```

### User-Specific

For one user's activity:

```typescript
async function getUserActivity(userAddress: string) {
  const [sent, received, subscriptions] = await Promise.all([
    // Payments sent
    client.getLogs({
      event: PaymentSentEvent,
      args: { from: userAddress },
    }),
    // Payments received
    client.getLogs({
      event: PaymentSentEvent,
      args: { to: userAddress },
    }),
    // Subscriptions
    client.getLogs({
      event: SubscriptionCreatedEvent,
      args: { payer: userAddress },
    }),
  ]);
  
  return { sent, received, subscriptions };
}
```

### Block Range Limits

Some RPC providers limit query size. Chunk your queries:

```typescript
const CHUNK_SIZE = 900n; // Stay under 1000 block limit

async function queryInChunks(fromBlock: bigint, toBlock: bigint) {
  const allLogs = [];
  
  for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
    const end = start + CHUNK_SIZE - 1n > toBlock 
      ? toBlock 
      : start + CHUNK_SIZE - 1n;
    
    const logs = await client.getLogs({
      fromBlock: start,
      toBlock: end,
      // ... other params
    });
    
    allLogs.push(...logs);
  }
  
  return allLogs;
}
```

---

## Building a Notification System

```typescript
// Watch for payments to your address
client.watchContractEvent({
  address: PAYMENT_GATEWAY,
  abi: gatewayAbi,
  eventName: 'PaymentSent',
  args: { to: MY_ADDRESS },
  onLogs: async (logs) => {
    for (const log of logs) {
      await sendNotification({
        title: 'Payment Received',
        body: `From ${truncateAddress(log.args.from)}`,
      });
    }
  },
});

// Watch for subscription executions
client.watchContractEvent({
  address: PAYMENT_GATEWAY,
  abi: gatewayAbi,
  eventName: 'SubscriptionExecuted',
  onLogs: async (logs) => {
    for (const log of logs) {
      const sub = await gateway.getSubscription(log.args.subscriptionId);
      if (sub.recipient === MY_ADDRESS) {
        await sendNotification({
          title: 'Subscription Payment',
          body: `Execution #${log.args.executionCount}`,
        });
      }
    }
  },
});
```
