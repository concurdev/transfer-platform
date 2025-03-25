const { Wallet, keccak256, solidityPacked, toBeArray } = require("ethers");

const privateKey = "0x56051aae498262d6c3e1280bf42fc18acb77909b3642d7517130df4895a755b2";
const wallet = new Wallet(privateKey);

async function signMessage() {
  const sender = "0xf05249C12f02AA6B7D3A62AeC852AFFB19a6e3Fc";
  const recipient = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const amount = 10;

  // Create message hash
  const messageHash = keccak256(solidityPacked(["address", "address", "uint256"], [sender, recipient, amount]));

  // Convert hash to bytes array
  const messageBytes = toBeArray(messageHash);

  // Sign the message
  const signature = await wallet.signMessage(messageBytes);

  console.log("Generated Signature:", signature);
}

signMessage().catch(console.error);
