/**
 * Temporal smoothing — a prediction only becomes "stable" after it wins a
 * majority vote across the last N frames. This removes flicker between signs.
 */

import { SMOOTHING_MIN_VOTES, SMOOTHING_WINDOW, type SignLabel } from "@/lib/constants";

export type SmoothedResult = {
  label: SignLabel | null;
  confidence: number;
};

export class TemporalSmoother {
  private readonly window: number;
  private readonly minVotes: number;
  private frames: Array<{ label: SignLabel | null; confidence: number }> = [];
  private lastStable: SmoothedResult = { label: null, confidence: 0 };
  private staleCount = 0;

  constructor(window = SMOOTHING_WINDOW, minVotes = SMOOTHING_MIN_VOTES) {
    this.window = window;
    this.minVotes = minVotes;
  }

  push(label: SignLabel | null, confidence: number): SmoothedResult {
    this.frames.push({ label, confidence });
    if (this.frames.length > this.window) this.frames.shift();

    const votes = new Map<SignLabel, { count: number; total: number }>();
    for (const frame of this.frames) {
      if (!frame.label) continue;
      const entry = votes.get(frame.label) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += frame.confidence;
      votes.set(frame.label, entry);
    }

    let winner: SmoothedResult | null = null;
    for (const [vLabel, entry] of votes) {
      if (entry.count >= this.minVotes) {
        const avgConf = entry.total / entry.count;
        if (!winner || avgConf > winner.confidence) {
          winner = { label: vLabel, confidence: avgConf };
        }
      }
    }

    if (winner) {
      this.lastStable = winner;
      this.staleCount = 0;
      return winner;
    }

    // If no gesture reaches majority consensus inside the window,
    // allow a brief 2-frame grace period for transition, then decay to empty
    this.staleCount += 1;
    if (this.staleCount <= 2 && this.lastStable.label !== null) {
      return { label: this.lastStable.label, confidence: this.lastStable.confidence * 0.85 };
    }

    // Gesture stopped or was replaced by uncertain frames
    this.lastStable = { label: null, confidence: 0 };
    return { label: null, confidence: 0 };
  }

  reset(): void {
    this.frames = [];
    this.lastStable = { label: null, confidence: 0 };
    this.staleCount = 0;
  }
}
