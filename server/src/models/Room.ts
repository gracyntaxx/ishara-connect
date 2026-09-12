import mongoose, { Schema, Document } from "mongoose";

export interface IRoomParticipant {
  userId?: string;
  displayName: string;
  role: "host" | "participant";
  joinedAt: Date;
}

export interface IRoom extends Document {
  roomId: string;
  hostName: string;
  engine: "zego" | "p2p";
  status: "active" | "ended";
  participants: IRoomParticipant[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, unique: true, uppercase: true, index: true },
    hostName: { type: String, required: true, default: "Host" },
    engine: { type: String, enum: ["zego", "p2p"], default: "zego" },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    participants: [
      {
        userId: { type: String },
        displayName: { type: String, required: true },
        role: { type: String, enum: ["host", "participant"], default: "participant" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

export const Room = mongoose.model<IRoom>("Room", RoomSchema);
