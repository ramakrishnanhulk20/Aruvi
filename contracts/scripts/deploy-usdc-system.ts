import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

/**
 * Deploy complete system with Circle's official USDC on Sepolia
 * This is a separate deployment for testing official USDC vs MockUSDC
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n=== Deploying USDC System ===");
  console.log("Deployer:", deployer.address);

  // Circle's official USDC on Sepolia
  const officialUSDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  console.log("Underlying Token: Circle USDC (Sepolia)");
  console.log("Address:", officialUSDC);

  // Deploy Wrapper
  console.log("\n1. Deploying ConfidentialUSDCWrapper...");
  const Wrapper = await hre.ethers.getContractFactory("ConfidentialUSDCWrapper");
  const wrapper = await Wrapper.deploy(
    officialUSDC,
    "Confidential USDC",
    "cUSDC",
    ""
  );
  await wrapper.waitForDeployment();
  const wrapperAddress = await wrapper.getAddress();
  console.log("✓ Wrapper deployed:", wrapperAddress);

  // Deploy PaymentGateway
  console.log("\n2. Deploying PaymentGateway...");
  const Gateway = await hre.ethers.getContractFactory("PaymentGateway");
  const gateway = await Gateway.deploy();
  await gateway.waitForDeployment();
  const gatewayAddress = await gateway.getAddress();
  console.log("✓ Gateway deployed:", gatewayAddress);

  // Deploy ProductRegistry
  console.log("\n3. Deploying ProductRegistry...");
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy();
  await productRegistry.waitForDeployment();
  const productRegistryAddress = await productRegistry.getAddress();
  console.log("✓ ProductRegistry deployed:", productRegistryAddress);

  // Deploy RefundManager
  console.log("\n4. Deploying RefundManager...");
  const RefundManager = await hre.ethers.getContractFactory("RefundManager");
  const refundManager = await RefundManager.deploy(gatewayAddress);
  await refundManager.waitForDeployment();
  const refundManagerAddress = await refundManager.getAddress();
  console.log("✓ RefundManager deployed:", refundManagerAddress);

  // Configure contracts
  console.log("\n5. Configuring contracts...");
  await gateway.setProductRegistry(productRegistryAddress);
  console.log("✓ Set ProductRegistry in Gateway");

  await productRegistry.setGateway(gatewayAddress);
  console.log("✓ Set Gateway in ProductRegistry");

  // Merchant is auto-registered on first product registration
  console.log("✓ Merchant will be registered on first product");

  // Summary
  console.log("\n=== USDC System Deployment Complete ===");
  console.log("\nContract Addresses:");
  console.log("Official USDC:       ", officialUSDC);
  console.log("Wrapper (cUSDC):     ", wrapperAddress);
  console.log("PaymentGateway:      ", gatewayAddress);
  console.log("ProductRegistry:     ", productRegistryAddress);
  console.log("RefundManager:       ", refundManagerAddress);
  
  console.log("\n💡 Next steps:");
  console.log("1. Get USDC from Sepolia faucet: https://faucet.circle.com/");
  console.log("2. Update frontend/.env.usdc with these addresses");
  console.log("3. Verify contracts on Etherscan");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
