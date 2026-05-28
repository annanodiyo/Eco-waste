const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy EcoToken
  const EcoToken = await ethers.getContractFactory("EcoToken");
  const ecoToken = await EcoToken.deploy();
  await ecoToken.waitForDeployment();
  console.log("EcoToken deployed to:", await ecoToken.getAddress());

  // 2. Deploy ProductRegistry
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy();
  await productRegistry.waitForDeployment();
  console.log("ProductRegistry deployed to:", await productRegistry.getAddress());

  // 3. Deploy WasteRegistry
  const WasteRegistry = await ethers.getContractFactory("WasteRegistry");
  const wasteRegistry = await WasteRegistry.deploy(
    await ecoToken.getAddress(),
    await productRegistry.getAddress()
  );
  await wasteRegistry.waitForDeployment();
  console.log("WasteRegistry deployed to:", await wasteRegistry.getAddress());

  // 4. Grant WasteRegistry MINTER_ROLE on EcoToken
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await ecoToken.grantRole(MINTER_ROLE, await wasteRegistry.getAddress());
  console.log("Granted MINTER_ROLE to WasteRegistry");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});