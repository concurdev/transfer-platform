import mysql from "mysql2/promise";
import { Logger } from "../utils/logger";
import env from "./env";
import { GREEN_COLOR, RED_COLOR } from "../utils/constants";
import { colorMsg } from "../utils/helper";

class Database {
  private static instance: Database;
  private pool: mysql.Pool;
  private logger = Logger.getInstance();

  private constructor() {
    this.pool = mysql.createPool({
      host: env.database.host,
      user: env.database.user,
      password: env.database.password,
      database: env.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    this.pool
      .getConnection()
      .then((conn) => {
        conn.release();
        this.logger.info(colorMsg(`MySQL Connected Successfully`, GREEN_COLOR));
      })
      .catch((err) => {
        this.logger.error(colorMsg(`MySQL Connection Failed:  ${err.message}`, RED_COLOR));
      });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows as T;
    } finally {
      connection.release();
    }
  }

  public async getConnection() {
    return await this.pool.getConnection();
  }
}

export default Database;
