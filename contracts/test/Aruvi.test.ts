import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Aruvi Protocol Test Suite
 * 
 * Contracts:
 * - ConfidentialUSDCWrapper: Wraps USDC → cUSDC (FHE-encrypted)
 * - AruviPaymentGateway: Privacy-first P2P payments
 */
describe("Aruvi Protocol", function () {
  let usdc: any;
  let wrapper: any;
  let gateway: any;

  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;

  const INITIAL_MINT = 10_000_000_000n; // 10,000 USDC
  const WRAP_AMOUNT = 1_000_000_000n;   // 1,000 USDC

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy ConfidentialUSDCWrapper
    const Wrapper = await ethers.getContractFactory("ConfidentialUSDCWrapper");
    wrapper = await Wrapper.deploy(
      await usdc.getAddress(),
      "Confidential USDC",
      "cUSDC",
      ""
    );
    await wrapper.waitForDeployment();

    // Deploy AruviPaymentGateway
    const Gateway = await ethers.getContractFactory("AruviPaymentGateway");
    gateway = await Gateway.deploy(await wrapper.getAddress());
    await gateway.waitForDeployment();

    // Mint USDC to test users
    await usdc.mint(alice.address, INITIAL_MINT);
    await usdc.mint(bob.address, INITIAL_MINT);
    await usdc.mint(charlie.address, INITIAL_MINT);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //                        CONFIDENTIAL USDC WRAPPER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("ConfidentialUSDCWrapper", function () {
    describe("Deployment", function () {
      it("should have correct name", async function () {
        expect(await wrapper.name()).to.equal("Confidential USDC");
      });

      it("should have correct symbol", async function () {
        expect(await wrapper.symbol()).to.equal("cUSDC");
      });

      it("should have correct underlying token", async function () {
        expect(await wrapper.underlying()).to.equal(await usdc.getAddress());
      });

      it("should have 6 decimals matching USDC", async function () {
        expect(await wrapper.decimals()).to.equal(6);
      });

      it("should have 1:1 conversion rate", async function () {
        expect(await wrapper.rate()).to.equal(1);
      });
    });

    describe("Wrapping USDC → cUSDC", function () {
      const wrapAmount = 500_000_000n; // 500 USDC

      beforeEach(async function () {
        await usdc.connect(alice).approve(await wrapper.getAddress(), wrapAmount);
      });

      it("should wrap USDC into cUSDC", async function () {
        const wrapperAddr = await wrapper.getAddress();
        const aliceBalanceBefore = await usdc.balanceOf(alice.address);

        await wrapper.connect(alice).wrap(alice.address, wrapAmount);

        expect(await usdc.balanceOf(wrapperAddr)).to.equal(wrapAmount);
        expect(await usdc.balanceOf(alice.address)).to.equal(aliceBalanceBefore - wrapAmount);
      });

      it("should create encrypted balance after wrap", async function () {
        await wrapper.connect(alice).wrap(alice.address, wrapAmount);

        const handle = await wrapper.confidentialBalanceOf(alice.address);
        expect(handle).to.not.equal(ethers.ZeroHash);
      });

      it("should decrypt to correct wrapped amount", async function () {
        await wrapper.connect(alice).wrap(alice.address, wrapAmount);

        const handle = await wrapper.confidentialBalanceOf(alice.address);
        const decrypted = await fhevm.userDecryptEuint(
          FhevmType.euint64,
          handle,
          await wrapper.getAddress(),
          alice
        );

        expect(decrypted).to.equal(wrapAmount);
      });

      it("should allow wrapping to different recipient", async function () {
        await wrapper.connect(alice).wrap(bob.address, wrapAmount);

        const handle = await wrapper.confidentialBalanceOf(bob.address);
        const decrypted = await fhevm.userDecryptEuint(
          FhevmType.euint64,
          handle,
          await wrapper.getAddress(),
          bob
        );

        expect(decrypted).to.equal(wrapAmount);
      });

      it("should revert on insufficient allowance", async function () {
        await expect(
          wrapper.connect(alice).wrap(alice.address, wrapAmount + 1n)
        ).to.be.reverted;
      });
    });

    describe("Confidential Transfers", function () {
      const wrapAmount = 1_000_000_000n;

      beforeEach(async function () {
        await usdc.connect(alice).approve(await wrapper.getAddress(), wrapAmount);
        await wrapper.connect(alice).wrap(alice.address, wrapAmount);
      });

      it("should transfer encrypted tokens between users", async function () {
        const transferAmount = 250_000_000n;
        const wrapperAddr = await wrapper.getAddress();

        const input = await fhevm.createEncryptedInput(wrapperAddr, alice.address);
        input.add64(transferAmount);
        const encrypted = await input.encrypt();

        await wrapper.connect(alice)["confidentialTransfer(address,bytes32,bytes)"](
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof
        );

        const aliceHandle = await wrapper.confidentialBalanceOf(alice.address);
        const bobHandle = await wrapper.confidentialBalanceOf(bob.address);

        const aliceBalance = await fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, wrapperAddr, alice);
        const bobBalance = await fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, wrapperAddr, bob);

        expect(aliceBalance).to.equal(wrapAmount - transferAmount);
        expect(bobBalance).to.equal(transferAmount);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //                        ARUVI PAYMENT GATEWAY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("AruviPaymentGateway", function () {
    beforeEach(async function () {
      const wrapperAddr = await wrapper.getAddress();
      const gatewayAddr = await gateway.getAddress();

      // Wrap USDC for alice and bob
      await usdc.connect(alice).approve(wrapperAddr, WRAP_AMOUNT);
      await wrapper.connect(alice).wrap(alice.address, WRAP_AMOUNT);

      await usdc.connect(bob).approve(wrapperAddr, WRAP_AMOUNT);
      await wrapper.connect(bob).wrap(bob.address, WRAP_AMOUNT);

      // Set gateway as operator (ERC7984 uses operators with expiry timestamp)
      const farFuture = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
      await wrapper.connect(alice).setOperator(gatewayAddr, farFuture);
      await wrapper.connect(bob).setOperator(gatewayAddr, farFuture);
    });

    describe("Deployment", function () {
      it("should set correct owner", async function () {
        expect(await gateway.owner()).to.equal(owner.address);
      });

      it("should set correct default token", async function () {
        expect(await gateway.defaultToken()).to.equal(await wrapper.getAddress());
      });
    });

    describe("Send Payment", function () {
      const sendAmount = 100_000_000n;

      it("should send encrypted payment", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(sendAmount);
        const encrypted = await input.encrypt();

        const tx = await gateway.connect(alice).send(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof
        );
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "PaymentSent";
          } catch { return false; }
        });
        expect(event).to.not.be.undefined;
      });

      it("should update payment count", async function () {
        const gatewayAddr = await gateway.getAddress();
        const countBefore = await gateway.paymentCount(alice.address);

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(sendAmount);
        const encrypted = await input.encrypt();

        await gateway.connect(alice).send(bob.address, encrypted.handles[0], encrypted.inputProof);

        expect(await gateway.paymentCount(alice.address)).to.equal(countBefore + 1n);
      });

      it("should revert when sending to self", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(sendAmount);
        const encrypted = await input.encrypt();

        await expect(
          gateway.connect(alice).send(alice.address, encrypted.handles[0], encrypted.inputProof)
        ).to.be.revertedWith("Cannot send to self");
      });

      it("should revert when sending to zero address", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(sendAmount);
        const encrypted = await input.encrypt();

        await expect(
          gateway.connect(alice).send(ethers.ZeroAddress, encrypted.handles[0], encrypted.inputProof)
        ).to.be.revertedWith("Invalid recipient");
      });
    });

    describe("Multi-Send", function () {
      const sendAmount = 50_000_000n;

      it("should send to multiple recipients", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input1 = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input1.add64(sendAmount);
        const encrypted1 = await input1.encrypt();

        const input2 = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input2.add64(sendAmount);
        const encrypted2 = await input2.encrypt();

        const tx = await gateway.connect(alice).multiSend(
          [bob.address, charlie.address],
          [encrypted1.handles[0], encrypted2.handles[0]],
          [encrypted1.inputProof, encrypted2.inputProof]
        );
        const receipt = await tx.wait();

        const events = receipt?.logs.filter((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "PaymentSent";
          } catch { return false; }
        });
        expect(events?.length).to.equal(2);
      });

      it("should revert with more than 10 recipients", async function () {
        const gatewayAddr = await gateway.getAddress();
        const recipients = Array(11).fill(bob.address);
        const handles: any[] = [];
        const proofs: any[] = [];

        for (let i = 0; i < 11; i++) {
          const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
          input.add64(sendAmount);
          const encrypted = await input.encrypt();
          handles.push(encrypted.handles[0]);
          proofs.push(encrypted.inputProof);
        }

        await expect(
          gateway.connect(alice).multiSend(recipients, handles, proofs)
        ).to.be.revertedWith("1-10 recipients");
      });
    });

    describe("Payment Requests", function () {
      const requestAmount = 75_000_000n;

      it("should create payment request", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(requestAmount);
        const encrypted = await input.encrypt();

        const tx = await gateway.connect(alice).createRequest(
          encrypted.handles[0],
          encrypted.inputProof,
          86400
        );
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "RequestCreated";
          } catch { return false; }
        });
        expect(event).to.not.be.undefined;
      });

      it("should fulfill payment request", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input1 = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input1.add64(requestAmount);
        const encrypted1 = await input1.encrypt();

        const createTx = await gateway.connect(alice).createRequest(
          encrypted1.handles[0],
          encrypted1.inputProof,
          86400
        );
        const createReceipt = await createTx.wait();

        const createEvent = createReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "RequestCreated";
          } catch { return false; }
        });
        const requestId = gateway.interface.parseLog(createEvent)?.args.requestId;

        const input2 = await fhevm.createEncryptedInput(gatewayAddr, bob.address);
        input2.add64(requestAmount);
        const encrypted2 = await input2.encrypt();

        const fulfillTx = await gateway.connect(bob).fulfillRequest(
          requestId,
          encrypted2.handles[0],
          encrypted2.inputProof
        );
        const fulfillReceipt = await fulfillTx.wait();

        const fulfillEvent = fulfillReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "RequestFulfilled";
          } catch { return false; }
        });
        expect(fulfillEvent).to.not.be.undefined;
      });

      it("should cancel payment request", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(requestAmount);
        const encrypted = await input.encrypt();

        const createTx = await gateway.connect(alice).createRequest(
          encrypted.handles[0],
          encrypted.inputProof,
          86400
        );
        const createReceipt = await createTx.wait();

        const createEvent = createReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "RequestCreated";
          } catch { return false; }
        });
        const requestId = gateway.interface.parseLog(createEvent)?.args.requestId;

        const cancelTx = await gateway.connect(alice).cancelRequest(requestId);
        const cancelReceipt = await cancelTx.wait();

        const cancelEvent = cancelReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "RequestCancelled";
          } catch { return false; }
        });
        expect(cancelEvent).to.not.be.undefined;
      });
    });

    describe("Subscriptions", function () {
      const subAmount = 10_000_000n;
      const interval = 86400;

      it("should create subscription", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(subAmount);
        const encrypted = await input.encrypt();

        const tx = await gateway.connect(alice).createSubscription(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof,
          interval
        );
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch { return false; }
        });
        expect(event).to.not.be.undefined;
      });

      it("should execute subscription payment", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(subAmount);
        const encrypted = await input.encrypt();

        const createTx = await gateway.connect(alice).createSubscription(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof,
          interval
        );
        const createReceipt = await createTx.wait();

        const createEvent = createReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch { return false; }
        });
        const subId = gateway.interface.parseLog(createEvent)?.args.subscriptionId;

        const execTx = await gateway.connect(bob).executeSubscription(subId);
        const execReceipt = await execTx.wait();

        const execEvent = execReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "SubscriptionPaid";
          } catch { return false; }
        });
        expect(execEvent).to.not.be.undefined;
      });

      it("should cancel subscription", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(subAmount);
        const encrypted = await input.encrypt();

        const createTx = await gateway.connect(alice).createSubscription(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof,
          interval
        );
        const createReceipt = await createTx.wait();

        const createEvent = createReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch { return false; }
        });
        const subId = gateway.interface.parseLog(createEvent)?.args.subscriptionId;

        const cancelTx = await gateway.connect(alice).cancelSubscription(subId);
        const cancelReceipt = await cancelTx.wait();

        const cancelEvent = cancelReceipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "SubscriptionCancelled";
          } catch { return false; }
        });
        expect(cancelEvent).to.not.be.undefined;
      });

      it("should revert subscription with interval less than 1 day", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(subAmount);
        const encrypted = await input.encrypt();

        await expect(
          gateway.connect(alice).createSubscription(
            bob.address,
            encrypted.handles[0],
            encrypted.inputProof,
            3600
          )
        ).to.be.revertedWith("Interval too short");
      });
    });

    describe("Refunds", function () {
      const sendAmount = 100_000_000n;
      let paymentId: string;

      beforeEach(async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(sendAmount);
        const encrypted = await input.encrypt();

        const tx = await gateway.connect(alice).send(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof
        );
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "PaymentSent";
          } catch { return false; }
        });
        paymentId = gateway.interface.parseLog(event)?.args.paymentId;
      });

      it("should allow recipient to refund", async function () {
        const tx = await gateway.connect(bob).refund(paymentId);
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "PaymentRefunded";
          } catch { return false; }
        });
        expect(event).to.not.be.undefined;
      });

      it("should mark payment as refunded", async function () {
        await gateway.connect(bob).refund(paymentId);
        expect(await gateway.refunded(paymentId)).to.be.true;
      });

      it("should revert double refund", async function () {
        await gateway.connect(bob).refund(paymentId);

        await expect(
          gateway.connect(bob).refund(paymentId)
        ).to.be.revertedWith("Already refunded");
      });

      it("should revert refund by non-recipient", async function () {
        await expect(
          gateway.connect(alice).refund(paymentId)
        ).to.be.revertedWith("Not recipient");
      });
    });

    describe("View Functions", function () {
      it("should return payment info", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(100_000_000n);
        const encrypted = await input.encrypt();

        const tx = await gateway.connect(alice).send(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof
        );
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "PaymentSent";
          } catch { return false; }
        });
        const paymentId = gateway.interface.parseLog(event)?.args.paymentId;

        const info = await gateway.getPaymentInfo(paymentId);
        expect(info.sender).to.equal(alice.address);
        expect(info.recipient).to.equal(bob.address);
        expect(info.isRefunded).to.be.false;
      });

      it("should return subscription info", async function () {
        const gatewayAddr = await gateway.getAddress();

        const input = await fhevm.createEncryptedInput(gatewayAddr, alice.address);
        input.add64(10_000_000n);
        const encrypted = await input.encrypt();

        const tx = await gateway.connect(alice).createSubscription(
          bob.address,
          encrypted.handles[0],
          encrypted.inputProof,
          86400
        );
        const receipt = await tx.wait();

        const event = receipt?.logs.find((log: any) => {
          try {
            return gateway.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch { return false; }
        });
        const subId = gateway.interface.parseLog(event)?.args.subscriptionId;

        const info = await gateway.getSubscriptionInfo(subId);
        expect(info.subscriber).to.equal(alice.address);
        expect(info.recipient).to.equal(bob.address);
        expect(info.active).to.be.true;
      });
    });

    describe("Admin Functions", function () {
      it("should allow owner to change default token", async function () {
        const NewWrapper = await ethers.getContractFactory("ConfidentialUSDCWrapper");
        const newWrapper = await NewWrapper.deploy(
          await usdc.getAddress(),
          "New cUSDC",
          "ncUSDC",
          ""
        );
        await newWrapper.waitForDeployment();

        await gateway.connect(owner).setDefaultToken(await newWrapper.getAddress());
        expect(await gateway.defaultToken()).to.equal(await newWrapper.getAddress());
      });

      it("should revert non-owner token change", async function () {
        await expect(
          gateway.connect(alice).setDefaultToken(ethers.ZeroAddress)
        ).to.be.revertedWith("Not owner");
      });

      it("should transfer ownership", async function () {
        await gateway.connect(owner).transferOwnership(alice.address);
        expect(await gateway.owner()).to.equal(alice.address);
      });

      it("should revert ownership transfer to zero address", async function () {
        await expect(
          gateway.connect(owner).transferOwnership(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid owner");
      });
    });
  });
});
