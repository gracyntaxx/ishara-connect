/**
 * Rule-based static sign classifier.
 * Each rule scores the extracted hand features between 0 and 1.
 * No model download, no network calls, fully deterministic and testable.
 */

import { SUPPORTED_SIGNS, type SignLabel } from "@/lib/constants";
import { clamp01, extractFeatures, type HandFeatures, type Landmark } from "./landmarks";

export type Prediction = { label: SignLabel; confidence: number };

/** How well a 0..1 extension score matches the desired open/closed state. */
function match(extension: number, wantOpen: boolean): number {
  return wantOpen ? extension : 1 - extension;
}

/** Soft "value is near target" score, falling off over `tolerance`. */
function near(value: number, target: number, tolerance: number): number {
  return clamp01(1 - Math.abs(value - target) / tolerance);
}

function fingers(f: HandFeatures, want: [boolean, boolean, boolean, boolean, boolean]): number {
  let total = 0;
  for (let i = 0; i < 5; i += 1) {
    total += match(f.extension[i] ?? 0, want[i] ?? false);
  }
  return total / 5;
}

type Rule = { label: SignLabel; score: (f: HandFeatures) => number };

const RULES: Rule[] = [
  {
    label: "Hello",
    score: (f) => 0.7 * fingers(f, [true, true, true, true, true]) + 0.3 * f.spread,
  },
  {
    label: "Thank You",
    score: (f) => 0.65 * fingers(f, [false, true, true, true, true]) + 0.35 * (1 - f.spread),
  },
  {
    label: "Yes",
    score: (f) => fingers(f, [false, false, false, false, false]),
  },
  {
    label: "No",
    score: (f) =>
      0.65 * fingers(f, [false, true, true, false, false]) +
      0.35 * near(f.indexMiddleGap, 0.15, 0.35),
  },
  {
    label: "Help",
    score: (f) => fingers(f, [true, false, false, false, false]),
  },
  {
    label: "Good",
    score: (f) =>
      0.65 * fingers(f, [false, true, true, false, false]) +
      0.35 * near(f.indexMiddleGap, 0.75, 0.5),
  },
  {
    label: "Sorry",
    score: (f) => fingers(f, [true, false, false, false, true]),
  },
  {
    label: "Please",
    score: (f) =>
      0.6 * fingers(f, [true, true, true, true, true]) + 0.4 * near(f.thumbIndexGap, 0.1, 0.35),
  },
];

/** Rules are ordered by the configured vocabulary so the UI stays in sync. */
export const ACTIVE_RULES: Rule[] = SUPPORTED_SIGNS.map((label) =>
  RULES.find((rule) => rule.label === label),
).filter((rule): rule is Rule => Boolean(rule));

export function classifyLandmarks(landmarks: readonly Landmark[]): Prediction | null {
  const features = extractFeatures(landmarks);
  if (!features) return null;
  return classifyFeatures(features);
}

export function classifyFeatures(features: HandFeatures): Prediction | null {
  let best: Prediction | null = null;
  for (const rule of ACTIVE_RULES) {
    const confidence = clamp01(rule.score(features));
    if (!best || confidence > best.confidence) {
      best = { label: rule.label, confidence };
    }
  }
  return best;
}
