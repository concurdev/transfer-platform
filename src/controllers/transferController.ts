import TransferService from "../services/transferService";

import { Request, Response, RequestHandler } from "express";
import RedisClient from "../config/redis";
import Database from "../config/db";
import { Logger } from "../utils/logger";

const redis = RedisClient.getInstance().getClient();
const db = Database.getInstance();
const logger = Logger.getInstance();

const transferService = new TransferService();

export async function transferHandler(req: Request, res: Response) {
  try {
    const result = await transferService.processTransfer(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}

export const checkTransferStatus: RequestHandler = async (req, res): Promise<void> => {
  const { transferId } = req.params;

  try {
    // First, check in Redis cache
    let status = await redis.get(`transfer:${transferId}`);

    logger.info(`Checking status for transferId: ${transferId}`);

    if (!status) {
      // If not found in Redis, fetch from MySQL
      const [rows]: any = await db.query("SELECT status FROM transfers WHERE transfer_id = ?", [transferId]);

      logger.info("MySQL Query Result:", rows);

      // Ensure rows is always treated as an array
      const data = Array.isArray(rows) ? rows : [rows];

      if (!data || data.length === 0) {
        res.status(404).json({ error: "Transfer not found." });
        return;
      }

      // Extract status value safely
      status = data[0]?.status;

      logger.info(`Fetched status from MySQL: ${status}`);

      if (!status) {
        res.status(500).json({ error: "Invalid transfer status." });
        return;
      }

      // Store in Redis for faster future access (cache for 10 minutes)
      await redis.set(`transfer:${transferId}`, status, { EX: 600 });
    } else {
      logger.info(`Fetched status from Redis: ${status}`);
    }

    res.json({ transferId, status });
  } catch (error) {
    logger.error(`Error fetching transfer status: ${error}`);
    res.status(500).json({ error: "Failed to fetch transfer status." });
  }
};
