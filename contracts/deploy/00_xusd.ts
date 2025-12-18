import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Deploys XUSD mock token (6 decimals) with 10-token-per-call mint cap.
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer}`);

  const xusd = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("Deployed XUSD (MockUSDC):", xusd.address);
};

export default func;
func.id = "deploy_xusd";
func.tags = ["xusd", "mock", "token"];
