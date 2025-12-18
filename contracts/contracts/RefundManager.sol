// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IPaymentGateway {
    function merchants(address account) external view returns (bool);
    function processRefund(bytes32 paymentId, address customer, address merchant) external;
}

/// @title RefundManager - queues and triggers refunds for Aruvi merchants
/// @notice Merchants queue refunds and later trigger them; PaymentGateway enforces ACL and encrypted amounts.
contract RefundManager is ZamaEthereumConfig {
    IPaymentGateway public immutable gateway;
    address public owner;

    struct RefundRequest {
        address merchant;
        bytes32 paymentId;
        address customer;
        uint256 createdAt;
        bool processed;
    }

    mapping(bytes32 => RefundRequest) public requests;

    event RefundQueued(bytes32 indexed requestId, bytes32 indexed paymentId, address indexed merchant, address customer);
    event RefundProcessed(bytes32 indexed requestId, bytes32 indexed paymentId, address indexed merchant, address customer);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address gatewayAddress) {
        require(gatewayAddress != address(0), "Invalid gateway");
        gateway = IPaymentGateway(gatewayAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice Merchant queues a refund for a prior payment.
    function queueRefund(bytes32 paymentId, address customer) external returns (bytes32 requestId) {
        require(gateway.merchants(msg.sender), "Not registered merchant");
        require(customer != address(0), "Invalid customer");

        requestId = keccak256(abi.encodePacked(paymentId, customer, msg.sender, block.timestamp, block.number));
        RefundRequest storage req = requests[requestId];
        require(req.createdAt == 0, "Already queued");

        requests[requestId] = RefundRequest({
            merchant: msg.sender,
            paymentId: paymentId,
            customer: customer,
            createdAt: block.timestamp,
            processed: false
        });

        emit RefundQueued(requestId, paymentId, msg.sender, customer);
    }

    /// @notice Merchant triggers a queued refund; PaymentGateway handles encrypted amount and ACL.
    function processQueuedRefund(bytes32 requestId) external {
        RefundRequest storage req = requests[requestId];
        require(req.createdAt != 0, "Unknown request");
        require(!req.processed, "Already processed");
        require(req.merchant == msg.sender, "Not your request");

        gateway.processRefund(req.paymentId, req.customer, req.merchant);
        req.processed = true;

        emit RefundProcessed(requestId, req.paymentId, req.merchant, req.customer);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
