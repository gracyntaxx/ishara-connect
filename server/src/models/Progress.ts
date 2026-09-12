import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  sign: string;
  attempts: number;
  correctAttempts: number;
  bestScore: number;
  mastered: boolean;
  lastPracticedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sign: { type: String, required: true, trim: true },
    attempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    mastered: { type: Boolean, default: false },
    lastPracticedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound index so each user has one record per sign
ProgressSchema.index({ userId: 1, sign: 1 }, { unique: true });

export const Progress = mongoose.model<IProgress>("Progress", ProgressSchema);
