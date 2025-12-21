// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { IERC7984 } from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title AruviPaymentGateway - Privacy-First Payment Gateway
/// @dev Aruvi (அருவி) means "waterfall" in Tamil - privacy flows freely

contract AruviPaymentGateway is ZamaEthereumConfig {
    address public owner;
    address public defaultToken; // cUSDC wrapper
    
    // Overflow protection constant
    uint64 private constant MAX_SAFE_TOTAL = type(uint64).max - 1e12;
    
    // Payment storage
    
    struct Payment {
        address sender;
        address recipient;
        address token;
        euint64 amount;
        uint256 timestamp;
    }
    
    mapping(bytes32 => Payment) private payments;
    mapping(bytes32 => bool) public refunded;
    
    // Request storage
    
    struct PaymentRequest {
        address requester;
        address token;
        euint64 amount;
        uint256 createdAt;
        uint256 expiresAt;
        bool fulfilled;
        bytes32 paymentId;
    }
    
    mapping(bytes32 => PaymentRequest) private requests;
    
    // Subscription storage
    
    struct Subscription {
        address subscriber;
        address recipient;
        address token;
        euint64 amount;
        uint256 interval;
        uint256 nextPayment;
        uint256 createdAt;
        bool active;
    }
    
    mapping(bytes32 => Subscription) private subscriptions;
    
    // User totals (encrypted)
    
    mapping(address => euint64) private sentTotals;
    mapping(address => euint64) private receivedTotals;
    mapping(address => uint256) public paymentCount;
    mapping(address => uint256) public requestCount;
    mapping(address => uint256) public subscriptionCount;
    
    // Events
    
    event PaymentSent(bytes32 indexed paymentId, address indexed from, address indexed to);
    event PaymentRefunded(bytes32 indexed paymentId);
    event RequestCreated(bytes32 indexed requestId, address indexed requester);
    event RequestFulfilled(bytes32 indexed requestId, bytes32 indexed paymentId);
    event RequestCancelled(bytes32 indexed requestId);
    event SubscriptionCreated(bytes32 indexed subscriptionId, address indexed subscriber, address indexed recipient);
    event SubscriptionPaid(bytes32 indexed subscriptionId, bytes32 indexed paymentId);
    event SubscriptionCancelled(bytes32 indexed subscriptionId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _defaultToken) {
        require(_defaultToken != address(0), "Invalid token");
        owner = msg.sender;
        defaultToken = _defaultToken;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // Send payment
    
    /// @notice Send encrypted payment to anyone
    /// @param recipient Address to receive funds
    /// @param encryptedAmount FHE-encrypted amount
    /// @param proof Encryption proof
    /// @return paymentId Unique payment identifier
    function send(
        address recipient,
        externalEuint64 encryptedAmount,
        bytes calldata proof
    ) external returns (bytes32 paymentId) {
        return _send(msg.sender, recipient, defaultToken, encryptedAmount, proof);
    }
    
    /// @notice Send using specific confidential token
    function sendToken(
        address recipient,
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof
    ) external returns (bytes32 paymentId) {
        return _send(msg.sender, recipient, token, encryptedAmount, proof);
    }
    
    /// @notice Send to multiple recipients (split bill / multi-send)
    /// @dev All recipients get the same encrypted amount per transfer
    function multiSend(
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata proofs
    ) external returns (bytes32[] memory paymentIds) {
        require(recipients.length == encryptedAmounts.length, "Length mismatch");
        require(recipients.length == proofs.length, "Length mismatch");
        require(recipients.length > 0 && recipients.length <= 10, "1-10 recipients");
        
        paymentIds = new bytes32[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            paymentIds[i] = _send(msg.sender, recipients[i], defaultToken, encryptedAmounts[i], proofs[i]);
        }
    }
    
    function _send(
        address sender,
        address recipient,
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof
    ) internal returns (bytes32 paymentId) {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != sender, "Cannot send to self");
        require(token != address(0), "Invalid token");
        
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        
        FHE.allowThis(amount);
        FHE.allowTransient(amount, address(token));
        
        euint64 transferred = IERC7984(token).confidentialTransferFrom(
            sender, 
            recipient, 
            amount
        );
        FHE.allowThis(transferred);
        FHE.allowTransient(transferred, address(token));
        
        ebool hasTransferred = FHE.gt(transferred, FHE.asEuint64(0));
        
        // Generate payment ID
        paymentId = keccak256(abi.encodePacked(
            sender,
            recipient,
            block.timestamp,
            block.number,
            paymentCount[sender]++
        ));
        
        payments[paymentId] = Payment({
            sender: sender,
            recipient: recipient,
            token: token,
            amount: transferred,  // Actual amount, may be 0 on failure
            timestamp: block.timestamp
        });
        
        FHE.allow(transferred, sender);
        FHE.allow(transferred, recipient);
        
        euint64 zeroAmount = FHE.asEuint64(0);
        euint64 amountToAdd = FHE.select(hasTransferred, transferred, zeroAmount);
        _addToSentTotal(sender, amountToAdd);
        _addToReceivedTotal(recipient, amountToAdd);
        
        emit PaymentSent(paymentId, sender, recipient);
    }
    
    // Request money
    
    /// @notice Create a payment request (like PayPal's "Request Money")
    /// @param encryptedAmount Encrypted amount to request (use 0 for "any amount")
    /// @param proof Encryption proof
    /// @param expiresIn Seconds until expiry (0 = never expires)
    /// @return requestId Unique request identifier (can be shared as QR/link)
    function createRequest(
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        uint256 expiresIn
    ) external returns (bytes32 requestId) {
        return _createRequest(msg.sender, defaultToken, encryptedAmount, proof, expiresIn);
    }
    
    /// @notice Create request for specific token
    function createRequestToken(
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        uint256 expiresIn
    ) external returns (bytes32 requestId) {
        return _createRequest(msg.sender, token, encryptedAmount, proof, expiresIn);
    }
    
    function _createRequest(
        address requester,
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        uint256 expiresIn
    ) internal returns (bytes32 requestId) {
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        FHE.allowThis(amount);
        FHE.allow(amount, requester);
        
        requestId = keccak256(abi.encodePacked(
            requester,
            block.timestamp,
            block.number,
            requestCount[requester]++
        ));
        
        requests[requestId] = PaymentRequest({
            requester: requester,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            expiresAt: expiresIn > 0 ? block.timestamp + expiresIn : 0,
            fulfilled: false,
            paymentId: bytes32(0)
        });
        
        emit RequestCreated(requestId, requester);
    }
    
    /// @notice Fulfill a payment request (pay someone who requested money)
    /// @param requestId The request to fulfill
    /// @param encryptedAmount Amount to send (should match request if specified)
    /// @param proof Encryption proof
    function fulfillRequest(
        bytes32 requestId,
        externalEuint64 encryptedAmount,
        bytes calldata proof
    ) external returns (bytes32 paymentId) {
        PaymentRequest storage req = requests[requestId];
        require(req.createdAt > 0, "Request not found");
        require(!req.fulfilled, "Already fulfilled");
        require(req.expiresAt == 0 || block.timestamp <= req.expiresAt, "Request expired");
        
        // Send payment to requester
        paymentId = _send(msg.sender, req.requester, req.token, encryptedAmount, proof);
        
        req.fulfilled = true;
        req.paymentId = paymentId;
        
        emit RequestFulfilled(requestId, paymentId);
    }
    
    /// @notice Cancel your own request
    function cancelRequest(bytes32 requestId) external {
        PaymentRequest storage req = requests[requestId];
        require(req.requester == msg.sender, "Not your request");
        require(!req.fulfilled, "Already fulfilled");
        
        delete requests[requestId];
        emit RequestCancelled(requestId);
    }
    
    // Subscriptions
    
    /// @notice Create a subscription (recurring payment authorization)
    /// @param recipient Who will receive payments
    /// @param encryptedAmount Encrypted amount per payment
    /// @param proof Encryption proof
    /// @param interval Seconds between payments (e.g., 2592000 for ~30 days)
    /// @return subscriptionId Unique subscription identifier
    function createSubscription(
        address recipient,
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        uint256 interval
    ) external returns (bytes32 subscriptionId) {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot subscribe to self");
        require(interval >= 1 days, "Interval too short");
        
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allow(amount, recipient);
        
        subscriptionId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            block.timestamp,
            subscriptionCount[msg.sender]++
        ));
        
        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            recipient: recipient,
            token: defaultToken,
            amount: amount,
            interval: interval,
            nextPayment: block.timestamp, // Can pay immediately
            createdAt: block.timestamp,
            active: true
        });
        
        emit SubscriptionCreated(subscriptionId, msg.sender, recipient);
    }
    
    /// @notice Execute a subscription payment (can be called by subscriber or recipient)
    /// @dev Recipient can "pull" payment when due, or subscriber can "push"
    function executeSubscription(bytes32 subscriptionId) external returns (bytes32 paymentId) {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.active, "Subscription not active");
        require(block.timestamp >= sub.nextPayment, "Too early");
        require(msg.sender == sub.subscriber || msg.sender == sub.recipient, "Not authorized");
        
        FHE.allowTransient(sub.amount, sub.token);
        euint64 transferred = IERC7984(sub.token).confidentialTransferFrom(
            sub.subscriber, 
            sub.recipient, 
            sub.amount
        );
        FHE.allowThis(transferred);
        
        ebool hasTransferred = FHE.gt(transferred, FHE.asEuint64(0));
        
        // Generate payment ID
        paymentId = keccak256(abi.encodePacked(
            sub.subscriber,
            sub.recipient,
            block.timestamp,
            block.number
        ));
        

        payments[paymentId] = Payment({
            sender: sub.subscriber,
            recipient: sub.recipient,
            token: sub.token,
            amount: transferred,
            timestamp: block.timestamp
        });
        
        FHE.allow(transferred, sub.subscriber);
        FHE.allow(transferred, sub.recipient);
        
        euint64 zeroAmount = FHE.asEuint64(0);
        euint64 amountToAdd = FHE.select(hasTransferred, transferred, zeroAmount);
        _addToSentTotal(sub.subscriber, amountToAdd);
        _addToReceivedTotal(sub.recipient, amountToAdd);
        
        sub.nextPayment = block.timestamp + sub.interval;
        
        emit SubscriptionPaid(subscriptionId, paymentId);
    }
    
    /// @notice Cancel subscription (only subscriber can cancel)
    function cancelSubscription(bytes32 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber == msg.sender, "Not your subscription");
        require(sub.active, "Already cancelled");
        
        sub.active = false;
        emit SubscriptionCancelled(subscriptionId);
    }
    
    // Refunds
    
    /// @notice Refund a payment (only recipient can refund)
    /// @param paymentId The payment to refund
    function refund(bytes32 paymentId) external {
        Payment storage payment = payments[paymentId];
        require(payment.timestamp > 0, "Payment not found");
        require(!refunded[paymentId], "Already refunded");
        require(payment.recipient == msg.sender, "Not recipient");
        
        FHE.allowThis(payment.amount);
        FHE.allowTransient(payment.amount, payment.token);
        
        IERC7984(payment.token).confidentialTransferFrom(
            msg.sender, 
            payment.sender, 
            payment.amount
        );
        
        refunded[paymentId] = true;
        emit PaymentRefunded(paymentId);
    }
    
    // View functions
    
    /// @notice Get your encrypted sent total (only you can decrypt)
    function getMySentTotal() external view returns (euint64) {
        return sentTotals[msg.sender];
    }
    
    /// @notice Get your encrypted received total (only you can decrypt)
    function getMyReceivedTotal() external view returns (euint64) {
        return receivedTotals[msg.sender];
    }
    
    /// @notice Check if payment exists and get public info only
    function getPaymentInfo(bytes32 paymentId) external view returns (
        address sender,
        address recipient,
        address token,
        uint256 timestamp,
        bool isRefunded
    ) {
        Payment storage p = payments[paymentId];
        return (p.sender, p.recipient, p.token, p.timestamp, refunded[paymentId]);
    }
    
    /// @notice Get request info (public parts only)
    function getRequestInfo(bytes32 requestId) external view returns (
        address requester,
        address token,
        uint256 createdAt,
        uint256 expiresAt,
        bool fulfilled
    ) {
        PaymentRequest storage r = requests[requestId];
        return (r.requester, r.token, r.createdAt, r.expiresAt, r.fulfilled);
    }
    
    /// @notice Get subscription info (public parts only)
    function getSubscriptionInfo(bytes32 subscriptionId) external view returns (
        address subscriber,
        address recipient,
        uint256 interval,
        uint256 nextPayment,
        bool active
    ) {
        Subscription storage s = subscriptions[subscriptionId];
        return (s.subscriber, s.recipient, s.interval, s.nextPayment, s.active);
    }
    
    // Internal helpers
    
    /// @dev Add to sent total with overflow protection (OZ Security Guide #1)
    function _addToSentTotal(address user, euint64 delta) internal {
        euint64 current = sentTotals[user];
        euint64 newTotal;
        if (euint64.unwrap(current) == bytes32(0)) {
            newTotal = delta;
        } else {
            euint64 maxSafe = FHE.asEuint64(MAX_SAFE_TOTAL);
            ebool wouldOverflow = FHE.gt(current, FHE.sub(maxSafe, delta));
            euint64 uncappedTotal = FHE.add(current, delta);
            newTotal = FHE.select(wouldOverflow, maxSafe, uncappedTotal);
        }
        sentTotals[user] = newTotal;
        FHE.allowThis(newTotal);
        FHE.allow(newTotal, user);
    }
    
    function _addToReceivedTotal(address user, euint64 delta) internal {
        euint64 current = receivedTotals[user];
        euint64 newTotal;
        if (euint64.unwrap(current) == bytes32(0)) {
            newTotal = delta;
        } else {
            euint64 maxSafe = FHE.asEuint64(MAX_SAFE_TOTAL);
            ebool wouldOverflow = FHE.gt(current, FHE.sub(maxSafe, delta));
            euint64 uncappedTotal = FHE.add(current, delta);
            newTotal = FHE.select(wouldOverflow, maxSafe, uncappedTotal);
        }
        receivedTotals[user] = newTotal;
        FHE.allowThis(newTotal);
        FHE.allow(newTotal, user);
    }
    
    // Admin
    
    function setDefaultToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        defaultToken = _token;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
