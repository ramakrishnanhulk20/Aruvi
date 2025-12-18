// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ProductRegistry - Registry for merchant products with confidential pricing
/// @notice Merchants can register products with public or encrypted prices
contract ProductRegistry is ZamaEthereumConfig {
    address public owner;
    address public gateway;
    
    enum ProductType {
        PRODUCT,        // One-time purchase with price verification
        SUBSCRIPTION,   // Recurring payment with price verification
        DONATION,       // Any amount accepted, no verification
        P2P            // Person-to-person, user decrypt
    }
    
    enum PricingMode {
        PUBLIC,    // Price stored as plaintext (most common)
        ENCRYPTED  // Price stored as euint64 (private pricing strategy)
    }
    
    struct Product {
        address merchant;
        string name;
        string description;
        ProductType productType;
        PricingMode pricingMode;
        uint256 publicPrice;      // Used if pricingMode == PUBLIC
        euint64 encryptedPrice;   // Used if pricingMode == ENCRYPTED
        bool active;
        uint256 createdAt;
    }
    
    // merchant => productId => Product
    mapping(address => mapping(uint256 => Product)) public products;
    mapping(address => uint256) public productCounts;
    
    event ProductRegistered(
        address indexed merchant,
        uint256 indexed productId,
        string name,
        ProductType productType,
        PricingMode pricingMode
    );
    
    event ProductUpdated(
        address indexed merchant,
        uint256 indexed productId
    );
    
    event ProductDeactivated(
        address indexed merchant,
        uint256 indexed productId
    );
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GatewayUpdated(address indexed newGateway);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyMerchant(uint256 productId) {
        require(products[msg.sender][productId].merchant == msg.sender, "Not your product");
        _;
    }
    
    modifier onlyGateway() {
        require(msg.sender == gateway, "Not gateway");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    function setGateway(address _gateway) external onlyOwner {
        require(_gateway != address(0), "Invalid gateway");
        gateway = _gateway;
        emit GatewayUpdated(_gateway);
    }
    
    /// @notice Register a product with public pricing
    function registerProduct(
        string calldata name,
        string calldata description,
        ProductType productType,
        uint256 price
    ) external returns (uint256 productId) {
        productId = productCounts[msg.sender]++;
        
        products[msg.sender][productId] = Product({
            merchant: msg.sender,
            name: name,
            description: description,
            productType: productType,
            pricingMode: PricingMode.PUBLIC,
            publicPrice: price,
            encryptedPrice: FHE.asEuint64(uint64(0)), // Not used
            active: true,
            createdAt: block.timestamp
        });
        
        emit ProductRegistered(msg.sender, productId, name, productType, PricingMode.PUBLIC);
    }
    
    /// @notice Batch register multiple products in one transaction (saves gas)
    function registerProductsBatch(
        string[] calldata names,
        string[] calldata descriptions,
        ProductType[] calldata productTypes,
        uint256[] calldata prices
    ) external returns (uint256[] memory productIds) {
        require(names.length == descriptions.length, "Length mismatch");
        require(names.length == productTypes.length, "Length mismatch");
        require(names.length == prices.length, "Length mismatch");
        require(names.length > 0, "Empty batch");
        
        productIds = new uint256[](names.length);
        
        for (uint256 i = 0; i < names.length; i++) {
            uint256 productId = productCounts[msg.sender]++;
            
            products[msg.sender][productId] = Product({
                merchant: msg.sender,
                name: names[i],
                description: descriptions[i],
                productType: productTypes[i],
                pricingMode: PricingMode.PUBLIC,
                publicPrice: prices[i],
                encryptedPrice: FHE.asEuint64(uint64(0)),
                active: true,
                createdAt: block.timestamp
            });
            
            productIds[i] = productId;
            emit ProductRegistered(msg.sender, productId, names[i], productTypes[i], PricingMode.PUBLIC);
        }
    }
    
    /// @notice Register a product with encrypted pricing (private strategy)
    function registerProductEncrypted(
        string calldata name,
        string calldata description,
        ProductType productType,
        externalEuint64 encryptedPrice,
        bytes calldata proof
    ) external returns (uint256 productId) {
        productId = productCounts[msg.sender]++;
        
        euint64 price = FHE.fromExternal(encryptedPrice, proof);
        FHE.allowThis(price);
        FHE.allow(price, msg.sender);
        FHE.allow(price, gateway);
        
        products[msg.sender][productId] = Product({
            merchant: msg.sender,
            name: name,
            description: description,
            productType: productType,
            pricingMode: PricingMode.ENCRYPTED,
            publicPrice: 0, // Not used
            encryptedPrice: price,
            active: true,
            createdAt: block.timestamp
        });
        
        emit ProductRegistered(msg.sender, productId, name, productType, PricingMode.ENCRYPTED);
    }
    
    /// @notice Update product details (not price)
    function updateProduct(
        uint256 productId,
        string calldata name,
        string calldata description,
        bool active
    ) external onlyMerchant(productId) {
        Product storage product = products[msg.sender][productId];
        product.name = name;
        product.description = description;
        product.active = active;
        
        emit ProductUpdated(msg.sender, productId);
    }
    
    /// @notice Update public price
    function updatePrice(uint256 productId, uint256 newPrice) external onlyMerchant(productId) {
        Product storage product = products[msg.sender][productId];
        require(product.pricingMode == PricingMode.PUBLIC, "Not public pricing");
        product.publicPrice = newPrice;
        
        emit ProductUpdated(msg.sender, productId);
    }
    
    /// @notice Update encrypted price
    function updatePriceEncrypted(
        uint256 productId,
        externalEuint64 newPrice,
        bytes calldata proof
    ) external onlyMerchant(productId) {
        Product storage product = products[msg.sender][productId];
        require(product.pricingMode == PricingMode.ENCRYPTED, "Not encrypted pricing");
        
        euint64 price = FHE.fromExternal(newPrice, proof);
        FHE.allowThis(price);
        FHE.allow(price, msg.sender);
        FHE.allow(price, gateway);
        
        product.encryptedPrice = price;
        
        emit ProductUpdated(msg.sender, productId);
    }
    
    /// @notice Deactivate a product
    function deactivateProduct(uint256 productId) external onlyMerchant(productId) {
        products[msg.sender][productId].active = false;
        emit ProductDeactivated(msg.sender, productId);
    }
    
    /// @notice Get product details (gateway can read encrypted prices)
    function getProduct(address merchant, uint256 productId) 
        external 
        view 
        returns (
            string memory name,
            string memory description,
            ProductType productType,
            PricingMode pricingMode,
            uint256 publicPrice,
            bool active
        ) 
    {
        Product storage product = products[merchant][productId];
        return (
            product.name,
            product.description,
            product.productType,
            product.pricingMode,
            product.publicPrice,
            product.active
        );
    }
    
    /// @notice Get encrypted price (only for gateway to verify payments)
    function getEncryptedPrice(address merchant, uint256 productId) 
        external 
        view 
        onlyGateway 
        returns (euint64) 
    {
        return products[merchant][productId].encryptedPrice;
    }
    
    /// @notice Get public price as euint64 for FHE comparison
    function getPublicPriceAsEuint64(address merchant, uint256 productId) 
        external 
        onlyGateway 
        returns (euint64) 
    {
        Product storage product = products[merchant][productId];
        require(product.pricingMode == PricingMode.PUBLIC, "Not public pricing");
        require(product.publicPrice <= type(uint64).max, "Price too large");
        return FHE.asEuint64(uint64(product.publicPrice));
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
