import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying ConfidentialUSDCWrapper with account:", deployer.address);

  const underlyingToken = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Circle USDC on Sepolia
  const name = "Confidential USDC";
  const symbol = "cUSDC";
  const uri = "";

  console.log("Underlying token:", underlyingToken);

  const Wrapper = await hre.ethers.getContractFactory("ConfidentialUSDCWrapper");
  const wrapper = await Wrapper.deploy(underlyingToken, name, symbol, uri);
  await wrapper.waitForDeployment();

  const address = await wrapper.getAddress();
  console.log("ConfidentialUSDCWrapper deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
