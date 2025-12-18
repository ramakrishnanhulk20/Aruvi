import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import {
  PaymentGateway,
  PaymentGateway__factory,
  MockERC7984,
  MockERC7984__factory,
  RefundManager,
  RefundManager__factory,
} from "../types";

const CENTS = 5_000n; // $50.00 in cents

async function encryptAmount(contractAddress: string, sender: string, amount: bigint) {
  const input = await fhevm.createEncryptedInput(contractAddress, sender);
  input.add64(amount);
  return input.encrypt();
}

async function decryptBalance(token: MockERC7984, account: string, signer: any) {
  const handle = await token.confidentialBalanceOf(account);
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, await token.getAddress(), signer);
}

describe("PaymentGateway refunds", () => {
  let token: MockERC7984;
  let gateway: PaymentGateway;
  let refundManager: RefundManager;
  let owner: any;
  let merchant: any;
  let customer: any;

  beforeEach(async () => {
    [owner, merchant, customer] = await ethers.getSigners();

    token = await new MockERC7984__factory(owner).deploy("ConfUSDC", "cUSDC");
    gateway = await new PaymentGateway__factory(owner).deploy();
    refundManager = await new RefundManager__factory(owner).deploy(await gateway.getAddress());

    await gateway.registerMerchant(merchant.address);
    await gateway.setRefundManager(await refundManager.getAddress(), true);

    // Owner mints directly to customer
    const mintEnc = await encryptAmount(await token.getAddress(), owner.address, CENTS);
    await token.mint(customer.address, mintEnc.handles[0], mintEnc.inputProof);
  });

  it("processes payment and refund via RefundManager", async () => {
    // Customer authorizes gateway as operator
    const latest = await ethers.provider.getBlock("latest");
    await token.connect(customer).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

    // Customer pays merchant
    const payEncRecord = await encryptAmount(await gateway.getAddress(), customer.address, CENTS);

    const payTx = await gateway
      .connect(customer)
      .processPayment(merchant.address, await token.getAddress(), payEncRecord.handles[0], payEncRecord.inputProof, "test", 0, 0);
    
    const payReceipt = await payTx.wait();
    const payEvent = payReceipt?.logs.find((log: any) => {
      try {
        return gateway.interface.parseLog(log)?.name === "PaymentProcessed";
      } catch {
        return false;
      }
    });
    const paymentId = gateway.interface.parseLog(payEvent!)?.args[0];

    // Merchant authorizes gateway as operator to pull funds back for refund
    await token.connect(merchant).setOperator(await gateway.getAddress(), latest!.timestamp + 3600);

    // Queue and process refund
    const queued = await refundManager.connect(merchant).queueRefund(paymentId, customer.address);
    const queuedRcpt = await queued.wait();
    const block = await ethers.provider.getBlock(queuedRcpt!.blockHash!);
    const requestId = ethers.solidityPackedKeccak256(
      ["bytes32", "address", "address", "uint256", "uint256"],
      [paymentId, customer.address, merchant.address, block!.timestamp, queuedRcpt!.blockNumber],
    );

    await refundManager.connect(merchant).processQueuedRefund(requestId);

    // Decrypt balances
    const merchantBal = await decryptBalance(token, merchant.address, merchant);
    const customerBal = await decryptBalance(token, customer.address, customer);

    expect(merchantBal).to.equal(0n);
    expect(customerBal).to.equal(CENTS);
  });
});


