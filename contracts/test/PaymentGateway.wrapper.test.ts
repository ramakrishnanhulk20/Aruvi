import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("PaymentGateway with Wrapper (Full Flow)", () => {
  let usdc: any;
  let wrapper: any;
  let gateway: any;
  let owner: any;
  let merchant: any;
  let customer: any;

  const INITIAL_USDC = 10_000_000n; // 10 USDC
  const PAYMENT_AMOUNT = 5_000n; // 0.005 USDC ($0.005 if USDC=$1)

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
    [owner, merchant, customer] = await ethers.getSigners();

    // 1. Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // 2. Deploy ConfidentialUSDCWrapper
    const Wrapper = await ethers.getContractFactory("ConfidentialUSDCWrapper");
    wrapper = await Wrapper.deploy(
      await usdc.getAddress(),
      "Confidential USDC",
      "cUSDC",
      ""
    );

    // 3. Deploy PaymentGateway
    const Gateway = await ethers.getContractFactory("PaymentGateway");
    gateway = await Gateway.deploy();

    // 4. Register merchant
    await gateway.registerMerchant(merchant.address);

    // 5. Mint USDC to customer
    await usdc.mint(customer.address, INITIAL_USDC);

    // 6. Customer approves wrapper and wraps USDC → cUSDC
    await usdc.connect(customer).approve(await wrapper.getAddress(), INITIAL_USDC);
    await wrapper.connect(customer).wrap(customer.address, INITIAL_USDC);
  });

  describe("Full Payment Flow: Wrap → Pay → Verify", () => {
    it("Should complete end-to-end: USDC → cUSDC → Payment → Merchant receives", async () => {
      const wrapperAddress = await wrapper.getAddress();
      const gatewayAddress = await gateway.getAddress();

      // Verify customer has wrapped cUSDC
      const customerInitial = await decryptBalance(wrapper, customer.address, customer);
      expect(customerInitial).to.equal(INITIAL_USDC);

      // Customer authorizes gateway as operator
      const until = Math.floor(Date.now() / 1000) + 3600;
      await wrapper.connect(customer).setOperator(gatewayAddress, until);

      // Encrypt payment amount
      const { handles, inputProof } = await encryptAmount(
        gatewayAddress,
        customer.address,
        PAYMENT_AMOUNT
      );

      // Process payment through gateway
      await gateway
        .connect(customer)
        .processPayment(merchant.address, wrapperAddress, handles[0], inputProof, "test", 0, 0);

      // Verify balances
      const customerFinal = await decryptBalance(wrapper, customer.address, customer);
      const merchantFinal = await decryptBalance(wrapper, merchant.address, merchant);

      expect(customerFinal).to.equal(INITIAL_USDC - PAYMENT_AMOUNT);
      expect(merchantFinal).to.equal(PAYMENT_AMOUNT);
    });

    it("Should allow multiple payments from wrapped balance", async () => {
      const gatewayAddress = await gateway.getAddress();
      const wrapperAddress = await wrapper.getAddress();
      const until = Math.floor(Date.now() / 1000) + 3600;

      await wrapper.connect(customer).setOperator(gatewayAddress, until);

      // First payment
      const { handles: h1, inputProof: p1 } = await encryptAmount(
        gatewayAddress,
        customer.address,
        PAYMENT_AMOUNT
      );
      await gateway.connect(customer).processPayment(merchant.address, wrapperAddress, h1[0], p1, "test", 0, 0);

      // Second payment
      const { handles: h2, inputProof: p2 } = await encryptAmount(
        gatewayAddress,
        customer.address,
        PAYMENT_AMOUNT
      );
      await gateway.connect(customer).processPayment(merchant.address, wrapperAddress, h2[0], p2, "test", 0, 0);

      // Verify totals
      const customerFinal = await decryptBalance(wrapper, customer.address, customer);
      const merchantFinal = await decryptBalance(wrapper, merchant.address, merchant);

      expect(customerFinal).to.equal(INITIAL_USDC - PAYMENT_AMOUNT * 2n);
      expect(merchantFinal).to.equal(PAYMENT_AMOUNT * 2n);
    });
  });

  describe("Full Refund Flow: Wrap → Pay → Refund", () => {
    it("Should complete end-to-end refund: Payment → Refund → Customer receives back", async () => {
      const gatewayAddress = await gateway.getAddress();
      const wrapperAddress = await wrapper.getAddress();
      const until = Math.floor(Date.now() / 1000) + 3600;

      // Customer pays
      await wrapper.connect(customer).setOperator(gatewayAddress, until);
      const { handles, inputProof } = await encryptAmount(
        gatewayAddress,
        customer.address,
        PAYMENT_AMOUNT
      );
      const tx = await gateway.connect(customer).processPayment(
        merchant.address,
        wrapperAddress,
        handles[0],
        inputProof,
        "test",
        0,
        0
      );

      // Get payment ID from event
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return gateway.interface.parseLog(log)?.name === 'PaymentProcessed';
        } catch { return false; }
      });
      const parsedEvent = gateway.interface.parseLog(event!);
      const actualPaymentId = parsedEvent?.args?.paymentId;

      // Merchant authorizes gateway for refund
      await wrapper.connect(merchant).setOperator(gatewayAddress, until);

      // Deploy RefundManager
      const RefundManager = await ethers.getContractFactory("RefundManager");
      const refundManager = await RefundManager.deploy(gatewayAddress);

      // Authorize refund manager
      await gateway.setRefundManager(await refundManager.getAddress(), true);

      // Queue refund then process
      const reqTx = await refundManager.connect(merchant).queueRefund(actualPaymentId, customer.address);
      const reqReceipt = await reqTx.wait();
      const queuedEvent = reqReceipt?.logs.find((log: any) => {
        try {
          return refundManager.interface.parseLog(log)?.name === 'RefundQueued';
        } catch { return false; }
      });
      const parsedQueued = refundManager.interface.parseLog(queuedEvent!);
      const requestId = parsedQueued?.args?.requestId;

      await refundManager.connect(merchant).processQueuedRefund(requestId);

      // Verify customer got refund
      const customerFinal = await decryptBalance(wrapper, customer.address, customer);
      const merchantFinal = await decryptBalance(wrapper, merchant.address, merchant);

      expect(customerFinal).to.equal(INITIAL_USDC); // Full refund
      expect(merchantFinal).to.equal(0n);
    });
  });

  describe("Edge Cases", () => {
    it("Should revert payment if customer has insufficient wrapped balance", async () => {
      const gatewayAddress = await gateway.getAddress();
      const wrapperAddress = await wrapper.getAddress();
      const until = Math.floor(Date.now() / 1000) + 3600;

      await wrapper.connect(customer).setOperator(gatewayAddress, until);

      // Try to pay more than wrapped balance
      // Note: The encryption will succeed, but the actual confidentialTransferFrom will fail
      const { handles, inputProof } = await encryptAmount(
        gatewayAddress,
        customer.address,
        INITIAL_USDC + 1n
      );

      // FHE operations don't revert immediately - they use encrypted booleans
      // The transfer will "succeed" but with an encrypted failure state
      // For this test, we just verify the payment can be attempted
      await gateway.connect(customer).processPayment(merchant.address, wrapperAddress, handles[0], inputProof, "test", 0, 0);
      
      // Merchant balance should still be 0 (transfer failed internally)
      const merchantBalance = await decryptBalance(wrapper, merchant.address, merchant);
      expect(merchantBalance).to.equal(0n);
    });

    it("Should revert if gateway operator authorization expires", async () => {
      const wrapperAddress = await wrapper.getAddress();
      const gatewayAddress = await gateway.getAddress();
      
      // Set operator with already expired timestamp
      const expiredTime = Math.floor(Date.now() / 1000) - 1;
      await wrapper.connect(customer).setOperator(gatewayAddress, expiredTime);

      const { handles, inputProof } = await encryptAmount(
        gatewayAddress,
        customer.address,
        PAYMENT_AMOUNT
      );

      await expect(
        gateway.connect(customer).processPayment(merchant.address, wrapperAddress, handles[0], inputProof, "test", 0, 0)
      ).to.be.reverted;
    });
  });
});

