import { Router, Request, Response } from "express";
import { User } from "../models/User.js";

export const badgesRouter = Router();

export const SYSTEM_BADGES = [
  { key: "first_sign", name: "First Sign", description: "Successfully performed your first recognized sign" },
  { key: "streak_3", name: "3-Day Streak", description: "Practiced signs three days in a row" },
  { key: "master_5", name: "Sign Expert", description: "Mastered 5 or more signs with 85%+ accuracy" },
  { key: "call_veteran", name: "Call Connect", description: "Completed your first 1-on-1 accessible video call" },
  { key: "century_club", name: "Century Club", description: "Completed 100 practice repetitions" },
];

badgesRouter.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: SYSTEM_BADGES,
  });
});

badgesRouter.get("/me", async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
  });
});
