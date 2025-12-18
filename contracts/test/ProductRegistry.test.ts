import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ProductRegistry", () => {
  let registry: any;
  let gateway: any;
  let owner: any;
  let merchant: any;
  let customer: any;

  beforeEach(async () => {
    [owner, merchant, customer] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ProductRegistry");
    registry = await Registry.deploy();

    const Gateway = await ethers.getContractFactory("PaymentGateway");
    gateway = await Gateway.deploy();
    
    await registry.setGateway(await gateway.getAddress());
  });

  describe("Deployment", () => {
    it("Should set owner correctly", async () => {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should set gateway correctly", async () => {
      expect(await registry.gateway()).to.equal(await gateway.getAddress());
    });
  });

  describe("Public Product Registration", () => {
    it("Should register product with public pricing", async () => {
      const tx = await registry.connect(merchant).registerProduct(
        "Coffee",
        "Premium coffee",
        0, // ProductType.PRODUCT
        5_00n // $5.00
      );

      await expect(tx)
        .to.emit(registry, "ProductRegistered")
        .withArgs(merchant.address, 0, "Coffee", 0, 0); // PricingMode.PUBLIC = 0

      const product = await registry.products(merchant.address, 0);
      expect(product.name).to.equal("Coffee");
      expect(product.publicPrice).to.equal(5_00n);
      expect(product.active).to.be.true;
    });

    it("Should increment product count", async () => {
      await registry.connect(merchant).registerProduct("Item 1", "Desc 1", 0, 10_00n);
      await registry.connect(merchant).registerProduct("Item 2", "Desc 2", 0, 20_00n);

      expect(await registry.productCounts(merchant.address)).to.equal(2);
    });

    it("Should allow multiple merchants to register products", async () => {
      await registry.connect(merchant).registerProduct("Merchant A Product", "", 0, 10_00n);
      await registry.connect(customer).registerProduct("Merchant B Product", "", 0, 15_00n);

      expect(await registry.productCounts(merchant.address)).to.equal(1);
      expect(await registry.productCounts(customer.address)).to.equal(1);
    });

    it("Should register different product types", async () => {
      // PRODUCT = 0
      await registry.connect(merchant).registerProduct("One-time", "", 0, 10_00n);
      
      // SUBSCRIPTION = 1  
      await registry.connect(merchant).registerProduct("Monthly", "", 1, 50_00n);
      
      // DONATION = 2
      await registry.connect(merchant).registerProduct("Donate", "", 2, 0n);

      const product0 = await registry.products(merchant.address, 0);
      const product1 = await registry.products(merchant.address, 1);
      const product2 = await registry.products(merchant.address, 2);

      expect(product0.productType).to.equal(0);
      expect(product1.productType).to.equal(1);
      expect(product2.productType).to.equal(2);
    });
  });

  describe("Encrypted Product Registration", () => {
    it("Should register product with encrypted pricing", async () => {
      const registryAddress = await registry.getAddress();
      
      // Encrypt price
      const input = await fhevm.createEncryptedInput(registryAddress, merchant.address);
      input.add64(25_00n); // $25.00
      const { handles, inputProof } = await input.encrypt();

      const tx = await registry.connect(merchant).registerProductEncrypted(
        "Secret Product",
        "Price is confidential",
        0, // ProductType.PRODUCT
        handles[0],
        inputProof
      );

      await expect(tx)
        .to.emit(registry, "ProductRegistered")
        .withArgs(merchant.address, 0, "Secret Product", 0, 1); // PricingMode.ENCRYPTED = 1

      const product = await registry.products(merchant.address, 0);
      expect(product.pricingMode).to.equal(1); // ENCRYPTED
      expect(product.publicPrice).to.equal(0n);
    });

    it("Should allow merchant to decrypt their encrypted price", async () => {
      const registryAddress = await registry.getAddress();
      
      const input = await fhevm.createEncryptedInput(registryAddress, merchant.address);
      input.add64(99_99n);
      const { handles, inputProof } = await input.encrypt();

      await registry.connect(merchant).registerProductEncrypted(
        "VIP Product",
        "",
        0,
        handles[0],
        inputProof
      );

      const product = await registry.products(merchant.address, 0);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        product.encryptedPrice,
        registryAddress,
        merchant
      );

      expect(decrypted).to.equal(99_99n);
    });
  });

  describe("Product Updates", () => {
    beforeEach(async () => {
      await registry.connect(merchant).registerProduct("Original", "Desc", 0, 10_00n);
    });

    it("Should update product price", async () => {
      await registry.connect(merchant).updatePrice(0, 15_00n);

      const product = await registry.products(merchant.address, 0);
      expect(product.publicPrice).to.equal(15_00n);
    });

    it("Should emit ProductUpdated event", async () => {
      await expect(registry.connect(merchant).updatePrice(0, 20_00n))
        .to.emit(registry, "ProductUpdated")
        .withArgs(merchant.address, 0);
    });

    it("Should only allow merchant to update their own products", async () => {
      await expect(
        registry.connect(customer).updatePrice(0, 20_00n)
      ).to.be.revertedWith("Not your product");
    });

    it("Should allow updating name and description", async () => {
      await registry.connect(merchant).updateProduct(
        0,
        "New Name",
        "New Description",
        true
      );

      const product = await registry.products(merchant.address, 0);
      expect(product.name).to.equal("New Name");
      expect(product.description).to.equal("New Description");
    });
  });

  describe("Product Deactivation", () => {
    beforeEach(async () => {
      await registry.connect(merchant).registerProduct("Active Product", "", 0, 10_00n);
    });

    it("Should deactivate product", async () => {
      await registry.connect(merchant).deactivateProduct(0);

      const product = await registry.products(merchant.address, 0);
      expect(product.active).to.be.false;
    });

    it("Should emit ProductDeactivated event", async () => {
      await expect(registry.connect(merchant).deactivateProduct(0))
        .to.emit(registry, "ProductDeactivated")
        .withArgs(merchant.address, 0);
    });

    it("Should only allow merchant to deactivate their products", async () => {
      await expect(
        registry.connect(customer).deactivateProduct(0)
      ).to.be.revertedWith("Not your product");
    });

    it("Should allow deactivating products", async () => {
      await registry.connect(merchant).deactivateProduct(0);

      const [,,,,,active] = await registry.getProduct(merchant.address, 0);
      expect(active).to.be.false;
    });
  });

  describe("Product Queries", () => {
    beforeEach(async () => {
      await registry.connect(merchant).registerProduct("Product 1", "Desc 1", 0, 10_00n);
      await registry.connect(merchant).registerProduct("Product 2", "Desc 2", 1, 50_00n);
      await registry.connect(customer).registerProduct("Other Product", "Desc", 0, 25_00n);
    });

    it("Should get product by merchant and ID", async () => {
      const [name, description, productType, pricingMode, publicPrice, active] = await registry.getProduct(merchant.address, 0);
      
      expect(name).to.equal("Product 1");
      expect(description).to.equal("Desc 1");
      expect(publicPrice).to.equal(10_00n);
    });

    it("Should get all products for merchant", async () => {
      const count = await registry.productCounts(merchant.address);
      expect(count).to.equal(2);

      const product0 = await registry.products(merchant.address, 0);
      const product1 = await registry.products(merchant.address, 1);

      expect(product0.name).to.equal("Product 1");
      expect(product1.name).to.equal("Product 2");
    });

    it("Should return correct product type", async () => {
      const product0 = await registry.getProduct(merchant.address, 0);
      const product1 = await registry.getProduct(merchant.address, 1);

      expect(product0.productType).to.equal(0); // PRODUCT
      expect(product1.productType).to.equal(1); // SUBSCRIPTION
    });
  });

  describe("Payment Verification (Gateway Integration)", () => {
    let token: any;
    let wrapper: any;

    beforeEach(async () => {
      // Deploy mock USDC and wrapper
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      token = await MockUSDC.deploy();

      const Wrapper = await ethers.getContractFactory("ConfidentialUSDCWrapper");
      wrapper = await Wrapper.deploy(
        await token.getAddress(),
        "cUSDC",
        "cUSDC",
        ""
      );

      // Register product with price
      await registry.connect(merchant).registerProduct("Test Product", "", 0, 50_00n);

      // Setup customer with wrapped tokens
      await token.mint(customer.address, 100_00n);
      await token.connect(customer).approve(await wrapper.getAddress(), 100_00n);
      await wrapper.connect(customer).wrap(customer.address, 100_00n);
    });

    it.skip("Should verify payment amount matches product price", async () => {
      const registryAddress = await registry.getAddress();
      
      // Encrypt correct price
      const input = await fhevm.createEncryptedInput(registryAddress, customer.address);
      input.add64(50_00n);
      const { handles, inputProof } = await input.encrypt();

      const result = await registry.connect(gateway.address).verifyPaymentAmount(
        merchant.address,
        0,
        handles[0],
        inputProof
      );

      // Should succeed (returns encrypted boolean)
      expect(result).to.not.be.reverted;
    });

    it.skip("Should reject incorrect payment amount", async () => {
      const registryAddress = await registry.getAddress();
      
      // Encrypt wrong price
      const input = await fhevm.createEncryptedInput(registryAddress, customer.address);
      input.add64(40_00n); // Less than required 50_00
      const { handles, inputProof } = await input.encrypt();

      // FHE returns encrypted false, doesn't revert
      const result = await registry.connect(gateway.address).verifyPaymentAmount(
        merchant.address,
        0,
        handles[0],
        inputProof
      );

      expect(result).to.not.be.reverted;
    });

    it.skip("Should accept any amount for DONATION products", async () => {
      await registry.connect(merchant).registerProduct("Donation", "", 2, 0n); // ProductType.DONATION

      const registryAddress = await registry.getAddress();
      
      // Any amount should work
      const input = await fhevm.createEncryptedInput(registryAddress, customer.address);
      input.add64(123n);
      const { handles, inputProof } = await input.encrypt();

      const result = await registry.connect(gateway.address).verifyPaymentAmount(
        merchant.address,
        1, // Donation product
        handles[0],
        inputProof
      );

      expect(result).to.not.be.reverted;
    });

    it.skip("Should only allow gateway to verify payments", async () => {
      const registryAddress = await registry.getAddress();
      
      const input = await fhevm.createEncryptedInput(registryAddress, customer.address);
      input.add64(50_00n);
      const { handles, inputProof } = await input.encrypt();

      await expect(
        registry.connect(customer).verifyPaymentAmount(
          merchant.address,
          0,
          handles[0],
          inputProof
        )
      ).to.be.revertedWith("Not gateway");
    });
  });

  describe("Ownership", () => {
    it("Should transfer ownership", async () => {
      await registry.transferOwnership(merchant.address);
      expect(await registry.owner()).to.equal(merchant.address);
    });

    it("Should emit OwnershipTransferred event", async () => {
      await expect(registry.transferOwnership(merchant.address))
        .to.emit(registry, "OwnershipTransferred")
        .withArgs(owner.address, merchant.address);
    });

    it("Should only allow owner to transfer ownership", async () => {
      await expect(
        registry.connect(merchant).transferOwnership(merchant.address)
      ).to.be.revertedWith("Not owner");
    });

    it("Should reject zero address", async () => {
      await expect(
        registry.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid owner");
    });
  });

  describe("Gateway Management", () => {
    it("Should update gateway address", async () => {
      const newGateway = customer.address;
      await registry.setGateway(newGateway);
      
      expect(await registry.gateway()).to.equal(newGateway);
    });

    it("Should emit GatewayUpdated event", async () => {
      await expect(registry.setGateway(customer.address))
        .to.emit(registry, "GatewayUpdated")
        .withArgs(customer.address);
    });

    it("Should only allow owner to update gateway", async () => {
      await expect(
        registry.connect(merchant).setGateway(merchant.address)
      ).to.be.revertedWith("Not owner");
    });

    it("Should reject zero address gateway", async () => {
      await expect(
        registry.setGateway(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid gateway");
    });
  });
});

