// ============================================================
// Aruvi Contract Configuration
// Privacy-first payment gateway on Zama fhEVM (Sepolia)
// AUTO-GENERATED FROM DEPLOYMENT - DO NOT EDIT MANUALLY
// ============================================================

// Contract addresses for Sepolia (from deployments/sepolia/*.json)
export const CONTRACTS = {
  // AruviPaymentGateway - Main payment gateway
  ARUVI_GATEWAY: '0xf2Dd4FC2114e524E9B53d9F608e7484E1CD3271b' as const,
  // ConfidentialUSDCWrapper - ERC7984 confidential token wrapper
  WRAPPER: '0xf99376BE228E8212C3C9b8B746683C96C1517e8B' as const,
  // Circle test USDC on Sepolia
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const,
  // Zama Gateway for decryption - required operator for balance reveal
  ZAMA_GATEWAY: '0x096b4679d45fB675d4e2c1E4565009Cec99A12B1' as const,
} as const;

// Backwards compatibility
export const GATEWAY = CONTRACTS.ARUVI_GATEWAY;

// Chain configuration
export const CHAIN_ID = 11155111; // Sepolia

// Token configuration
export const TOKEN_CONFIG = {
  symbol: 'cUSDC',
  name: 'Confidential USDC',
  decimals: 6,
  underlyingSymbol: 'USDC',
  underlyingName: 'USD Coin',
};

// ============================================================
// ABIs - Extracted from deployed contracts
// ============================================================

// ABI for ERC20 (USDC)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ABI for ConfidentialUSDCWrapper (ERC7984) - From deployment
export const WRAPPER_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'confidentialBalanceOf',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'confidentialTotalSupply',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    name: 'confidentialTransfer',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    name: 'confidentialTransferFrom',
    outputs: [{ name: 'transferred', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'isOperator',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'until', type: 'uint48' },
    ],
    name: 'setOperator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'underlying',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    name: 'unwrap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'wrap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'amount', type: 'bytes32' },
    ],
    name: 'ConfidentialTransfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'holder', type: 'address' },
      { indexed: true, name: 'operator', type: 'address' },
      { indexed: false, name: 'until', type: 'uint48' },
    ],
    name: 'OperatorSet',
    type: 'event',
  },
] as const;

// ABI for AruviPaymentGateway - From deployment
export const ARUVI_GATEWAY_ABI = [
  // ============ SEND MONEY ============
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
    ],
    name: 'send',
    outputs: [{ name: 'paymentId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
    ],
    name: 'sendToken',
    outputs: [{ name: 'paymentId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'encryptedAmounts', type: 'bytes32[]' },
      { name: 'proofs', type: 'bytes[]' },
    ],
    name: 'multiSend',
    outputs: [{ name: 'paymentIds', type: 'bytes32[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ============ REQUEST MONEY ============
  {
    inputs: [
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
      { name: 'expiresIn', type: 'uint256' },
    ],
    name: 'createRequest',
    outputs: [{ name: 'requestId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
      { name: 'expiresIn', type: 'uint256' },
    ],
    name: 'createRequestToken',
    outputs: [{ name: 'requestId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'requestId', type: 'bytes32' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
    ],
    name: 'fulfillRequest',
    outputs: [{ name: 'paymentId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    name: 'cancelRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ============ SUBSCRIPTIONS ============
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
      { name: 'interval', type: 'uint256' },
    ],
    name: 'createSubscription',
    outputs: [{ name: 'subscriptionId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'subscriptionId', type: 'bytes32' }],
    name: 'executeSubscription',
    outputs: [{ name: 'paymentId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'subscriptionId', type: 'bytes32' }],
    name: 'cancelSubscription',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ============ REFUNDS ============
  {
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ============ VIEW FUNCTIONS ============
  {
    inputs: [],
    name: 'getMySentTotal',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMyReceivedTotal',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'paymentId', type: 'bytes32' }],
    name: 'getPaymentInfo',
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'isRefunded', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    name: 'getRequestInfo',
    outputs: [
      { name: 'requester', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'fulfilled', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'subscriptionId', type: 'bytes32' }],
    name: 'getSubscriptionInfo',
    outputs: [
      { name: 'subscriber', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'interval', type: 'uint256' },
      { name: 'nextPayment', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'paymentCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'requestCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'subscriptionCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'refunded',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'defaultToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ============ EVENTS ============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'paymentId', type: 'bytes32' },
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
    ],
    name: 'PaymentSent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'paymentId', type: 'bytes32' }],
    name: 'PaymentRefunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'bytes32' },
      { indexed: true, name: 'requester', type: 'address' },
    ],
    name: 'RequestCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'bytes32' },
      { indexed: true, name: 'paymentId', type: 'bytes32' },
    ],
    name: 'RequestFulfilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'requestId', type: 'bytes32' }],
    name: 'RequestCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subscriptionId', type: 'bytes32' },
      { indexed: true, name: 'subscriber', type: 'address' },
      { indexed: true, name: 'recipient', type: 'address' },
    ],
    name: 'SubscriptionCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subscriptionId', type: 'bytes32' },
      { indexed: true, name: 'paymentId', type: 'bytes32' },
    ],
    name: 'SubscriptionPaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'subscriptionId', type: 'bytes32' }],
    name: 'SubscriptionCancelled',
    type: 'event',
  },
] as const;

// Legacy alias for backwards compatibility
export const GATEWAY_ABI = ARUVI_GATEWAY_ABI;
