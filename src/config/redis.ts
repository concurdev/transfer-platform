import { createClient } from "redis";
import env from "./env";
import { Logger } from "../utils/logger";
import { RED_COLOR, GREEN_COLOR } from "../utils/constants";
import { colorMsg } from "../utils/helper";

class RedisClient {
  private static instance: RedisClient;
  private client: ReturnType<typeof createClient>;
  private logger = Logger.getInstance();

  private constructor() {
    this.client = createClient({ url: env.redis.url });

    this.client.on("error", (err) => {
      this.logger.error(colorMsg(`Redis Error: ${err}`, RED_COLOR));
    });

    this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.client.connect();
        this.logger.info(colorMsg(`Redis Connected Successfully`, GREEN_COLOR));
        return;
      } catch (error) {
        this.logger.error(colorMsg(`Redis Connection Failed (Attempt ${i + 1}), ${error}`, RED_COLOR));
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
    throw new Error("Redis failed to connect after multiple attempts.");
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient() {
    return this.client;
  }
}

export default RedisClient;
