// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { IERC7984 } from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

enum PaymentType {
    P2P,           // Person-to-person, no verification
    PRODUCT,       // Product purchase, amount verified
    SUBSCRIPTION,  // Subscription, amount verified
    DONATION       // Donation, any amount accepted
}

contract PaymentGateway is ZamaEthereumConfig {
    address public owner;
    address public productRegistry;
    mapping(address => bool) public merchants;
    mapping(address => bool) public refundManagers;
    mapping(bytes32 => Payment) public payments;
    mapping(bytes32 => bool) public refunded;
    mapping(address => uint256) public nonces;
    mapping(address => euint64) public merchantTotals;
    mapping(address => euint64) public merchantRefundTotals;
    mapping(address => mapping(uint256 => euint64)) public merchantMonthlyTotals;
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 private constant PAYMENT_TYPEHASH = keccak256("Payment(address payer,address merchant,address token,bytes32 amountHash,uint256 nonce,uint256 deadline)");
    
    struct Payment {
        address merchant;
        address token;
        euint64 amount;
        uint256 timestamp;
        string orderId;
        PaymentType paymentType;
        uint256 productId;
    }
    
    event MerchantRegistered(address indexed merchant);
    event MerchantRemoved(address indexed merchant);
    event PaymentProcessed(bytes32 indexed paymentId, address indexed merchant, string orderId, PaymentType paymentType);
    event RefundProcessed(bytes32 indexed paymentId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RefundManagerUpdated(address indexed refundManager, bool enabled);
    event ProductRegistryUpdated(address indexed productRegistry);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyMerchant() {
        require(merchants[msg.sender], "Not registered merchant");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("PaymentGateway")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function _monthBucket(uint256 timestamp) internal pure returns (uint256) {
        // Approximate month bucket using 30-day windows (2592000 seconds)
        return timestamp / 2592000;
    }

    function _accumulateTotals(address merchant, euint64 delta) internal {
        // Overall lifetime total
        euint64 total = merchantTotals[merchant];
        if (euint64.unwrap(total) == bytes32(0)) {
            total = delta;
        } else {
            total = FHE.add(total, delta);
        }
        merchantTotals[merchant] = total;
        FHE.allowThis(total);
        FHE.allow(total, merchant);

        // Monthly bucket
        uint256 bucket = _monthBucket(block.timestamp);
        euint64 monthTotal = merchantMonthlyTotals[merchant][bucket];
        if (euint64.unwrap(monthTotal) == bytes32(0)) {
            monthTotal = delta;
        } else {
            monthTotal = FHE.add(monthTotal, delta);
        }
        merchantMonthlyTotals[merchant][bucket] = monthTotal;
        FHE.allowThis(monthTotal);
        FHE.allow(monthTotal, merchant);
    }

    function _accumulateRefunds(address merchant, euint64 delta) internal {
        euint64 refundTotal = merchantRefundTotals[merchant];
        if (euint64.unwrap(refundTotal) == bytes32(0)) {
            refundTotal = delta;
        } else {
            refundTotal = FHE.add(refundTotal, delta);
        }
        merchantRefundTotals[merchant] = refundTotal;
        FHE.allowThis(refundTotal);
        FHE.allow(refundTotal, merchant);
    }
    
    function registerMerchant(address merchant) external onlyOwner {
        require(merchant != address(0), "Invalid merchant");
        require(!merchants[merchant], "Already registered");
        merchants[merchant] = true;
        emit MerchantRegistered(merchant);
    }

    function setRefundManager(address refundManager, bool enabled) external onlyOwner {
        require(refundManager != address(0), "Invalid refund manager");
        refundManagers[refundManager] = enabled;
        emit RefundManagerUpdated(refundManager, enabled);
    }

    function setProductRegistry(address _productRegistry) external onlyOwner {
        require(_productRegistry != address(0), "Invalid product registry");
        productRegistry = _productRegistry;
        emit ProductRegistryUpdated(_productRegistry);
    }
    
    function removeMerchant(address merchant) external onlyOwner {
        require(merchants[merchant], "Not registered");
        merchants[merchant] = false;
        emit MerchantRemoved(merchant);
    }
    
    function _processPayment(
        address payer,
        address merchant,
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        string calldata orderId,
        PaymentType paymentType,
        uint256 productId
    ) internal returns (bytes32 paymentId) {
        // ERC7984: payer grants operator rights to this gateway via token.setOperator(gateway, until).
        euint64 amount = FHE.fromExternal(encryptedAmount, proof);
        FHE.allowThis(amount);
        FHE.allow(amount, token);

        // Verify amount for PRODUCT and SUBSCRIPTION types using FHE.select
        euint64 transferAmount = amount;
        if (paymentType == PaymentType.PRODUCT || paymentType == PaymentType.SUBSCRIPTION) {
            require(productRegistry != address(0), "Product registry not set");
            
            // Get product price from registry and verify
            (bool success, bytes memory data) = productRegistry.call(
                abi.encodeWithSignature("getPublicPriceAsEuint64(address,uint256)", merchant, productId)
            );
            
            if (success) {
                // Public pricing - compare encrypted payment with encrypted product price
                euint64 productPrice = abi.decode(data, (euint64));
                ebool isCorrectAmount = FHE.eq(amount, productPrice);
                // If amounts match, transfer amount; otherwise transfer 0 (payment fails)
                transferAmount = FHE.select(isCorrectAmount, amount, FHE.asEuint64(uint64(0)));
            } else {
                // Try encrypted pricing
                (success, data) = productRegistry.call(
                    abi.encodeWithSignature("getEncryptedPrice(address,uint256)", merchant, productId)
                );
                require(success, "Product not found");
                euint64 productPrice = abi.decode(data, (euint64));
                ebool isCorrectAmount = FHE.eq(amount, productPrice);
                // If amounts match, transfer amount; otherwise transfer 0 (payment fails)
                transferAmount = FHE.select(isCorrectAmount, amount, FHE.asEuint64(uint64(0)));
            }
            FHE.allowThis(transferAmount);
            FHE.allow(transferAmount, token);
        }
        // P2P and DONATION types use full amount without verification

        euint64 transferred = IERC7984(token).confidentialTransferFrom(payer, merchant, transferAmount);
        FHE.allowThis(transferred);

        paymentId = keccak256(abi.encodePacked(
            merchant,
            token,
            block.timestamp,
            block.number,
            payer
        ));

        payments[paymentId] = Payment({
            merchant: merchant,
            token: token,
            amount: transferred,
            timestamp: block.timestamp,
            orderId: orderId,
            paymentType: paymentType,
            productId: productId
        });

        FHE.allow(transferred, merchant);
        _accumulateTotals(merchant, transferred);

        emit PaymentProcessed(paymentId, merchant, orderId, paymentType);
    }

    function processPayment(
        address merchant,
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        string calldata orderId,
        PaymentType paymentType,
        uint256 productId
    ) external returns (bytes32 paymentId) {
        require(merchants[merchant], "Not registered merchant");
        require(merchant != address(0), "Invalid merchant");
        require(token != address(0), "Invalid token");

        return _processPayment(msg.sender, merchant, token, encryptedAmount, proof, orderId, paymentType, productId);
    }

    function processPaymentFor(
        address payer,
        address merchant,
        address token,
        externalEuint64 encryptedAmount,
        bytes calldata proof,
        uint256 deadline,
        bytes calldata signature,
        string calldata orderId,
        PaymentType paymentType,
        uint256 productId
    ) external returns (bytes32 paymentId) {
        require(merchants[merchant], "Not registered merchant");
        require(merchant != address(0), "Invalid merchant");
        require(token != address(0), "Invalid token");
        require(payer != address(0), "Invalid payer");
        require(block.timestamp <= deadline, "Expired");

        // Verify signature
        {
            uint256 nonce = nonces[payer]++;
            bytes32 structHash = keccak256(
                abi.encode(
                    PAYMENT_TYPEHASH,
                    payer,
                    merchant,
                    token,
                    keccak256(abi.encode(encryptedAmount)),
                    nonce,
                    deadline
                )
            );
            bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
            require(ECDSA.recover(digest, signature) == payer, "Bad signature");
        }

        return _processPayment(payer, merchant, token, encryptedAmount, proof, orderId, paymentType, productId);
    }
    
    function processRefund(
        bytes32 paymentId,
        address customer,
        address merchant
    ) external {
        Payment storage payment = payments[paymentId];
        require(payment.merchant == merchant, "Invalid merchant");
        require(!refunded[paymentId], "Already refunded");
        require(payment.timestamp > 0, "Payment does not exist");
        // Allow either the merchant directly OR an explicitly authorized refund manager.
        // DO NOT allow any registered merchant to refund other merchants.
        require(msg.sender == merchant || refundManagers[msg.sender], "Not authorized");
        
        // ERC7984: Merchant must grant operator rights to this gateway via token.setOperator(gateway, until).
        FHE.allow(payment.amount, payment.token); // token contract will consume the ciphertext
        FHE.allowThis(payment.amount); // ensure gateway remains allowed to use the ciphertext
        FHE.allow(payment.amount, customer);

        IERC7984(payment.token).confidentialTransferFrom(merchant, customer, payment.amount);
        
        // Accumulate refund total
        _accumulateRefunds(merchant, payment.amount);
        
        refunded[paymentId] = true;
        emit RefundProcessed(paymentId);
    }
    
    function getPayment(bytes32 paymentId) external view returns (
        address merchant,
        address token,
        uint256 timestamp,
        bool isRefunded,
        string memory orderId,
        PaymentType paymentType,
        uint256 productId
    ) {
        Payment storage payment = payments[paymentId];
        return (
            payment.merchant,
            payment.token,
            payment.timestamp,
            refunded[paymentId],
            payment.orderId,
            payment.paymentType,
            payment.productId
        );
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // --- Aggregates / selective disclosure ---

    function getMerchantTotal(address merchant) external view returns (euint64) {
        return merchantTotals[merchant];
    }

    function getMerchantRefundTotal(address merchant) external view returns (euint64) {
        return merchantRefundTotals[merchant];
    }

    function getMerchantMonthlyTotal(address merchant, uint256 bucket) external view returns (euint64) {
        return merchantMonthlyTotals[merchant][bucket];
    }

    function makeMerchantTotalPublic() external onlyMerchant {
        euint64 total = merchantTotals[msg.sender];
        require(euint64.unwrap(total) != bytes32(0), "No total");
        FHE.makePubliclyDecryptable(total);
    }

    function makeMerchantRefundTotalPublic() external onlyMerchant {
        euint64 refundTotal = merchantRefundTotals[msg.sender];
        require(euint64.unwrap(refundTotal) != bytes32(0), "No refund total");
        FHE.makePubliclyDecryptable(refundTotal);
    }

    function makeMerchantMonthlyTotalPublic(uint256 bucket) external onlyMerchant {
        euint64 total = merchantMonthlyTotals[msg.sender][bucket];
        require(euint64.unwrap(total) != bytes32(0), "No total");
        FHE.makePubliclyDecryptable(total);
    }
}
