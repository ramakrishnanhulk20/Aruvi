import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("PaymentGateway - Advanced Features", () => {
  let token: any;
  let gateway: any;
  let registry: any;
  let owner: any;
  let merchant1: any;
  let merchant2: any;
  let customer: any;

  const PAYMENT_AMOUNT = 10_000n;

  async function encryptAmount(contractAddress: string, sender: string, amount: bigint) {
    const input = await fhevm.createEncryptedInput(contractAddress, sender);
    input.add64(amount);
    return input.encrypt();
  }

  async function decryptBalance(token: any, account: string, signer: any) {
    const handle = await token.confidentialBalanceOf(account);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, await token.getAddress(), signer);
  }

  beforeEach(async () => {
    [owner, merchant1, merchant2, customer] = await ethers.getSigners();

    const MockERC7984 = await ethers.getContractFactory("MockERC7984");
    token = await MockERC7984.deploy("cUSDC", "cUSDC");

    const Gateway = await ethers.getContractFactory("PaymentGateway");
    gateway = await Gateway.deploy();

    const Registry = await ethers.getContractFactory("ProductRegistry");
    registry = await Registry.deploy();

    await gateway.registerMerchant(merchant1.address);
    await gateway.setProductRegistry(await registry.getAddress());
    await registry.setGateway(await gateway.getAddress());

    // Mint tokens to customer
    const mintEnc = await encryptAmount(await token.getAddress(), owner.address, PAYMENT_AMOUNT * 5n);
    await token.mint(customer.address, mintEnc.handles[0], mintEnc.inputProof);
  });

  describe("Merchant Management", () => {
    it("Should remove merchant", async () => {
      await gateway.removeMerchant(merchant1.address);
      expect(await gateway.merchants(merchant1.address)).to.be.false;
    });

    it("Should emit MerchantRemoved event", async () => {
      await expect(gateway.removeMerchant(merchant1.address))
        .to.emit(gateway, "MerchantRemoved")
        .withArgs(merchant1.address);
    });

    it("Should only allow owner to remove merchants", async () => {
      await expect(
        gateway.connect(merchant1).removeMerchant(merchant1.address)
      ).to.be.revertedWith("Not owner");
    });

    it("Should reject payments after merchant removed", async () => {
      await gateway.removeMerchant(merchant1.address);

      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      
      await expect(
        gateway.connect(customer).processPayment(
          merchant1.address,
          await token.getAddress(),
          payEnc.handles[0],
          payEnc.inputProof,
          "test",
          0,
          0
        )
      ).to.be.revertedWith("Not registered merchant");
    });

    it("Should allow re-registering removed merchant", async () => {
      await gateway.removeMerchant(merchant1.address);
      await gateway.registerMerchant(merchant1.address);
      
      expect(await gateway.merchants(merchant1.address)).to.be.true;
    });
  });

  describe("Merchant Totals and Analytics", () => {
    beforeEach(async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);
    });

    it("Should track merchant total revenue", async () => {
      // Process 2 payments
      for (let i = 0; i < 2; i++) {
        const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
        await gateway.connect(customer).processPayment(
          merchant1.address,
          await token.getAddress(),
          payEnc.handles[0],
          payEnc.inputProof,
          "test",
          0,
          0
        );
      }

      const totalHandle = await gateway.getMerchantTotal(merchant1.address);
      const total = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        totalHandle,
        await gateway.getAddress(),
        merchant1
      );

      expect(total).to.equal(PAYMENT_AMOUNT * 2n);
    });

    it("Should track monthly totals separately", async () => {
      const latest = await ethers.provider.getBlock("latest");
      const bucket = Math.floor(latest!.timestamp / 2_592_000);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      await gateway.connect(customer).processPayment(
        merchant1.address,
        await token.getAddress(),
        payEnc.handles[0],
        payEnc.inputProof,
        "test",
        0,
        0
      );

      const monthHandle = await gateway.getMerchantMonthlyTotal(merchant1.address, bucket);
      const monthTotal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        monthHandle,
        await gateway.getAddress(),
        merchant1
      );

      expect(monthTotal).to.equal(PAYMENT_AMOUNT);
    });

    it("Should track refund totals", async () => {
      // Make payment
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      const tx = await gateway.connect(customer).processPayment(
        merchant1.address,
        await token.getAddress(),
        payEnc.handles[0],
        payEnc.inputProof,
        "refund-test",
        0,
        0
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return gateway.interface.parseLog(log)?.name === "PaymentProcessed";
        } catch {
          return false;
        }
      });
      const paymentId = gateway.interface.parseLog(event!)?.args[0];

      // Authorize gateway for refund
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(merchant1).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      // Process refund
      await gateway.connect(merchant1).processRefund(paymentId, customer.address, merchant1.address);

      // Check refund total
      const refundHandle = await gateway.getMerchantRefundTotal(merchant1.address);
      const refundTotal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        refundHandle,
        await gateway.getAddress(),
        merchant1
      );

      expect(refundTotal).to.equal(PAYMENT_AMOUNT);
    });

    it("Should separate totals between merchants", async () => {
      await gateway.registerMerchant(merchant2.address);

      // Merchant1 receives 2 payments
      for (let i = 0; i < 2; i++) {
        const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
        await gateway.connect(customer).processPayment(
          merchant1.address,
          await token.getAddress(),
          payEnc.handles[0],
          payEnc.inputProof,
          "test",
          0,
          0
        );
      }

      // Merchant2 receives 1 payment
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      await gateway.connect(customer).processPayment(
        merchant2.address,
        await token.getAddress(),
        payEnc.handles[0],
        payEnc.inputProof,
        "test",
        0,
        0
      );

      const total1Handle = await gateway.getMerchantTotal(merchant1.address);
      const total1 = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        total1Handle,
        await gateway.getAddress(),
        merchant1
      );

      const total2Handle = await gateway.getMerchantTotal(merchant2.address);
      const total2 = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        total2Handle,
        await gateway.getAddress(),
        merchant2
      );

      expect(total1).to.equal(PAYMENT_AMOUNT * 2n);
      expect(total2).to.equal(PAYMENT_AMOUNT);
    });
  });

  describe("Public Total Disclosure", () => {
    beforeEach(async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      // Make payment
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      await gateway.connect(customer).processPayment(
        merchant1.address,
        await token.getAddress(),
        payEnc.handles[0],
        payEnc.inputProof,
        "test",
        0,
        0
      );
    });

    it("Should allow merchant to make total public", async () => {
      await expect(gateway.connect(merchant1).makeMerchantTotalPublic())
        .to.not.be.reverted;
    });

    it("Should allow merchant to make monthly total public", async () => {
      const latest = await ethers.provider.getBlock("latest");
      const bucket = Math.floor(latest!.timestamp / 2_592_000);

      await expect(gateway.connect(merchant1).makeMerchantMonthlyTotalPublic(bucket))
        .to.not.be.reverted;
    });

    it("Should only allow merchant to make their own totals public", async () => {
      await expect(
        gateway.connect(merchant2).makeMerchantTotalPublic()
      ).to.be.revertedWith("Not registered merchant");
    });
  });

  describe("Product Registry Integration", () => {
    let productId: number;

    beforeEach(async () => {
      // Merchant registers product
      await registry.connect(merchant1).registerProduct(
        "Test Product",
        "Product description",
        0, // ProductType.PRODUCT
        PAYMENT_AMOUNT
      );
      productId = 0;
    });

    it.skip("Should process payment with product verification", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      
      // Payment with correct amount for product should succeed
      await expect(
        gateway.connect(customer).processPaymentWithProduct(
          merchant1.address,
          await token.getAddress(),
          productId,
          payEnc.handles[0],
          payEnc.inputProof
        )
      ).to.not.be.reverted;
    });

    it.skip("Should reject payment with wrong amount for product", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const wrongAmount = PAYMENT_AMOUNT - 100n;
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, wrongAmount);
      
      // Should fail verification (FHE returns encrypted false)
      await expect(
        gateway.connect(customer).processPaymentWithProduct(
          merchant1.address,
          await token.getAddress(),
          productId,
          payEnc.handles[0],
          payEnc.inputProof
        )
      ).to.be.revertedWith("Payment amount mismatch");
    });

    it.skip("Should accept any amount for donation products", async () => {
      await registry.connect(merchant1).registerProduct(
        "Donation",
        "",
        2, // ProductType.DONATION
        0n
      );
      const donationId = 1;

      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const customAmount = 123n;
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, customAmount);
      
      await expect(
        gateway.connect(customer).processPaymentWithProduct(
          merchant1.address,
          await token.getAddress(),
          donationId,
          payEnc.handles[0],
          payEnc.inputProof
        )
      ).to.not.be.reverted;

      const merchantBalance = await decryptBalance(token, merchant1.address, merchant1);
      expect(merchantBalance).to.equal(customAmount + PAYMENT_AMOUNT); // Previous + donation
    });
  });

  describe("Payment History and Queries", () => {
    let paymentId1: string;
    let paymentId2: string;

    beforeEach(async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      // Make 2 payments
      const payEnc1 = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      const tx1 = await gateway.connect(customer).processPayment(
        merchant1.address,
        await token.getAddress(),
        payEnc1.handles[0],
        payEnc1.inputProof,
        "test1",
        0,
        0
      );

      const receipt1 = await tx1.wait();
      const event1 = receipt1?.logs.find((log: any) => {
        try {
          return gateway.interface.parseLog(log)?.name === "PaymentProcessed";
        } catch {
          return false;
        }
      });
      paymentId1 = gateway.interface.parseLog(event1!)?.args[0];

      const payEnc2 = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      const tx2 = await gateway.connect(customer).processPayment(
        merchant1.address,
        await token.getAddress(),
        payEnc2.handles[0],
        payEnc2.inputProof,
        "test2",
        0,
        0
      );

      const receipt2 = await tx2.wait();
      const event2 = receipt2?.logs.find((log: any) => {
        try {
          return gateway.interface.parseLog(log)?.name === "PaymentProcessed";
        } catch {
          return false;
        }
      });
      paymentId2 = gateway.interface.parseLog(event2!)?.args[0];
    });

    it("Should get payment details by ID", async () => {
      const payment = await gateway.getPayment(paymentId1);
      
      expect(payment.merchant).to.equal(merchant1.address);
      expect(payment.token).to.equal(await token.getAddress());
      expect(payment.isRefunded).to.be.false;
    });

    it("Should track multiple payments independently", async () => {
      const payment1 = await gateway.getPayment(paymentId1);
      const payment2 = await gateway.getPayment(paymentId2);

      expect(payment1.merchant).to.equal(merchant1.address);
      expect(payment2.merchant).to.equal(merchant1.address);
      expect(payment1.timestamp).to.not.equal(payment2.timestamp);
    });

    it("Should update payment status after refund", async () => {
      // Authorize merchant for refund
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(merchant1).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      await gateway.connect(merchant1).processRefund(paymentId1, customer.address, merchant1.address);

      const payment = await gateway.getPayment(paymentId1);
      expect(payment.isRefunded).to.be.true;
    });
  });

  describe("Nonce Management (Meta-transactions)", () => {
    it("Should increment nonce after meta-transaction", async () => {
      const initialNonce = await gateway.nonces(customer.address);

      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);

      const domain = {
        name: "PaymentGateway",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await gateway.getAddress(),
      };

      const types = {
        Payment: [
          { name: "payer", type: "address" },
          { name: "merchant", type: "address" },
          { name: "token", type: "address" },
          { name: "amountHash", type: "bytes32" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const deadline = latest!.timestamp + 3600;
      const amountHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [payEnc.handles[0]]));

      const value = {
        payer: customer.address,
        merchant: merchant1.address,
        token: await token.getAddress(),
        amountHash,
        nonce: initialNonce,
        deadline,
      };

      const signature = await customer.signTypedData(domain, types, value);

      await gateway.connect(customer).processPaymentFor(customer.address, merchant1.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, deadline, signature
      , "test", 0, 0);

      const newNonce = await gateway.nonces(customer.address);
      expect(newNonce).to.equal(initialNonce + 1n);
    });

    it("Should reject replay of same nonce", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT / 2n);
      const nonce = await gateway.nonces(customer.address);

      const domain = {
        name: "PaymentGateway",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await gateway.getAddress(),
      };

      const types = {
        Payment: [
          { name: "payer", type: "address" },
          { name: "merchant", type: "address" },
          { name: "token", type: "address" },
          { name: "amountHash", type: "bytes32" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const deadline = latest!.timestamp + 3600;
      const amountHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [payEnc.handles[0]]));

      const value = {
        payer: customer.address,
        merchant: merchant1.address,
        token: await token.getAddress(),
        amountHash,
        nonce,
        deadline,
      };

      const signature = await customer.signTypedData(domain, types, value);

      // First payment succeeds
      await gateway.connect(customer).processPaymentFor(customer.address, merchant1.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, deadline, signature
      , "test", 0, 0);

      // Second payment with same nonce should fail
      await expect(
        gateway.connect(customer).processPaymentFor(customer.address, merchant1.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, deadline, signature
        , "test", 0, 0)
      ).to.be.revertedWith("Bad signature");
    });
  });
});


