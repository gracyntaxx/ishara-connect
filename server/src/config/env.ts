import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/ishara"),
  JWT_SECRET: z.string().default("ishara-dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ROOM_EXPIRATION_MINUTES: z.coerce.number().default(120),
  ZEGO_APP_ID: z.coerce.number().optional(),
  ZEGO_SERVER_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
