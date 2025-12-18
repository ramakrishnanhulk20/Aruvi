import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConfidentialUSDCWrapper - Advanced Features", () => {
  let usdc: any;
  let wrapper: any;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const MINT_AMOUNT = 1_000_000n; // 1 USDC

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const Wrapper = await ethers.getContractFactory("ConfidentialUSDCWrapper");
    wrapper = await Wrapper.deploy(
      await usdc.getAddress(),
      "Confidential USDC",
      "cUSDC",
      ""
    );

    await usdc.mint(alice.address, MINT_AMOUNT);
    await usdc.connect(alice).approve(await wrapper.getAddress(), MINT_AMOUNT);
    await wrapper.connect(alice).wrap(alice.address, MINT_AMOUNT);
  });

  describe("Wrapping Variations", () => {
    it("Should wrap and verify balance increase", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      // Mint more USDC to Bob
      await usdc.mint(bob.address, MINT_AMOUNT);
      await usdc.connect(bob).approve(wrapperAddress, MINT_AMOUNT);
      
      // Wrap
      await wrapper.connect(bob).wrap(bob.address, MINT_AMOUNT);
      
      // Check cUSDC balance
      const handle = await wrapper.confidentialBalanceOf(bob.address);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        wrapperAddress,
        bob
      );
      expect(decrypted).to.equal(MINT_AMOUNT);
    });

    it("Should wrap to different recipient", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      // Mint to owner, wrap to Bob
      await usdc.mint(owner.address, MINT_AMOUNT);
      await usdc.connect(owner).approve(wrapperAddress, MINT_AMOUNT);
      await wrapper.connect(owner).wrap(bob.address, MINT_AMOUNT);

      // Check Bob received it
      const handle = await wrapper.confidentialBalanceOf(bob.address);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        wrapperAddress,
        bob
      );
      expect(decrypted).to.equal(MINT_AMOUNT);
    });

    it("Should handle multiple sequential wraps", async () => {
      const wrapperAddress = await wrapper.getAddress();
      const ADDITIONAL_AMOUNT = 500_000n;
      
      // Alice wraps more
      await usdc.mint(alice.address, ADDITIONAL_AMOUNT);
      await usdc.connect(alice).approve(wrapperAddress, ADDITIONAL_AMOUNT);
      await wrapper.connect(alice).wrap(alice.address, ADDITIONAL_AMOUNT);

      // Check accumulated balance
      const handle = await wrapper.confidentialBalanceOf(alice.address);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        wrapperAddress,
        alice
      );
      expect(decrypted).to.equal(MINT_AMOUNT + ADDITIONAL_AMOUNT);
    });
  });

  describe("Confidential Transfer", () => {
    const TRANSFER_AMOUNT = 300_000n;

    it("Should transfer cUSDC directly between users", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      // Alice transfers to Bob
      const input = await fhevm.createEncryptedInput(wrapperAddress, alice.address);
      input.add64(TRANSFER_AMOUNT);
      const { handles, inputProof } = await input.encrypt();

      await wrapper.connect(alice)['confidentialTransfer(address,bytes32,bytes)'](bob.address, handles[0], inputProof);

      // Check balances
      const aliceHandle = await wrapper.confidentialBalanceOf(alice.address);
      const aliceBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        wrapperAddress,
        alice
      );
      expect(aliceBalance).to.equal(MINT_AMOUNT - TRANSFER_AMOUNT);

      const bobHandle = await wrapper.confidentialBalanceOf(bob.address);
      const bobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        wrapperAddress,
        bob
      );
      expect(bobBalance).to.equal(TRANSFER_AMOUNT);
    });

    it("Should handle multiple sequential transfers", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      // First transfer: Alice → Bob
      let input = await fhevm.createEncryptedInput(wrapperAddress, alice.address);
      input.add64(TRANSFER_AMOUNT);
      let encrypted = await input.encrypt();
      await wrapper.connect(alice)['confidentialTransfer(address,bytes32,bytes)'](bob.address, encrypted.handles[0], encrypted.inputProof);

      // Second transfer: Alice → Bob again
      input = await fhevm.createEncryptedInput(wrapperAddress, alice.address);
      input.add64(TRANSFER_AMOUNT);
      encrypted = await input.encrypt();
      await wrapper.connect(alice)['confidentialTransfer(address,bytes32,bytes)'](bob.address, encrypted.handles[0], encrypted.inputProof);

      // Bob should have received both
      const bobHandle = await wrapper.confidentialBalanceOf(bob.address);
      const bobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        wrapperAddress,
        bob
      );
      expect(bobBalance).to.equal(TRANSFER_AMOUNT * 2n);
    });

    it("Should revert transfer to zero address", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      const input = await fhevm.createEncryptedInput(wrapperAddress, alice.address);
      input.add64(TRANSFER_AMOUNT);
      const { handles, inputProof } = await input.encrypt();

      await expect(
        wrapper.connect(alice)['confidentialTransfer(address,bytes32,bytes)'](ethers.ZeroAddress, handles[0], inputProof)
      ).to.be.reverted;
    });
  });

  describe("Operator Management", () => {
    it("Should set and use operator for transfers", async () => {
      const wrapperAddress = await wrapper.getAddress();
      const until = Math.floor(Date.now() / 1000) + 3600;

      // Alice authorizes Bob as operator
      await wrapper.connect(alice).setOperator(bob.address, until);

      // Bob can now transfer Alice's tokens
      const input = await fhevm.createEncryptedInput(wrapperAddress, bob.address);
      input.add64(100_000n);
      const { handles, inputProof } = await input.encrypt();

      await wrapper.connect(bob)['confidentialTransferFrom(address,address,bytes32,bytes)'](
        alice.address,
        bob.address,
        handles[0],
        inputProof
      );

      const bobHandle = await wrapper.confidentialBalanceOf(bob.address);
      const bobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        wrapperAddress,
        bob
      );
      expect(bobBalance).to.equal(100_000n);
    });

    it("Should revoke operator by setting expiry to 0", async () => {
      const until = Math.floor(Date.now() / 1000) + 3600;
      await wrapper.connect(alice).setOperator(bob.address, until);

      // Revoke
      await wrapper.connect(alice).setOperator(bob.address, 0);

      // Bob should no longer be able to transfer
      const wrapperAddress = await wrapper.getAddress();
      const input = await fhevm.createEncryptedInput(wrapperAddress, bob.address);
      input.add64(100_000n);
      const { handles, inputProof } = await input.encrypt();

      await expect(
        wrapper.connect(bob)['confidentialTransferFrom(address,address,bytes32,bytes)'](
          alice.address,
          bob.address,
          handles[0],
          inputProof
        )
      ).to.be.reverted;
    });

    it("Should reject expired operator", async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 1;
      await wrapper.connect(alice).setOperator(bob.address, expiredTime);

      const wrapperAddress = await wrapper.getAddress();
      const input = await fhevm.createEncryptedInput(wrapperAddress, bob.address);
      input.add64(100_000n);
      const { handles, inputProof } = await input.encrypt();

      await expect(
        wrapper.connect(bob)['confidentialTransferFrom(address,address,bytes32,bytes)'](
          alice.address,
          bob.address,
          handles[0],
          inputProof
        )
      ).to.be.reverted;
    });

    it("Should allow multiple operators for same account", async () => {
      const until = Math.floor(Date.now() / 1000) + 3600;
      
      // Alice authorizes both Bob and owner
      await wrapper.connect(alice).setOperator(bob.address, until);
      await wrapper.connect(alice).setOperator(owner.address, until);

      // Both should be able to operate
      const wrapperAddress = await wrapper.getAddress();
      
      let input = await fhevm.createEncryptedInput(wrapperAddress, bob.address);
      input.add64(50_000n);
      let encrypted = await input.encrypt();
      await wrapper.connect(bob)['confidentialTransferFrom(address,address,bytes32,bytes)'](
        alice.address,
        bob.address,
        encrypted.handles[0],
        encrypted.inputProof
      );

      input = await fhevm.createEncryptedInput(wrapperAddress, owner.address);
      input.add64(50_000n);
      encrypted = await input.encrypt();
      await wrapper.connect(owner)['confidentialTransferFrom(address,address,bytes32,bytes)'](
        alice.address,
        owner.address,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Verify both received tokens
      const bobHandle = await wrapper.confidentialBalanceOf(bob.address);
      const bobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        wrapperAddress,
        bob
      );
      expect(bobBalance).to.equal(50_000n);
    });
  });

  describe("Wrap and Unwrap Edge Cases", () => {
    it("Should handle wrap amount of 0", async () => {
      await usdc.mint(bob.address, 100_000n);
      await usdc.connect(bob).approve(await wrapper.getAddress(), 100_000n);

      // Wrapping 0 should succeed but not change anything
      await wrapper.connect(bob).wrap(bob.address, 0n);

      const bobHandle = await wrapper.confidentialBalanceOf(bob.address);
      const bobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        await wrapper.getAddress(),
        bob
      );
      expect(bobBalance).to.equal(0n);
    });

    it("Should maintain 1:1 backing ratio", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      // Multiple users wrap
      await usdc.mint(bob.address, 500_000n);
      await usdc.connect(bob).approve(wrapperAddress, 500_000n);
      await wrapper.connect(bob).wrap(bob.address, 500_000n);

      // Total USDC in wrapper should equal total wrapped amount
      expect(await usdc.balanceOf(wrapperAddress)).to.equal(MINT_AMOUNT + 500_000n);

      // Verify wrapped balances match
      const aliceHandle = await wrapper.confidentialBalanceOf(alice.address);
      const aliceBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        wrapperAddress,
        alice
      );
      
      const bobHandle = await wrapper.confidentialBalanceOf(bob.address);
      const bobBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        wrapperAddress,
        bob
      );
      
      // Total wrapped should equal total USDC held
      expect(aliceBalance + bobBalance).to.equal(MINT_AMOUNT + 500_000n);
    });
  });
});

