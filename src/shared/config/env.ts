import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_URL_UNPOOLED: z.string().min(1, "DATABASE_URL_UNPOOLED cannot be empty").optional(),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

const nodeEnv = (process.env.NODE_ENV as Env["NODE_ENV"] | undefined) ?? "development";
const isProduction = nodeEnv === "production";

const parsedEnv = envSchema.safeParse({
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (isProduction ? undefined : "postgresql://telos_user:telos_password@localhost:5432/telos"),
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || undefined,
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    (isProduction ? undefined : "telos_development_secret_key_minimum_32_characters_long_123456"),
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL ??
    (isProduction ? undefined : "http://localhost:3000"),
  NODE_ENV: nodeEnv,
  PORT: process.env.PORT,
});

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env: Env = parsedEnv.data;
