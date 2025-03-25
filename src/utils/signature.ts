import { keccak256, recoverAddress, solidityPacked } from "ethers";
import { Logger } from "../utils/logger";

class Signature {
  static verifySignature(data: { sender: string; recipient: string; amount: number }, signature: string, expectedAddress: string): boolean {
    const logger = Logger.getInstance();

    try {
      // encode and hash the message
      const messageHash = keccak256(solidityPacked(["address", "address", "uint256"], [data.sender, data.recipient, data.amount]));

      // Hash must be prefixed with Ethereum signed message
      const ethSignedMessageHash = keccak256(solidityPacked(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", messageHash]));

      // Recover the signer's address
      const recoveredAddress = recoverAddress(ethSignedMessageHash, signature);

      // Log the expected and recovered addresses
      logger.info(`Expected Address: ${expectedAddress}`);
      logger.info(`Recovered Address: ${recoveredAddress}`);

      // Return whether the recovered address matches the expected address
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      logger.error("Signature verification failed:", error);
      return false;
    }
  }
}

export default Signature;
