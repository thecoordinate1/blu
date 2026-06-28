import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Google Gemini
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MOCK: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // WhatsApp (self-hosted gateway)
  WHATSAPP_API_KEY: z.string().optional(),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),

  // Lenco Payments
  LENCO_SECRET_KEY: z.string().default(''),
  LENCO_WEBHOOK_SECRET: z.string().default(''),

  // Sentry (optional)
  SENTRY_DSN: z.string().default(''),

  // Server
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3001'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('❌ Environment validation failed:\n' + formatted);
    throw new Error('Missing or invalid environment variables. See log above.');
  }

  return result.data;
}

/**
 * Validated environment singleton — crashes the process at startup
 * if any required var is missing rather than failing silently at runtime.
 */
export const env = loadEnv();
