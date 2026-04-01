import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),

  // EIA API
  EIA_API_KEY: z.string(),
  EIA_BASE_URL: z.string().url().default('https://api.eia.gov/v2'),
  EIA_TIMEOUT_MS: z.coerce.number().default(10000),

  // Security
  STATIC_JWT_SECRET: z.string(),

  // Throttler
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(30),

  // Cron
  SYNC_CRON_EXPRESSION: z.string().default('0 * * * *'),
});

export type Env = z.infer<typeof envSchema>;
