const hre = require("hardhat");

async function main() {
  const wrapperAddress = "0x8eCf5221D8a4E50c48b27860A47Bd814631d22Fe";
  
  const wrapper = await hre.ethers.getContractAt("ConfidentialUSDCWrapper", wrapperAddress);
  
  const underlyingAddress = await wrapper.underlying();
  const name = await wrapper.name();
  const symbol = await wrapper.symbol();
  const decimals = await wrapper.decimals();
  
  console.log("\n=== Wrapper Contract Info ===");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Underlying Token:", underlyingAddress);
  console.log("\n=== Expected ===");
  console.log("Expected Underlying: 0xC392ceE2b731A6a719BAd5205B9Cb44F346F012a");
  console.log("Match:", underlyingAddress.toLowerCase() === "0xC392ceE2b731A6a719BAd5205B9Cb44F346F012a".toLowerCase() ? "✓ YES" : "✗ NO - MISMATCH!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
