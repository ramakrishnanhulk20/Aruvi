// ============================================================
// Aruvi Contract Configuration
// Privacy-first payment gateway on Zama fhEVM (Sepolia)
// ============================================================

// Contract addresses for Sepolia
export const CONTRACTS = {
  // Main payment gateway (privacy-first, security hardened)
  // TWO-STEP FHE PATTERN: Gateway calls FHE.fromExternal() directly
  // + Token ACL: FHE.allowTransient(amount, address(token))
  ARUVI_GATEWAY: '0x05798f2304A5B9263243C8002c87D4f59546958D' as const,
  // Confidential USDC wrapper (ERC7984)
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
// ABIs
// ============================================================

// ABI for ERC20 (USDC)
export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

// ABI for Confidential Wrapper (ERC7984)
export const WRAPPER_ABI = [
  // Read functions
  'function balanceOf(address) view returns (uint256)',
  'function confidentialBalanceOf(address) view returns (bytes32)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function isOperator(address owner, address operator) view returns (bool)',
  
  // Write functions
  'function wrap(address to, uint256 amount)',
  'function unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof)',
  'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)',
  'function confidentialTransferFrom(address from, address to, bytes32 encryptedAmount) returns (bytes32)',
  'function setOperator(address operator, uint48 until)',
] as const;

// ABI for AruviPaymentGateway (new privacy-first contract)
export const ARUVI_GATEWAY_ABI = [
  // ============ SEND MONEY ============
  'function send(address recipient, bytes32 encryptedAmount, bytes proof) returns (bytes32 paymentId)',
  'function sendToken(address recipient, address token, bytes32 encryptedAmount, bytes proof) returns (bytes32 paymentId)',
  'function multiSend(address[] recipients, bytes32[] encryptedAmounts, bytes[] proofs) returns (bytes32[] paymentIds)',
  
  // ============ REQUEST MONEY ============
  'function createRequest(bytes32 encryptedAmount, bytes proof, uint256 expiresIn) returns (bytes32 requestId)',
  'function createRequestToken(address token, bytes32 encryptedAmount, bytes proof, uint256 expiresIn) returns (bytes32 requestId)',
  'function fulfillRequest(bytes32 requestId, bytes32 encryptedAmount, bytes proof) returns (bytes32 paymentId)',
  'function cancelRequest(bytes32 requestId)',
  
  // ============ SUBSCRIPTIONS ============
  'function createSubscription(address recipient, bytes32 encryptedAmount, bytes proof, uint256 interval) returns (bytes32 subscriptionId)',
  'function executeSubscription(bytes32 subscriptionId) returns (bytes32 paymentId)',
  'function cancelSubscription(bytes32 subscriptionId)',
  
  // ============ REFUNDS ============
  'function refund(bytes32 paymentId)',
  
  // ============ VIEW FUNCTIONS ============
  'function getMySentTotal() view returns (bytes32)',
  'function getMyReceivedTotal() view returns (bytes32)',
  'function getPaymentInfo(bytes32 paymentId) view returns (address sender, address recipient, address token, uint256 timestamp, bool isRefunded)',
  'function getRequestInfo(bytes32 requestId) view returns (address requester, address token, uint256 createdAt, uint256 expiresAt, bool fulfilled)',
  'function getSubscriptionInfo(bytes32 subscriptionId) view returns (address subscriber, address recipient, uint256 interval, uint256 nextPayment, bool active)',
  'function paymentCount(address) view returns (uint256)',
  'function requestCount(address) view returns (uint256)',
  'function subscriptionCount(address) view returns (uint256)',
  'function refunded(bytes32) view returns (bool)',
  'function defaultToken() view returns (address)',
  'function owner() view returns (address)',
  
  // ============ EVENTS ============
  'event PaymentSent(bytes32 indexed paymentId, address indexed from, address indexed to)',
  'event PaymentRefunded(bytes32 indexed paymentId)',
  'event RequestCreated(bytes32 indexed requestId, address indexed requester)',
  'event RequestFulfilled(bytes32 indexed requestId, bytes32 indexed paymentId)',
  'event RequestCancelled(bytes32 indexed requestId)',
  'event SubscriptionCreated(bytes32 indexed subscriptionId, address indexed subscriber, address indexed recipient)',
  'event SubscriptionPaid(bytes32 indexed subscriptionId, bytes32 indexed paymentId)',
  'event SubscriptionCancelled(bytes32 indexed subscriptionId)',
] as const;

// Legacy alias for backwards compatibility
export const GATEWAY_ABI = ARUVI_GATEWAY_ABI;
