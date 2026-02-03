const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const cfgPath = path.join(__dirname, '..', 'token-config.json');
  if (!fs.existsSync(cfgPath)) throw new Error('token-config.json not found. Deploy token first.');
  const cfg = JSON.parse(fs.readFileSync(cfgPath));
  const tokenAddr = cfg.token.address;
  const tokenAbi = cfg.token.abi;

  const [sender] = await hre.ethers.getSigners();
  console.log('Using signer:', sender.address);

  const token = await hre.ethers.getContractAt(tokenAbi, tokenAddr);

  const recipient = process.env.RECIPIENT || '0xE07E825A8099d38c6f98B4c79f7B40bF8A9D57EE';
  const amount = process.env.AMOUNT || '1000';

  const units = hre.ethers.parseUnits ? hre.ethers.parseUnits(amount, 18) : hre.ethers.utils.parseUnits(amount, 18);

  console.log(`Transferring ${amount} tokens to ${recipient} ...`);
  const tx = await token.connect(sender).transfer(recipient, units);
  console.log(' tx hash:', tx.hash);
  await tx.wait();

  const bal = await token.balanceOf(recipient);
  const fmt = hre.ethers.formatUnits ? hre.ethers.formatUnits(bal, 18) : hre.ethers.utils.formatUnits(bal, 18);
  console.log(' recipient balance:', fmt);
}

main().catch(e => { console.error(e); process.exit(1); });