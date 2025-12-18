import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConfidentialUSDCWrapper", () => {
  let usdc: any;
  let wrapper: any;
  let owner: HardhatEthersSigner;
  let customer: HardhatEthersSigner;

  const MINT_AMOUNT = 1_000_000n; // 1 USDC (6 decimals)

  beforeEach(async () => {
    [owner, customer] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy ConfidentialUSDCWrapper
    const Wrapper = await ethers.getContractFactory("ConfidentialUSDCWrapper");
    wrapper = await Wrapper.deploy(
      await usdc.getAddress(),
      "Confidential USDC",
      "cUSDC",
      ""
    );

    // Mint USDC to customer
    await usdc.mint(customer.address, MINT_AMOUNT);
  });

  describe("Deployment", () => {
    it("Should set correct name and symbol", async () => {
      expect(await wrapper.name()).to.equal("Confidential USDC");
      expect(await wrapper.symbol()).to.equal("cUSDC");
    });

    it("Should set correct underlying token", async () => {
      expect(await wrapper.underlying()).to.equal(await usdc.getAddress());
    });

    it("Should return 6 decimals (matching USDC)", async () => {
      expect(await wrapper.decimals()).to.equal(6);
    });

    it("Should return rate of 1 (1:1 conversion)", async () => {
      expect(await wrapper.rate()).to.equal(1);
    });
  });

  describe("Wrapping", () => {
    const WRAP_AMOUNT = 500_000n; // 0.5 USDC

    beforeEach(async () => {
      // Customer approves wrapper to spend USDC
      await usdc.connect(customer).approve(await wrapper.getAddress(), WRAP_AMOUNT);
    });

    it("Should wrap USDC into cUSDC", async () => {
      const wrapperAddress = await wrapper.getAddress();
      
      // Wrap USDC
      await wrapper.connect(customer).wrap(customer.address, WRAP_AMOUNT);

      // Check USDC was transferred to wrapper
      expect(await usdc.balanceOf(wrapperAddress)).to.equal(WRAP_AMOUNT);
      expect(await usdc.balanceOf(customer.address)).to.equal(MINT_AMOUNT - WRAP_AMOUNT);

      // Customer should have encrypted cUSDC balance
      const handle = await wrapper.confidentialBalanceOf(customer.address);
      expect(handle).to.not.equal(ethers.zeroPadValue("0x00", 32));
    });

    it("Should decrypt wrapped balance correctly", async () => {
      await wrapper.connect(customer).wrap(customer.address, WRAP_AMOUNT);

      // Decrypt balance
      const handle = await wrapper.confidentialBalanceOf(customer.address);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        await wrapper.getAddress(),
        customer
      );

      expect(decrypted).to.equal(WRAP_AMOUNT);
    });

    it("Should revert if insufficient allowance", async () => {
      await expect(
        wrapper.connect(customer).wrap(customer.address, WRAP_AMOUNT + 1n)
      ).to.be.reverted;
    });

    it("Should revert if insufficient USDC balance", async () => {
      await usdc.connect(customer).approve(await wrapper.getAddress(), MINT_AMOUNT + 1n);
      
      await expect(
        wrapper.connect(customer).wrap(customer.address, MINT_AMOUNT + 1n)
      ).to.be.reverted;
    });
  });

  describe("Integration with existing balance", () => {
    it("Should accumulate multiple wraps", async () => {
      const FIRST_WRAP = 300_000n;
      const SECOND_WRAP = 200_000n;

      await usdc.connect(customer).approve(await wrapper.getAddress(), FIRST_WRAP + SECOND_WRAP);

      // First wrap
      await wrapper.connect(customer).wrap(customer.address, FIRST_WRAP);

      // Second wrap
      await wrapper.connect(customer).wrap(customer.address, SECOND_WRAP);

      // Decrypt total balance
      const handle = await wrapper.confidentialBalanceOf(customer.address);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        await wrapper.getAddress(),
        customer
      );

      expect(decrypted).to.equal(FIRST_WRAP + SECOND_WRAP);
    });
  });
});

