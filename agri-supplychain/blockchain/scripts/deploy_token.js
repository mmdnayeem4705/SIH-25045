const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const FakeToken = await hre.ethers.getContractFactory("FakeToken");
  const token = await FakeToken.deploy(hre.ethers.parseUnits("1000000", 18)); // 1M tokens

  await token.waitForDeployment();

  console.log("FakeToken deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
