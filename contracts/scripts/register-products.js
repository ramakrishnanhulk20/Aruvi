const hre = require("hardhat");

async function main() {
  const productRegistryAddress = "0x9523Bb7B1f1e3E773fc575Bc86f9b874C70B4D1D";
  
  const productRegistry = await hre.ethers.getContractAt("ProductRegistry", productRegistryAddress);
  
  const [merchant] = await hre.ethers.getSigners();
  console.log("\n=== Registering Products ===");
  console.log("Merchant:", merchant.address);
  console.log("ProductRegistry:", productRegistryAddress);
  
  // Coffee products with encrypted prices
  const products = [
    { name: "Classic Espresso", description: "Rich and bold espresso shot", type: 0, price: 5000000n }, // $5.00
    { name: "Creamy Cappuccino", description: "Espresso with steamed milk foam", type: 0, price: 6000000n }, // $6.00
    { name: "Cold Brew Coffee", description: "Smooth cold-brewed coffee", type: 0, price: 7000000n }  // $7.00
  ];
  
  const names = products.map(p => p.name);
  const descriptions = products.map(p => p.description);
  const types = products.map(p => p.type);
  const prices = products.map(p => p.price);
  
  console.log("\nProducts to register:");
  products.forEach((p, i) => {
    console.log(`  ${i}: ${p.name} - $${(Number(p.price) / 1000000).toFixed(2)}`);
  });
  
  const tx = await productRegistry.registerProductsBatch(names, descriptions, types, prices);
  console.log("\nTransaction hash:", tx.hash);
  await tx.wait();
  
  console.log("✓ Products registered successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
