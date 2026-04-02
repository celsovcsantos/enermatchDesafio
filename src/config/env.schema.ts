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
  EIA_TIMEOUT_MS: z.coerce.number().default(30000),
  // Número máximo de tentativas para cada requisição HTTP à EIA (0 = sem retry)
  EIA_MAX_RETRIES: z.coerce.number().min(0).max(10).default(3),
  // Delay base em ms para backoff exponencial (delay * 2^tentativa)
  EIA_RETRY_DELAY_MS: z.coerce.number().min(100).default(1000),
  // Delay máximo em ms para evitar esperas excessivas
  EIA_RETRY_MAX_DELAY_MS: z.coerce.number().min(1000).default(30000),

  // Security
  STATIC_JWT_SECRET: z.string(),

  // Throttler
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(30),

  // Cron
  SYNC_CRON_EXPRESSION: z.string().default('0 * * * *'),
  // Número máximo de retentativas do Scheduler antes de desistir e esperar o próximo cron
  SYNC_MAX_RETRIES: z.coerce.number().min(0).max(10).default(3),
  // Delay base em ms entre retentativas do Scheduler (backoff exponencial)
  SYNC_RETRY_DELAY_MS: z.coerce.number().min(100).default(5000),
});

export type Env = z.infer<typeof envSchema>;
