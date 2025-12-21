import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying AruviPaymentGateway with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Use existing cUSDC wrapper as default token
  const WRAPPER_ADDRESS = "0xf99376BE228E8212C3C9b8B746683C96C1517e8B";
  
  console.log("\nDeploying AruviPaymentGateway...");
  const AruviPaymentGateway = await ethers.getContractFactory("AruviPaymentGateway");
  const gateway = await AruviPaymentGateway.deploy(WRAPPER_ADDRESS);
  await gateway.waitForDeployment();
  
  const gatewayAddress = await gateway.getAddress();
  console.log("AruviPaymentGateway deployed to:", gatewayAddress);
  
  // Verify configuration
  const defaultToken = await gateway.defaultToken();
  const owner = await gateway.owner();
  
  console.log("\n=== Deployment Summary ===");
  console.log("AruviPaymentGateway:", gatewayAddress);
  console.log("Default Token (cUSDC):", defaultToken);
  console.log("Owner:", owner);
  console.log("\n=== Update Frontend ===");
  console.log(`Update frontend/src/lib/contracts.ts:`);
  console.log(`  ARUVI_GATEWAY: '${gatewayAddress}' as const,`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
