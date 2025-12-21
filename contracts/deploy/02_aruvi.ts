import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Deploys Aruvi contracts on Sepolia:
 * - ConfidentialUSDCWrapper (wraps USDC into private cUSDC) - if not already deployed
 * - AruviPaymentGateway (privacy-first payment gateway)
 *
 * Env vars:
 * UNDERLYING_ERC20_ADDRESS: Sepolia USDC (default: Circle test USDC)
 * WRAPPER_ADDRESS: Use existing wrapper (skip wrapper deploy)
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Circle test USDC on Sepolia
  const underlying = process.env.UNDERLYING_ERC20_ADDRESS ?? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  
  // Use existing wrapper or deploy new one
  const existingWrapper = process.env.WRAPPER_ADDRESS ?? "";

  console.log(`\n🌊 Aruvi Deployment`);
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer}`);

  let wrapperAddress: string;

  if (existingWrapper) {
    console.log(`\n📦 Using existing ConfidentialUSDCWrapper: ${existingWrapper}`);
    wrapperAddress = existingWrapper;
  } else {
    console.log(`\n📦 Deploying ConfidentialUSDCWrapper...`);
    const wrapper = await deploy("ConfidentialUSDCWrapper", {
      from: deployer,
      args: [underlying, "Confidential USDC", "cUSDC", ""],
      log: true,
    });
    wrapperAddress = wrapper.address;
    console.log(`✅ ConfidentialUSDCWrapper deployed at: ${wrapperAddress}`);
  }

  console.log(`\n🚀 Deploying AruviPaymentGateway...`);
  const gateway = await deploy("AruviPaymentGateway", {
    from: deployer,
    args: [wrapperAddress],
    log: true,
  });

  console.log(`\n✅ Deployment Complete!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`ConfidentialUSDCWrapper: ${wrapperAddress}`);
  console.log(`AruviPaymentGateway:     ${gateway.address}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n🔑 Update frontend/src/lib/contracts.ts with these addresses`);
};

export default func;
func.tags = ["Aruvi"];
