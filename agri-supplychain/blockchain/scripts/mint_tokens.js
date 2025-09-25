// scripts/mint_tokens.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const cfgPath = path.join(__dirname, "..", "token-config.json");
  if (!fs.existsSync(cfgPath)) throw new Error("token-config.json not found. Run deploy script first.");
  const cfg = JSON.parse(fs.readFileSync(cfgPath));
  const tokenAddr = cfg.token.address;
  const tokenAbi = cfg.token.abi;

  const token = await hre.ethers.getContractAt(tokenAbi, tokenAddr);
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using deployer:", deployer.address);

  // Addresses to credit (replace or use your three)
  const recipients = [
    "0x012E509cd6218Cf74f5D1b64Fb8157baf98E0488",
    "0x3AF59d25Bf2046bca7e44F93f976969090907d84",
    "0xD9ee66274d660b38C17586Fa3c4b4B7032306474"
  ];

  // Amount (in token decimals). We'll mint 1,000,000 AGT to each if token decimals = 18
  const amount = hre.ethers.parseUnits ? hre.ethers.parseUnits("1000000", 18) : hre.ethers.utils.parseUnits("1000000", 18);

  for (const r of recipients) {
    console.log(`Minting to ${r} ...`);
    const tx = await token.connect(deployer).mint(r, amount);
    console.log(" tx:", tx.hash);
    await tx.wait();
    const bal = await token.balanceOf(r);
    console.log(" new token balance:", hre.ethers.formatUnits ? hre.ethers.formatUnits(bal, 18) : hre.ethers.utils.formatUnits(bal, 18));
  }

  console.log("Done.");
}

main().catch(e => { console.error(e); process.exit(1); });
