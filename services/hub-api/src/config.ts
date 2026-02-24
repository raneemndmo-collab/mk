import type { OperationMode, Brand } from "@mk/shared";

export const config = {
  port: parseInt(process.env.PORT_HUB_API ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  beds24: {
    apiUrl: process.env.BEDS24_API_URL ?? "https://api.beds24.com",
    refreshToken: process.env.BEDS24_REFRESH_TOKEN ?? "",
    webhookSecret: process.env.BEDS24_WEBHOOK_SECRET ?? "",
  },
  modes: {
    cobnb: (process.env.MODE_COBNB ?? "standalone") as OperationMode,
    monthlykey: (process.env.MODE_MONTHLYKEY ?? "standalone") as OperationMode,
    ops: (process.env.MODE_OPS ?? "standalone") as OperationMode,
  },
  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;

/** Check if a brand is in integrated mode (Beds24 connected). */
export function isIntegrated(brand: Brand): boolean {
  const key = brand === "COBNB" ? "cobnb" : "monthlykey";
  return config.modes[key] === "integrated";
}

/** Check if a brand is in standalone mode (local DB only). */
export function isStandalone(brand: Brand): boolean {
  return !isIntegrated(brand);
}
