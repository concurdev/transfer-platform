import { RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from "uuid";
import RedisClient from "../config/redis";
import Database from "../config/db";
import Signature from "../utils/signature";
import { Logger } from "../utils/logger";

class TransferService {
  private redis = RedisClient.getInstance().getClient();
  private db = Database.getInstance();
  private logger = Logger.getInstance();

  public async processTransfer(transferData: {
    sender?: string;
    recipient?: string;
    token?: { amount?: any };
    signature?: string;
    refund?: {
      chainId: number;
      tx: string;
      signedTx: string;
    };
  }) {
    if (!transferData.sender || !transferData.recipient || !transferData.token?.amount || !transferData.signature) {
      this.logger.error("Invalid request: sender, recipient, token.amount, and signature are required.");
      throw new Error("Invalid request: sender, recipient, token.amount, and signature are required.");
    }

    const { sender, recipient, token, signature, refund } = transferData;
    const amount = Number(token.amount);

    if (isNaN(amount) || amount <= 0) {
      this.logger.error("Invalid token amount.");
      throw new Error("Invalid token amount.");
    }

    // Verify signature
    const isValidSignature = Signature.verifySignature({ sender, recipient, amount }, signature, sender);
    if (!isValidSignature) {
      this.logger.error("Signature verification failed.");
      throw new Error("Invalid signature.");
    }

    const userKey = `lock:${sender}`;
    this.logger.info(`Checking lock for user: ${sender} (key: ${userKey})`);

    // Check if the sender is already processing a transfer
    const isLocked = await this.redis.get(userKey);
    if (isLocked) {
      this.logger.warn(`Transfer already in progress for user: ${sender}`);
      throw new Error("Transfer already in progress for this user.");
    }

    // Lock the sender for concurrency control
    this.logger.info(`Setting lock for user: ${sender} (key: ${userKey})`);
    await this.redis.set(userKey, "locked", { EX: 60 });

    const connection = await this.db.getConnection();
    await connection.beginTransaction();

    try {
      // Fetch sender's balance
      const [senderBalanceResult] = await connection.query<RowDataPacket[]>("SELECT balance FROM user_balances WHERE user_address = ?", [sender]);

      if (senderBalanceResult.length === 0) {
        throw new Error("Sender not found.");
      }

      const senderBalance = senderBalanceResult[0].balance;
      if (senderBalance < amount) {
        throw new Error("Insufficient balance.");
      }

      // Fetch recipient's balance (ensure recipient exists), follow README.md to understand how to do that
      const [recipientBalanceResult] = await connection.query<RowDataPacket[]>("SELECT balance FROM user_balances WHERE user_address = ?", [
        recipient,
      ]);

      if (recipientBalanceResult.length === 0) {
        throw new Error("Recipient not found.");
      }

      // Deduct balance from sender
      await connection.query("UPDATE user_balances SET balance = balance - ? WHERE user_address = ?", [amount, sender]);

      // Add balance to recipient
      await connection.query("UPDATE user_balances SET balance = balance + ? WHERE user_address = ?", [amount, recipient]);

      // Insert transfer record
      const transferId = uuidv4();
      await connection.query("INSERT INTO transfers (transfer_id, sender_address, recipient_address, amount, status) VALUES (?, ?, ?, ?, ?)", [
        transferId,
        sender,
        recipient,
        amount,
        "pending",
      ]);

      await connection.commit();

      this.logger.info(`Transfer executed successfully from ${sender} to ${recipient} (amount: ${amount})`);

      // Trigger refund operation after successful transfer
      if (refund) {
        await this.executeRefund(refund, transferId);
      }

      return { success: true, message: "Transfer executed", transferId };
    } catch (error) {
      await connection.rollback();
      this.logger.error(`Transfer failed: ${(error as Error).message}`);
      throw new Error("Transfer failed. Please try again.");
    } finally {
      // Release the lock
      this.logger.info(`Releasing lock for user: ${sender} (key: ${userKey})`);
      await this.redis.del(userKey);
      connection.release();
    }
  }

  private async executeRefund(refund: { chainId: number; tx: string; signedTx: string }, transferId: string) {
    this.logger.info(`Initiating refund for transferId: ${transferId} with refund data: ${JSON.stringify(refund)}`);

    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      // Fetch the solver's balance
      const [solverBalanceResult] = await connection.query<RowDataPacket[]>("SELECT balance FROM solver_balances WHERE chain_id = ?", [
        refund.chainId,
      ]);

      if (solverBalanceResult.length === 0) {
        this.logger.error(`Solver not found for chainId: ${refund.chainId}`);
        // Optionally create a new solver if not found:
        await connection.query(
          "INSERT INTO solver_balances (chain_id, balance) VALUES (?, ?)",
          [refund.chainId, 0] // Creating solver with balance 0
        );
        // Alternatively, handle as an error if the solver must exist:
        throw new Error("Solver not found.");
      }

      const solverBalance = solverBalanceResult[0].balance;

      // Update solver's balance after refund
      await connection.query("UPDATE solver_balances SET balance = balance + ? WHERE chain_id = ?", [0, refund.chainId]); // Assuming you do not add the `tx` string into the balance

      // Log or process the transaction hash (tx) and signedTx as necessary
      await connection.query(
        "INSERT INTO refunds (transfer_id, chain_id, tx, signed_tx) VALUES (?, ?, ?, ?)",
        [transferId, refund.chainId, refund.tx, refund.signedTx] // Store tx and signedTx as strings in the refunds table
      );

      await connection.commit();

      this.logger.info(`Refund for transferId: ${transferId} processed successfully.`);
    } catch (error) {
      await connection.rollback();
      this.logger.error(`Refund failed for transferId: ${transferId}, Error: ${(error as Error).message}`);
      throw new Error("Refund failed. Please try again.");
    } finally {
      connection.release();
    }
  }
}

export default TransferService;
