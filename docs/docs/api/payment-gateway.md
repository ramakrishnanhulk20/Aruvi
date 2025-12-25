---
sidebar_position: 1
title: PaymentGateway
---

# AruviPaymentGateway API

The main contract for all payment operations.

**Address (Sepolia):** `0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b`

## Write Functions

### send

Send an encrypted payment to a recipient.

```solidity
function send(
    address recipient,
    externalEuint64 encryptedAmount,
    bytes calldata proof
) external returns (bytes32 paymentId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `recipient` | `address` | Recipient wallet address |
| `encryptedAmount` | `bytes32` | FHE-encrypted amount (externalEuint64) |
| `proof` | `bytes` | Encryption proof from fhevmjs |

**Returns:** `bytes32` — Unique payment ID

**Emits:** `PaymentSent(paymentId, from, to)`

**Example:**
```typescript
const { handles, inputProof } = await encryptAmount(100_000000n);
const tx = await gateway.send(recipient, handles[0], inputProof);
```

---

### createRequest

Create a payment request (payment link).

```solidity
function createRequest(
    externalEuint64 encryptedAmount,
    bytes calldata proof,
    uint256 expiresIn
) external returns (bytes32 requestId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `encryptedAmount` | `bytes32` | Requested amount (encrypted) |
| `proof` | `bytes` | Encryption proof |
| `expiresIn` | `uint256` | Seconds until expiry (0 = never) |

**Returns:** `bytes32` — Unique request ID

**Emits:** `RequestCreated(requestId, requester)`

---

### fulfillRequest

Pay a pending payment request.

```solidity
function fulfillRequest(
    bytes32 requestId,
    externalEuint64 encryptedAmount,
    bytes calldata proof
) external returns (bytes32 paymentId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | `bytes32` | Request to fulfill |
| `encryptedAmount` | `bytes32` | Payment amount (encrypted) |
| `proof` | `bytes` | Encryption proof |

**Emits:** `RequestFulfilled(requestId, paymentId)`

**Reverts if:**
- Request doesn't exist
- Request already fulfilled
- Request expired
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
    bytes32 subscriptionId
) external
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `subscriptionId` | `bytes32` | Subscription to cancel |

**Emits:** `SubscriptionCancelled(subscriptionId)`

**Reverts if:**
- Subscription doesn't exist
- Caller isn't the subscriber
- Already cancelled

---

## Read Functions

### getPaymentInfo

Get payment details (public info only - amount is encrypted).

```solidity
function getPaymentInfo(
    bytes32 paymentId
) external view returns (
    address sender,
    address recipient,
    address token,
    uint256 timestamp,
    bool isRefunded
)
```

**Returns:**
- `sender`: Address that sent the payment
- `recipient`: Address that received the payment
- `token`: Token contract address (cUSDC wrapper)
- `timestamp`: When the payment was made
- `isRefunded`: Whether the payment was refunded

---

### getRequestInfo

Get request details (public info only).

```solidity
function getRequestInfo(
    bytes32 requestId
) external view returns (
    address requester,
    address token,
    uint256 createdAt,
    uint256 expiresAt,
    bool fulfilled
)
```

**Returns:**
- `requester`: Address that created the request
- `token`: Token contract address
- `createdAt`: When the request was created
- `expiresAt`: When the request expires (0 = never)
- `fulfilled`: Whether the request has been paid

---

### getSubscriptionInfo

Get subscription details (public info only).

```solidity
function getSubscriptionInfo(
    bytes32 subscriptionId
) external view returns (
    address subscriber,
    address recipient,
    uint256 interval,
    uint256 nextPayment,
    bool active
)
```

**Returns:**
- `subscriber`: Address paying the subscription
- `recipient`: Address receiving payments
- `interval`: Seconds between payments
- `nextPayment`: Timestamp of next due payment
- `active`: Whether the subscription is still active
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
