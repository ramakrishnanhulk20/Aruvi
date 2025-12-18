import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MockUSDC with account:", deployer.address);

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const xusd = await MockUSDC.deploy();
  await xusd.waitForDeployment();

  const address = await xusd.getAddress();
  console.log("MockUSDC (XUSD) deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
