import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Progress } from "../models/Progress.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

export const progressRouter = Router();

// Middleware to extract user if token exists
async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// POST /api/progress
progressRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req);
    const { sign, score, correct } = req.body;

    if (!sign) {
      res.status(400).json({ success: false, message: "Sign is required" });
      return;
    }

    if (!userId) {
      // Guest mode — acknowledged without DB error
      res.json({
        success: true,
        data: { sign, score, correct, mode: "guest" },
      });
      return;
    }

    const record = await Progress.findOneAndUpdate(
      { userId, sign },
      {
        $inc: {
          attempts: 1,
          correctAttempts: correct ? 1 : 0,
        },
        $max: { bestScore: score || 0 },
        $set: {
          lastPracticedAt: new Date(),
          mastered: Boolean(score && score >= 0.85),
        },
      },
      { upsert: true, new: true },
    );

    // Update user summary stats
    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.totalSessions": 1, "stats.signsPracticed": 1 },
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/progress
progressRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      res.json({ success: true, data: [] });
      return;
    }

    const records = await Progress.find({ userId });
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
