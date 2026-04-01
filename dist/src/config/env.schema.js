"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DB_HOST: zod_1.z.string(),
    DB_PORT: zod_1.z.coerce.number().default(5432),
    DB_USERNAME: zod_1.z.string(),
    DB_PASSWORD: zod_1.z.string(),
    DB_DATABASE: zod_1.z.string(),
    EIA_API_KEY: zod_1.z.string(),
    EIA_BASE_URL: zod_1.z.string().url().default('https://api.eia.gov/v2'),
    EIA_TIMEOUT_MS: zod_1.z.coerce.number().default(10000),
    STATIC_JWT_SECRET: zod_1.z.string(),
    THROTTLE_TTL: zod_1.z.coerce.number().default(60),
    THROTTLE_LIMIT: zod_1.z.coerce.number().default(30),
    SYNC_CRON_EXPRESSION: zod_1.z.string().default('0 * * * *'),
});
//# sourceMappingURL=env.schema.js.map