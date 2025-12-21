---
sidebar_position: 1
title: PaymentGateway
---

# PaymentGateway API

The main contract for all payment operations.

**Address (Sepolia):** `0x05798f2304A5B9263243C8002c87D4f59546958D`

## Write Functions

### sendConfidential

Send an encrypted payment to a recipient.

```solidity
function sendConfidential(
    address to,
    einput encryptedAmount,
    bytes calldata inputProof
) external returns (uint256 paymentId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `to` | `address` | Recipient wallet address |
| `encryptedAmount` | `einput` | FHE-encrypted amount |
| `inputProof` | `bytes` | Proof of encryption validity |

**Returns:** `uint256` — Unique payment ID

**Emits:** `PaymentSent(paymentId, from, to)`

**Example:**
```typescript
const { handles, inputProof } = await encryptAmount(100_000000n);
const tx = await gateway.sendConfidential(recipient, handles[0], inputProof);
```

---

### createPaymentRequest

Request payment from another address.

```solidity
function createPaymentRequest(
    address from,
    einput encryptedAmount,
    bytes calldata inputProof,
    bytes32 memo
) external returns (uint256 requestId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | Who should pay |
| `encryptedAmount` | `einput` | Requested amount (encrypted) |
| `inputProof` | `bytes` | Encryption proof |
| `memo` | `bytes32` | Optional reference/note |

**Returns:** `uint256` — Unique request ID

**Emits:** `PaymentRequestCreated(requestId, from, to)`

---

### fulfillPaymentRequest

Pay a pending payment request.

```solidity
function fulfillPaymentRequest(
    uint256 requestId
) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | `uint256` | Request to fulfill |

**Emits:** `PaymentRequestFulfilled(requestId)`

**Reverts if:**
- Request doesn't exist
- Request already fulfilled
- Caller isn't the requested payer
- Insufficient balance

---

### cancelPaymentRequest

Cancel a request you created.

```solidity
function cancelPaymentRequest(
    uint256 requestId
) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | `uint256` | Request to cancel |

**Emits:** `PaymentRequestCancelled(requestId)`

**Reverts if:**
- Request doesn't exist
- Caller isn't the requester
- Request already fulfilled

---

### createSubscription

Set up recurring encrypted payments.

```solidity
function createSubscription(
    address recipient,
    einput encryptedAmount,
    bytes calldata inputProof,
    uint256 interval
) external returns (uint256 subscriptionId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `recipient` | `address` | Payment recipient |
| `encryptedAmount` | `einput` | Amount per period |
| `inputProof` | `bytes` | Encryption proof |
| `interval` | `uint256` | Seconds between payments |

**Returns:** `uint256` — Unique subscription ID

**Emits:** `SubscriptionCreated(subscriptionId, payer, recipient, interval)`

**Common intervals:**
- Daily: `86400`
- Weekly: `604800`
- Monthly: `2592000` (30 days)

---

### executeSubscription

Execute a due subscription payment.

```solidity
function executeSubscription(
    uint256 subscriptionId
) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `subscriptionId` | `uint256` | Subscription to execute |

**Emits:** `SubscriptionExecuted(subscriptionId, executionCount)`

**Reverts if:**
- Subscription doesn't exist
- Interval hasn't passed since last execution
- Subscription is cancelled
- Payer has insufficient balance

**Note:** Anyone can call this function once the interval has passed.

---

### cancelSubscription

Cancel an active subscription.

```solidity
function cancelSubscription(
    uint256 subscriptionId
) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `subscriptionId` | `uint256` | Subscription to cancel |

**Emits:** `SubscriptionCancelled(subscriptionId)`

**Reverts if:**
- Subscription doesn't exist
- Caller isn't the payer
- Already cancelled

---

## Read Functions

### getPayment

Get payment details.

```solidity
function getPayment(
    uint256 paymentId
) external view returns (Payment memory)
```

**Returns:**
```solidity
struct Payment {
    address from;
    address to;
    euint64 encryptedAmount;
    uint256 timestamp;
    PaymentStatus status;
}
```

---

### getPaymentRequest

Get request details.

```solidity
function getPaymentRequest(
    uint256 requestId
) external view returns (PaymentRequest memory)
```

**Returns:**
```solidity
struct PaymentRequest {
    address requester;
    address payer;
    euint64 encryptedAmount;
    bytes32 memo;
    uint256 timestamp;
    RequestStatus status;
}
```

---

### getSubscription

Get subscription details.

```solidity
function getSubscription(
    uint256 subscriptionId
) external view returns (Subscription memory)
```

**Returns:**
```solidity
struct Subscription {
    address payer;
    address recipient;
    euint64 encryptedAmount;
    uint256 interval;
    uint256 lastExecution;
    uint256 executionCount;
    bool isActive;
}
```

---

### getUserPayments

Get all payments for a user.

```solidity
function getUserPayments(
    address user
) external view returns (uint256[] memory paymentIds)
```

---

### getUserSubscriptions

Get all subscriptions for a user.

```solidity
function getUserSubscriptions(
    address user
) external view returns (uint256[] memory subscriptionIds)
```

---

## Events

### PaymentSent

```solidity
event PaymentSent(
    uint256 indexed paymentId,
    address indexed from,
    address indexed to
);
```

### PaymentRequestCreated

```solidity
event PaymentRequestCreated(
    uint256 indexed requestId,
    address indexed from,
    address indexed to
);
```

### PaymentRequestFulfilled

```solidity
event PaymentRequestFulfilled(
    uint256 indexed requestId
);
```

### PaymentRequestCancelled

```solidity
event PaymentRequestCancelled(
    uint256 indexed requestId
);
```

### SubscriptionCreated

```solidity
event SubscriptionCreated(
    uint256 indexed subscriptionId,
    address indexed payer,
    address indexed recipient,
    uint256 interval
);
```

### SubscriptionExecuted

```solidity
event SubscriptionExecuted(
    uint256 indexed subscriptionId,
    uint256 executionCount
);
```

### SubscriptionCancelled

```solidity
event SubscriptionCancelled(
    uint256 indexed subscriptionId
);
```

## Enums

### PaymentStatus

```solidity
enum PaymentStatus {
    Completed,
    RefundRequested,
    Refunded
}
```

### RequestStatus

```solidity
enum RequestStatus {
    Pending,
    Fulfilled,
    Cancelled,
    Expired
}
```

## Error Codes

| Error | Description |
|-------|-------------|
| `InsufficientBalance()` | Sender doesn't have enough funds |
| `InvalidRecipient()` | Zero address or invalid recipient |
| `UnauthorizedCaller()` | Caller not permitted for this action |
| `RequestNotFound()` | Payment request doesn't exist |
| `SubscriptionNotFound()` | Subscription doesn't exist |
| `IntervalNotPassed()` | Too early to execute subscription |
| `AlreadyCancelled()` | Subscription already cancelled |
