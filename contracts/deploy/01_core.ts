import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Deploys core contracts on Sepolia (or any network):
 * - ConfidentialUSDCWrapper (wraps an ERC20 into ERC7984)
 * - PaymentGateway (multi-tenant payment processor)
 * - ProductRegistry (merchant product catalog with FHE pricing)
 * - RefundManager (queued refunds with gateway ACL)
 *
 * Env vars (with defaults where noted):
 * UNDERLYING_ERC20_ADDRESS: required (Sepolia USDC default below)
 * WRAPPER_NAME: default "Confidential USDC"
 * WRAPPER_SYMBOL: default "cUSDC"
 * WRAPPER_URI: default "" (optional contract metadata URI)
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const underlying = process.env.UNDERLYING_ERC20_ADDRESS ?? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
  const name = process.env.WRAPPER_NAME ?? "Confidential USDC";
  const symbol = process.env.WRAPPER_SYMBOL ?? "cUSDC";
  const uri = process.env.WRAPPER_URI ?? "";

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer}`);
  console.log(`Underlying ERC20: ${underlying}`);

  const wrapper = await deploy("ConfidentialUSDCWrapper", {
    from: deployer,
    args: [underlying, name, symbol, uri],
    log: true,
  });

  const gateway = await deploy("PaymentGateway", {
    from: deployer,
    log: true,
  });

  const productRegistry = await deploy("ProductRegistry", {
    from: deployer,
    log: true,
  });

  const refundManager = await deploy("RefundManager", {
    from: deployer,
    args: [gateway.address],
    log: true,
  });

  // Set ProductRegistry in PaymentGateway
  const gatewayInstance = await ethers.getContractAt("PaymentGateway", gateway.address, await ethers.getSigner(deployer));
  const currentRegistry = await gatewayInstance.productRegistry();
  if (currentRegistry !== productRegistry.address) {
    const tx = await gatewayInstance.setProductRegistry(productRegistry.address);
    await tx.wait();
    console.log(`Set ProductRegistry in PaymentGateway: ${productRegistry.address}`);
  }

  // Set Gateway in ProductRegistry
  const registryInstance = await ethers.getContractAt("ProductRegistry", productRegistry.address, await ethers.getSigner(deployer));
  const currentGateway = await registryInstance.gateway();
  if (currentGateway !== gateway.address) {
    const tx = await registryInstance.setGateway(gateway.address);
    await tx.wait();
    console.log(`Set Gateway in ProductRegistry: ${gateway.address}`);
  }

  // Optional: register deployer as merchant for quick smoke tests
  const isRegistered = await gatewayInstance.merchants(deployer);
  if (!isRegistered) {
    const tx = await gatewayInstance.registerMerchant(deployer);
    await tx.wait();
    console.log(`Registered deployer as merchant: ${deployer}`);
  }

  console.log("Deployed:");
  console.log(`  ConfidentialUSDCWrapper: ${wrapper.address}`);
  console.log(`  PaymentGateway:          ${gateway.address}`);
  console.log(`  ProductRegistry:         ${productRegistry.address}`);
  console.log(`  RefundManager:           ${refundManager.address}`);
};
export default func;
func.id = "deploy_core";
func.tags = ["core", "gateway", "refund", "wrapper", "registry"];
