import mongoose, { Schema, Document } from "mongoose";

export interface IUserBadge {
  badgeKey: string;
  earnedAt: Date;
}

export interface IUserStats {
  totalSessions: number;
  totalPracticeTimeMs: number;
  signsPracticed: number;
  overallAccuracy: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  role: "user" | "admin" | "guest";
  badges: IUserBadge[];
  stats: IUserStats;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ["user", "admin", "guest"], default: "user" },
    badges: [
      {
        badgeKey: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    stats: {
      totalSessions: { type: Number, default: 0 },
      totalPracticeTimeMs: { type: Number, default: 0 },
      signsPracticed: { type: Number, default: 0 },
      overallAccuracy: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
