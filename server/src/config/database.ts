import mongoose from "mongoose";
import { env } from "./env.js";

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) return true;

  try {
    mongoose.set("strictQuery", true);

    // Connect with 5-second timeout so server starts smoothly even if MongoDB is not yet running
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${sanitizeUri(env.MONGODB_URI)}`);
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn(
      `[Database] Notice: MongoDB connection unavailable (${error.message}). Running server in resilient mode.`
    );
    return false;
  }
}

mongoose.connection.on("connected", () => {
  isConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("[Database] MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  console.error("[Database] MongoDB error:", err.message);
});

export function getDatabaseStatus(): {
  status: "connected" | "connecting" | "disconnected";
  readyState: number;
  uri: string;
} {
  const state = mongoose.connection.readyState;
  let status: "connected" | "connecting" | "disconnected" = "disconnected";

  if (state === 1) status = "connected";
  else if (state === 2) status = "connecting";

  return {
    status,
    readyState: state,
    uri: sanitizeUri(env.MONGODB_URI),
  };
}

function sanitizeUri(uri: string): string {
  try {
    return uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  } catch {
    return "mongodb://[protected]";
  }
}
