import { Request, Response } from "express";
import { getDatabaseStatus } from "../config/database.js";

export function getHealth(req: Request, res: Response) {
  const db = getDatabaseStatus();

  res.json({
    success: true,
    data: {
      status: "ok",
      database: db.status,
      databaseReadyState: db.readyState,
      databaseUri: db.uri,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
}
