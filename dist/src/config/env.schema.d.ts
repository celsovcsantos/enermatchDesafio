import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_HOST: z.ZodString;
    DB_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_USERNAME: z.ZodString;
    DB_PASSWORD: z.ZodString;
    DB_DATABASE: z.ZodString;
    EIA_API_KEY: z.ZodString;
    EIA_BASE_URL: z.ZodDefault<z.ZodString>;
    EIA_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    STATIC_JWT_SECRET: z.ZodString;
    THROTTLE_TTL: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    THROTTLE_LIMIT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SYNC_CRON_EXPRESSION: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
