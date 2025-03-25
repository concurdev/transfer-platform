import dotenv from "dotenv";

dotenv.config();

export function requireEnv(name: string, defaultVal?: string): string {
  const envValue = process.env[name];
  if (!envValue) {
    if (defaultVal !== undefined) return defaultVal;
    throw new Error(`CONFIG.REQUIRED_VAR_NOT_SET: ${name}`);
  }
  return envValue;
}

export function requireIntEnv(name: string, defaultVal?: number): number {
  const defaultStr = defaultVal !== undefined ? defaultVal.toString() : undefined;
  const valueStr = requireEnv(name, defaultStr);
  const value = Number(valueStr);
  if (!Number.isInteger(value)) {
    throw new Error(`CONFIG.VALUE_NOT_AN_INT: ${name}: ${valueStr}`);
  }
  return value;
}

const config = {
  server: {
    port: requireIntEnv("PORT"),
    url: `http://${requireEnv("SERVER_IP")}:${requireIntEnv("PORT")}`,
  },
  database: {
    host: requireEnv("DB_HOST"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    name: requireEnv("DB_NAME"),
    connectionLimit: requireIntEnv("DB_CONNECTION_LIMIT", 10),
  },
  redis: {
    url: requireEnv("REDIS_URL"),
  },
};

export default config;
