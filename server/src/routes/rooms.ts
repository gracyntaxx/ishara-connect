import { Router, Request, Response } from "express";
import { Room } from "../models/Room.js";

export const roomsRouter = Router();

// Helper to generate a 6-character room ID
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/rooms
roomsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { displayName, engine = "zego" } = req.body;
    const roomId = generateRoomCode();

    const room = await Room.create({
      roomId,
      hostName: displayName || "Host",
      engine,
      participants: [
        {
          displayName: displayName || "Host",
          role: "host",
          joinedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        roomId: room.roomId,
        engine: room.engine,
        expiresAt: room.expiresAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to create room" });
  }
});

// GET /api/rooms/:roomId
roomsRouter.get("/:roomId", async (req: Request, res: Response): Promise<void> => {
  try {
    const roomId = String(req.params.roomId).toUpperCase();
    const room = await Room.findOne({ roomId });
    if (!room) {
      res.status(404).json({ success: false, message: "Room not found or expired" });
      return;
    }

    res.json({
      success: true,
      data: {
        roomId: room.roomId,
        hostName: room.hostName,
        engine: room.engine,
        status: room.status,
        participants: room.participants,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rooms/:roomId/join
roomsRouter.post("/:roomId/join", async (req: Request, res: Response): Promise<void> => {
  try {
    const { displayName } = req.body;
    const roomId = String(req.params.roomId).toUpperCase();
    const room = await Room.findOne({ roomId });
    if (!room) {
      res.status(404).json({ success: false, message: "Room not found or expired" });
      return;
    }

    room.participants.push({
      displayName: displayName || "Guest",
      role: "participant",
      joinedAt: new Date(),
    });
    await room.save();

    res.json({
      success: true,
      data: {
        roomId: room.roomId,
        status: "joined",
        engine: room.engine,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
