import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import {
  PaymentGateway,
  PaymentGateway__factory,
  MockERC7984,
  MockERC7984__factory,
} from "../types";

const PAYMENT_AMOUNT = 10_000n; // $100.00 in cents

async function encryptAmount(contractAddress: string, sender: string, amount: bigint) {
  const input = await fhevm.createEncryptedInput(contractAddress, sender);
  input.add64(amount);
  return input.encrypt();
}

async function decryptBalance(token: MockERC7984, account: string, signer: any) {
  const handle = await token.confidentialBalanceOf(account);
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, await token.getAddress(), signer);
}

describe("PaymentGateway", () => {
  let token: MockERC7984;
  let gateway: PaymentGateway;
  let owner: any;
  let merchant: any;
  let customer: any;
  let unauthorized: any;

  beforeEach(async () => {
    [owner, merchant, customer, unauthorized] = await ethers.getSigners();

    token = await new MockERC7984__factory(owner).deploy("ConfUSDC", "cUSDC");
    gateway = await new PaymentGateway__factory(owner).deploy();

    await gateway.registerMerchant(merchant.address);

    // Owner mints to customer
    const mintEnc = await encryptAmount(await token.getAddress(), owner.address, PAYMENT_AMOUNT * 2n);
    await token.mint(customer.address, mintEnc.handles[0], mintEnc.inputProof);
  });

  describe("Merchant Registration", () => {
    it("should register a new merchant", async () => {
      const newMerchant = unauthorized.address;
      await gateway.registerMerchant(newMerchant);
      expect(await gateway.merchants(newMerchant)).to.be.true;
    });

    it("should emit MerchantRegistered event", async () => {
      const newMerchant = unauthorized.address;
      await expect(gateway.registerMerchant(newMerchant))
        .to.emit(gateway, "MerchantRegistered")
        .withArgs(newMerchant);
    });

    it("should only allow owner to register merchants", async () => {
      await expect(
        gateway.connect(unauthorized).registerMerchant(unauthorized.address)
      ).to.be.revertedWith("Not owner");
    });

    it("should allow registering multiple merchants", async () => {
      await gateway.registerMerchant(unauthorized.address);
      expect(await gateway.merchants(unauthorized.address)).to.be.true;
    });

    it("should prevent registering the same merchant twice", async () => {
      await expect(
        gateway.registerMerchant(merchant.address)
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("Payment Processing", () => {
    it("should process a payment successfully", async () => {
      // Customer authorizes gateway as operator
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      // Customer pays merchant
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      const payTx = await gateway
        .connect(customer)
        .processPayment(
          merchant.address,
          await token.getAddress(),
          payEnc.handles[0],
          payEnc.inputProof,
          "test",
          0,
          0
        );

      await expect(payTx).to.emit(gateway, "PaymentProcessed");
    });

    it("should transfer tokens from customer to merchant", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      await gateway
        .connect(customer)
        .processPayment(merchant.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, "test", 0, 0);

      const merchantBalance = await decryptBalance(token, merchant.address, merchant);
      expect(merchantBalance).to.equal(PAYMENT_AMOUNT);
    });

    it("should store payment record correctly", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      const payTx = await gateway
        .connect(customer)
        .processPayment(merchant.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, "test", 0, 0);

      const receipt = await payTx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return gateway.interface.parseLog(log)?.name === "PaymentProcessed";
        } catch {
          return false;
        }
      });
      const paymentId = gateway.interface.parseLog(event!)?.args[0];

      const payment = await gateway.getPayment(paymentId);
      expect(payment.merchant).to.equal(merchant.address);
      expect(payment.token).to.equal(await token.getAddress());
      expect(payment.isRefunded).to.be.false;
    });

    it("should reject payment to unregistered merchant", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      await expect(
        gateway
          .connect(customer)
          .processPayment(
            unauthorized.address,
            await token.getAddress(),
            payEnc.handles[0],
            payEnc.inputProof,
            "test",
            0,
            0
          )
      ).to.be.revertedWith("Not registered merchant");
    });

    it("should handle multiple payments to same merchant", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);
      for (let i = 0; i < 2; i++) {
        const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT / 2n);
        await gateway
          .connect(customer)
          .processPayment(merchant.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, "test", 0, 0);
      }

      const merchantBalance = await decryptBalance(token, merchant.address, merchant);
      expect(merchantBalance).to.equal(PAYMENT_AMOUNT);
    });
  });

  describe("Meta-transaction payments & totals", () => {
    it("processPaymentFor accepts signed meta payload and updates encrypted totals", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      // Encrypt amount bound to gateway and customer
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);

      // Prepare EIP-712 signature
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
      const nonce = await gateway.nonces(customer.address);
      const amountHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [payEnc.handles[0]]));
      const value = {
        payer: customer.address,
        merchant: merchant.address,
        token: await token.getAddress(),
        amountHash,
        nonce,
        deadline,
      };

      const signature = await customer.signTypedData(domain, types, value);

      // Submit via payer (mock FHE verifier binds sender); still exercises signature + nonce path
      const tx = await gateway
        .connect(customer)
        .processPaymentFor(customer.address, merchant.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, deadline, signature, "test", 0, 0);
      await tx.wait();

      // Merchant balance updated
      const merchantBalance = await decryptBalance(token, merchant.address, merchant);
      expect(merchantBalance).to.equal(PAYMENT_AMOUNT);

      // Totals updated (lifetime + monthly bucket) and decryptable by merchant
      const totalHandle = await gateway.getMerchantTotal(merchant.address);
      const totalClear = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        totalHandle,
        await gateway.getAddress(),
        merchant,
      );
      expect(totalClear).to.equal(PAYMENT_AMOUNT);

      const bucket = Math.floor(latest!.timestamp / 2_592_000);
      const monthHandle = await gateway.getMerchantMonthlyTotal(merchant.address, bucket);
      const monthClear = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        monthHandle,
        await gateway.getAddress(),
        merchant,
      );
      expect(monthClear).to.equal(PAYMENT_AMOUNT);
    });

    it("merchant can make aggregates public without reverting", async () => {
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);
      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      await gateway.connect(customer).processPayment(merchant.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, "test", 0, 0);

      await expect(gateway.connect(merchant).makeMerchantTotalPublic()).to.not.be.reverted;
      const bucket = Math.floor(latest!.timestamp / 2_592_000);
      await expect(gateway.connect(merchant).makeMerchantMonthlyTotalPublic(bucket)).to.not.be.reverted;
    });
  });

  describe("Refund Processing", () => {
    let paymentId: string;

    beforeEach(async () => {
      // Setup: Customer pays merchant
      const latest = await ethers.provider.getBlock("latest");
      await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

      const payEnc = await encryptAmount(await gateway.getAddress(), customer.address, PAYMENT_AMOUNT);
      const payTx = await gateway
        .connect(customer)
        .processPayment(merchant.address, await token.getAddress(), payEnc.handles[0], payEnc.inputProof, "test", 0, 0);

      const receipt = await payTx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return gateway.interface.parseLog(log)?.name === "PaymentProcessed";
        } catch {
          return false;
        }
      });
      paymentId = gateway.interface.parseLog(event!)?.args[0];

      // Merchant authorizes gateway as operator to pull funds back
      await token.connect(merchant).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);
    });

    it("should process refund by merchant", async () => {
      await expect(
        gateway.connect(merchant).processRefund(paymentId, customer.address, merchant.address)
      ).to.emit(gateway, "RefundProcessed").withArgs(paymentId);
    });

    it("should transfer tokens back to customer", async () => {
      await gateway.connect(merchant).processRefund(paymentId, customer.address, merchant.address);

      const customerBalance = await decryptBalance(token, customer.address, customer);
      expect(customerBalance).to.equal(PAYMENT_AMOUNT * 2n); // Initial 2x minus payment plus refund
    });

    it("should mark payment as refunded", async () => {
      await gateway.connect(merchant).processRefund(paymentId, customer.address, merchant.address);

      const payment = await gateway.getPayment(paymentId);
      expect(payment.isRefunded).to.be.true;
    });

    it("should reject refund by non-merchant", async () => {
      await expect(
        gateway.connect(customer).processRefund(paymentId, customer.address, merchant.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should reject refund with wrong merchant", async () => {
      await expect(
        gateway.connect(merchant).processRefund(paymentId, customer.address, unauthorized.address)
      ).to.be.revertedWith("Invalid merchant");
    });

    it("should reject double refund", async () => {
      await gateway.connect(merchant).processRefund(paymentId, customer.address, merchant.address);

      await expect(
        gateway.connect(merchant).processRefund(paymentId, customer.address, merchant.address)
      ).to.be.revertedWith("Already refunded");
    });

    it("should reject refund for non-existent payment", async () => {
      const fakePaymentId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        gateway.connect(merchant).processRefund(fakePaymentId, customer.address, merchant.address)
      ).to.be.reverted; // Will fail on Invalid merchant check first
    });
  });

  describe("Ownership", () => {
    it("should transfer ownership", async () => {
      await gateway.transferOwnership(merchant.address);
      expect(await gateway.owner()).to.equal(merchant.address);
    });

    it("should update owner state", async () => {
      await gateway.transferOwnership(merchant.address);
      expect(await gateway.owner()).to.equal(merchant.address);
    });

    it("should only allow owner to transfer ownership", async () => {
      await expect(
        gateway.connect(unauthorized).transferOwnership(unauthorized.address)
      ).to.be.revertedWith("Not owner");
    });

    it("should reject zero address", async () => {
      await expect(
        gateway.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid owner");
    });
  });
});


