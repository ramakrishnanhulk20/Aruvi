import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Get nonce
  const nonce = await hre.ethers.provider.getTransactionCount(deployer.address, "pending");
  console.log("Current nonce:", nonce);

  // Deploy with higher gas price to replace stuck transaction
  const feeData = await hre.ethers.provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas! * BigInt(120) / BigInt(100); // 20% increase
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas! * BigInt(120) / BigInt(100);

  console.log("\nDeploying ProductRegistry...");
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy({
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await productRegistry.waitForDeployment();
  const registryAddress = await productRegistry.getAddress();
  console.log("ProductRegistry deployed to:", registryAddress);

  console.log("\nDeploying PaymentGateway...");
  const PaymentGateway = await hre.ethers.getContractFactory("PaymentGateway");
  const paymentGateway = await PaymentGateway.deploy({
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await paymentGateway.waitForDeployment();
  const gatewayAddress = await paymentGateway.getAddress();
  console.log("PaymentGateway deployed to:", gatewayAddress);

  console.log("\nDeploying RefundManager...");
  const RefundManager = await hre.ethers.getContractFactory("RefundManager");
  const refundManager = await RefundManager.deploy(gatewayAddress, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await refundManager.waitForDeployment();
  const refundAddress = await refundManager.getAddress();
  console.log("RefundManager deployed to:", refundAddress);

  console.log("\nDeploying ConfidentialUSDCWrapper...");
  const underlyingAddress = "0xED1B7De57918f6B7c8a7a7767557f09A80eC2a35"; // Existing MockUSDC
  const ConfidentialUSDCWrapper = await hre.ethers.getContractFactory("ConfidentialUSDCWrapper");
  const wrapper = await ConfidentialUSDCWrapper.deploy(
    underlyingAddress,
    "Confidential USDC",
    "cUSDC",
    "",
    {
      maxFeePerGas,
      maxPriorityFeePerGas,
    }
  );
  await wrapper.waitForDeployment();
  const wrapperAddress = await wrapper.getAddress();
  console.log("ConfidentialUSDCWrapper deployed to:", wrapperAddress);

  // Setup
  console.log("\nSetting up contracts...");
  
  console.log("Setting ProductRegistry in PaymentGateway...");
  let tx = await paymentGateway.setProductRegistry(registryAddress, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await tx.wait();
  
  console.log("Setting Gateway in ProductRegistry...");
  tx = await productRegistry.setGateway(gatewayAddress, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await tx.wait();

  console.log("Registering deployer as merchant...");
  tx = await paymentGateway.registerMerchant(deployer.address, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  await tx.wait();

  console.log("\n=== Deployment Complete ===");
  console.log("ConfidentialUSDCWrapper:", wrapperAddress);
  console.log("PaymentGateway:         ", gatewayAddress);
  console.log("ProductRegistry:        ", registryAddress);
  console.log("RefundManager:          ", refundAddress);
  console.log("Underlying ERC20:       ", underlyingAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
