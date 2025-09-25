// scripts/deploy.js
import fs from "fs";
import path from "path";
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...");

  // Get the contract factories
  const PaymentContract = await ethers.getContractFactory("PaymentContract");
  const Traceability = await ethers.getContractFactory("Traceability");
  const FarmerGovt = await ethers.getContractFactory("FarmerGovt");
  const GovtCustomer = await ethers.getContractFactory("GovtCustomer");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy contracts
  console.log("\n📦 Deploying PaymentContract...");
  const paymentContract = await PaymentContract.deploy(ethers.constants.AddressZero);
  await paymentContract.deployed();
  console.log("PaymentContract deployed to:", paymentContract.address);

  console.log("\n📦 Deploying Traceability...");
  const traceability = await Traceability.deploy(
    ethers.constants.AddressZero,
    ethers.constants.AddressZero
  );
  await traceability.deployed();
  console.log("Traceability deployed to:", traceability.address);

  console.log("\n📦 Deploying FarmerGovt...");
  const farmerGovt = await FarmerGovt.deploy();
  await farmerGovt.deployed();
  console.log("FarmerGovt deployed to:", farmerGovt.address);

  console.log("\n📦 Deploying GovtCustomer...");
  const govtCustomer = await GovtCustomer.deploy();
  await govtCustomer.deployed();
  console.log("GovtCustomer deployed to:", govtCustomer.address);

  // Update contract addresses
  console.log("\n🔗 Updating contract references...");
  await traceability.updateAuthorizedContracts(farmerGovt.address, govtCustomer.address);
  console.log("✅ Traceability contracts updated");

  await paymentContract.updateTraceabilityContract(traceability.address);
  console.log("✅ Payment contract traceability address updated");

  // Generate configuration file
  const config = {
    "31337": {
      payment: {
        address: paymentContract.address,
        abi: JSON.parse(paymentContract.interface.formatJson()),
      },
      traceability: {
        address: traceability.address,
        abi: JSON.parse(traceability.interface.formatJson()),
      },
      farmerGovt: {
        address: farmerGovt.address,
        abi: JSON.parse(farmerGovt.interface.formatJson()),
      },
      govtCustomer: {
        address: govtCustomer.address,
        abi: JSON.parse(govtCustomer.interface.formatJson()),
      },
    },
  };

  // Write config to file
  const configPath = path.resolve("./config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅ Configuration saved to config.json");

  // Deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=====================");
  console.log(`PaymentContract: ${paymentContract.address}`);
  console.log(`Traceability: ${traceability.address}`);
  console.log(`FarmerGovt: ${farmerGovt.address}`);
  console.log(`GovtCustomer: ${govtCustomer.address}`);
  console.log("\n📋 Next Steps:");
  console.log("1. Copy config.json into your frontend/public/");
  console.log("2. MetaMask settings →");
  console.log("   - RPC: http://127.0.0.1:8545");
  console.log("   - Chain ID: 31337");
  console.log("3. Import a Hardhat account private key into MetaMask");
  console.log("4. Start frontend (http://127.0.0.1:8000) and test MetaMask flow!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
