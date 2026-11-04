import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://telos_user:telos_password@localhost:5432/telos",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "telos_development_secret_key_minimum_32_characters_long_123456",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
};
