const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const MintableToken = await hre.ethers.getContractFactory("MintableToken");
  const token = await MintableToken.deploy(hre.ethers.parseUnits("1000000", 18)); // 1M tokens

  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("MintableToken deployed to:", tokenAddress);

  // Get the ABI from the artifacts
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "MintableToken.sol", "MintableToken.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  
  // Create token-config.json
  const config = {
    token: {
      address: tokenAddress,
      abi: artifact.abi
    }
  };

  const configPath = path.join(__dirname, "..", "token-config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log("Token config saved to token-config.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
