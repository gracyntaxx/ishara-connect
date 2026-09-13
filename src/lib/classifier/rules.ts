/**
 * Rule-based static sign classifier — improved discriminative rules.
 *
 * Key fixes (v2):
 *  - Hello requires HIGH spread (fingers fanned out wide), thumb also extended
 *  - Thank You requires ALL 4 non-thumb fingers extended BUT LOW spread (held together)
 *    AND thumb NOT fully extended (flat-B shape from chin outward)
 *  - Sorry: A-hand (fist) circular on chest — all fingers curled, thumb at side
 *  - Help: thumbs-up — thumb extended, all others curled
 *  - Yes: S-hand / fist — everything curled tightly
 *  - No: index + middle extended, close together (L or scissors shape)
 *  - Good: two fingers in wide V
 *  - Please: thumb-index ring (OK shape), others extended
 *
 * Each pair of easily confused signs now has a negative contribution from the
 * other sign's discriminating feature so they push apart in score space.
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
    // Hello: open 5-hand fanned out wide (wave / high-five).
    // All 5 fingers extended and spread apart.
    label: "Hello",
    score: (f) => {
      const fourExt = (f.extension[1] + f.extension[2] + f.extension[3] + f.extension[4]) / 4;
      const thumbExt = f.extension[0];
      const allExt = (fourExt * 4 + thumbExt) / 5;

      // Noticeable spread is essential for wave/hello vs flat hand
      const spreadScore = clamp01((f.spread - 0.22) / 0.35);
      const thumbOut = clamp01((f.thumbIndexGap - 0.18) / 0.32);

      // Penalize if fingers are pressed tight together (Thank You territory)
      const notTight = clamp01((f.spread - 0.12) / 0.20);

      return clamp01(
        0.40 * allExt +
        0.30 * spreadScore +
        0.15 * thumbOut +
        0.15 * notTight
      );
    },
  },
  {
    // Thank You: flat B-hand — 4 fingers straight up and pressed close together.
    // Comes from chin outward. Key discriminator is fingers held TOGETHER (low spread).
    label: "Thank You",
    score: (f) => {
      const fourExt = (f.extension[1] + f.extension[2] + f.extension[3] + f.extension[4]) / 4;
      // Low spread: fingers are held parallel and close together
      const closeFingers = clamp01(1 - (f.spread - 0.05) / 0.35);
      const closeIndexMiddle = clamp01(1 - f.indexMiddleGap / 0.22);
      // Thumb is relaxed or tucked near the palm, not stretched wide like a starfish
      const thumbNotStretched = clamp01(1 - (f.thumbIndexGap - 0.15) / 0.40);

      // If fingers are fanned wide, it is Hello or Bye, not Thank You
      if (f.spread > 0.48) {
        return 0.15 * fourExt;
      }

      return clamp01(
        0.50 * fourExt +
        0.25 * closeFingers +
        0.15 * closeIndexMiddle +
        0.10 * thumbNotStretched
      );
    },
  },
  {
    // Yes: S-hand — closed fist, thumb tucked tightly across the fingers.
    label: "Yes",
    score: (f) => {
      const allCurled = fingers(f, [false, false, false, false, false]);
      const thumbOver = clamp01(1 - f.thumbIndexGap / 0.22);
      return clamp01(0.70 * allCurled + 0.30 * thumbOver);
    },
  },
  {
    // No: index + middle extended together, close together (scissors / snapping down).
    label: "No",
    score: (f) => {
      const twoExt = (f.extension[1] + f.extension[2]) / 2;
      const othersCurled = ((1 - f.extension[3]) + (1 - f.extension[4])) / 2;
      const closeTogether = clamp01(1 - f.indexMiddleGap / 0.20);
      return clamp01(0.45 * twoExt + 0.35 * othersCurled + 0.20 * closeTogether);
    },
  },
  {
    // Good: universal thumbs-up! Only thumb extended, all other fingers curled tightly into fist.
    label: "Good",
    score: (f) => {
      const thumbUp = f.extension[0];
      const fourCurled =
        ((1 - f.extension[1]) + (1 - f.extension[2]) + (1 - f.extension[3]) + (1 - f.extension[4])) / 4;
      const thumbIsolated = clamp01((f.thumbIndexGap - 0.22) / 0.35);
      return clamp01(0.50 * thumbUp + 0.35 * fourCurled + 0.15 * thumbIsolated);
    },
  },
  {
    // Peace: index and middle extended in a clear, wide V shape. Ring and pinky curled.
    label: "Peace",
    score: (f) => {
      const twoUp = (f.extension[1] + f.extension[2]) / 2;
      const othersCurled = ((1 - f.extension[3]) + (1 - f.extension[4])) / 2;
      const wideV = clamp01((f.indexMiddleGap - 0.25) / 0.35);
      const thumbFolded = 1 - clamp01(f.extension[0] / 0.6);
      return clamp01(0.40 * twoUp + 0.30 * othersCurled + 0.20 * wideV + 0.10 * thumbFolded);
    },
  },
  {
    // Help: thumbs-up gesture (or compound dual hand).
    label: "Help",
    score: (f) => {
      const thumbUp = f.extension[0];
      const othersCurled = ((1 - f.extension[1]) + (1 - f.extension[2]) + (1 - f.extension[3])) / 3;
      return clamp01(0.55 * thumbUp + 0.45 * othersCurled);
    },
  },
  {
    // Sorry: A-hand (fist) with thumb resting alongside index finger.
    label: "Sorry",
    score: (f) => {
      const allCurled = fingers(f, [false, false, false, false, false]);
      const thumbSide = clamp01((f.thumbIndexGap - 0.10) / 0.25);
      return clamp01(0.70 * allCurled + 0.30 * thumbSide);
    },
  },
  {
    // Bye: open hand waving / high 5-hand.
    // All 5 fingers extended and spread, held up for wave.
    label: "Bye",
    score: (f) => {
      const allExt = fingers(f, [true, true, true, true, true]);
      const wideSpread = clamp01((f.spread - 0.25) / 0.35);
      return clamp01(0.55 * allExt + 0.45 * wideSpread);
    },
  },
  {
    // Please: OK / ring shape — thumb + index tip touching (small gap),
    // middle + ring + pinky extended.
    label: "Please",
    score: (f) => {
      const threeExt = (f.extension[2] + f.extension[3] + f.extension[4]) / 3;
      const ringTouching = clamp01(1 - f.thumbIndexGap / 0.15);
      return clamp01(0.55 * threeExt + 0.45 * ringTouching);
    },
  },
  {
    // I Love You (ILY): thumb, index, and pinky extended; middle and ring curled.
    label: "I Love You",
    score: (f) => {
      const thumbIndexPinky = (f.extension[0] + f.extension[1] + f.extension[4]) / 3;
      const middleRingCurled = ((1 - f.extension[2]) + (1 - f.extension[3])) / 2;
      return clamp01(0.55 * thumbIndexPinky + 0.45 * middleRingCurled);
    },
  },
  {
    // Understand: pointing index finger straight up (1-finger), all others curled.
    label: "Understand",
    score: (f) => {
      const indexUp = f.extension[1];
      const othersCurled =
        ((1 - f.extension[0]) + (1 - f.extension[2]) + (1 - f.extension[3]) + (1 - f.extension[4])) /
        4;
      return clamp01(0.60 * indexUp + 0.40 * othersCurled);
    },
  },
  {
    // Stop: flat open hand held upright with fingers close together (barrier).
    label: "Stop",
    score: (f) => {
      const fourExt = (f.extension[1] + f.extension[2] + f.extension[3] + f.extension[4]) / 4;
      const thumbExt = f.extension[0];
      const closeSpread = clamp01(1 - f.spread / 0.40);
      return clamp01(0.50 * fourExt + 0.25 * thumbExt + 0.25 * closeSpread);
    },
  },
  {
    // Friend: index and middle fingers crossed close together.
    label: "Friend",
    score: (f) => {
      const indexMiddleUp = (f.extension[1] + f.extension[2]) / 2;
      const crossed = clamp01(1 - Math.abs(f.indexMiddleGap - 0.05) / 0.15);
      const othersCurled = ((1 - f.extension[3]) + (1 - f.extension[4])) / 2;
      return clamp01(0.40 * indexMiddleUp + 0.40 * crossed + 0.20 * othersCurled);
    },
  },
  {
    // How Are You: open flat hand presenting forward toward camera.
    label: "How Are You",
    score: (f) => {
      const allExt = fingers(f, [true, true, true, true, true]);
      const modSpread = clamp01(1 - Math.abs(f.spread - 0.32) / 0.25);
      return clamp01(0.60 * allExt + 0.40 * modSpread);
    },
  },
  {
    // Welcome: flat hand sweeping inward toward body, palm tilted.
    label: "Welcome",
    score: (f) => {
      const fourExt = (f.extension[1] + f.extension[2] + f.extension[3] + f.extension[4]) / 4;
      const relaxedThumb = 1 - clamp01((f.thumbIndexGap - 0.20) / 0.40);
      const lowSpread = clamp01(1 - f.spread / 0.40);
      return clamp01(0.50 * fourExt + 0.25 * relaxedThumb + 0.25 * lowSpread);
    },
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

export function classifyMultiLandmarks(
  multiLandmarks: readonly (readonly Landmark[])[],
): Prediction | null {
  if (!multiLandmarks || multiLandmarks.length === 0) return null;

  if (multiLandmarks.length === 1) {
    return classifyLandmarks(multiLandmarks[0] ?? []);
  }

  // Two hands detected
  const hand1 = multiLandmarks[0];
  const hand2 = multiLandmarks[1];

  const feat1 = hand1 ? extractFeatures(hand1) : null;
  const feat2 = hand2 ? extractFeatures(hand2) : null;

  const pred1 = feat1 ? classifyFeatures(feat1) : null;
  const pred2 = feat2 ? classifyFeatures(feat2) : null;

  // Compound two-handed ASL rules
  if (feat1 && feat2) {
    // Help: one thumbs-up hand, other flat supporting base
    const h1ThumbsUp =
      feat1.extension[0] > 0.65 && feat1.extension[1] < 0.35 && feat1.extension[2] < 0.35;
    const h2Flat = feat2.extension[1] > 0.55 && feat2.extension[2] > 0.55 && feat2.extension[3] > 0.55;
    const h2ThumbsUp =
      feat2.extension[0] > 0.65 && feat2.extension[1] < 0.35 && feat2.extension[2] < 0.35;
    const h1Flat = feat1.extension[1] > 0.55 && feat1.extension[2] > 0.55 && feat1.extension[3] > 0.55;

    if ((h1ThumbsUp && h2Flat) || (h2ThumbsUp && h1Flat)) {
      return { label: "Help", confidence: 0.94 };
    }

    // Both hands wide open with high spread: emphatic Hello (wave)
    const bothWideOpen =
      feat1.extension.every((e) => e > 0.55) &&
      feat2.extension.every((e) => e > 0.55) &&
      feat1.spread > 0.35 &&
      feat2.spread > 0.35;
    if (bothWideOpen) {
      return { label: "Hello", confidence: 0.95 };
    }

    // Both hands flat together with LOW spread: Thank You (two-handed emphatic version)
    const bothFlatLowSpread =
      feat1.extension.slice(1).every((e) => e > 0.6) &&
      feat2.extension.slice(1).every((e) => e > 0.6) &&
      feat1.spread < 0.4 &&
      feat2.spread < 0.4;
    if (bothFlatLowSpread) {
      return { label: "Thank You", confidence: 0.93 };
    }

    // Both hands held forward open: "How Are You"
    const bothHeldForward =
      feat1.extension.every((e) => e > 0.45) &&
      feat2.extension.every((e) => e > 0.45) &&
      Math.abs(feat1.spread - 0.35) < 0.2 &&
      Math.abs(feat2.spread - 0.35) < 0.2;
    if (bothHeldForward) {
      return { label: "How Are You", confidence: 0.92 };
    }

    // Both hands in I Love You: double affection
    const h1ILY = feat1.extension[0] > 0.6 && feat1.extension[1] > 0.6 && feat1.extension[4] > 0.6 && feat1.extension[2] < 0.35 && feat1.extension[3] < 0.35;
    const h2ILY = feat2.extension[0] > 0.6 && feat2.extension[1] > 0.6 && feat2.extension[4] > 0.6 && feat2.extension[2] < 0.35 && feat2.extension[3] < 0.35;
    if (h1ILY || h2ILY) {
      return { label: "I Love You", confidence: 0.96 };
    }
  }

  // Whichever hand has highest confidence
  if (pred1 && pred2) {
    return pred1.confidence >= pred2.confidence ? pred1 : pred2;
  }
  return pred1 || pred2 || null;
}

export function classifyFeatures(features: HandFeatures): Prediction | null {
  const candidates: Array<{ label: SignLabel; confidence: number }> = [];

  for (const rule of ACTIVE_RULES) {
    const confidence = clamp01(rule.score(features));
    if (confidence > 0.35) {
      candidates.push({ label: rule.label, confidence });
    }
  }

  if (candidates.length === 0) return null;

  // Sort descending by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0]!;

  // Disambiguation check: if top two are neck-and-neck, dampen confidence slightly
  // so the user must hold the gesture more cleanly
  if (candidates.length > 1) {
    const runnerUp = candidates[1]!;
    const margin = best.confidence - runnerUp.confidence;
    if (margin < 0.07 && best.confidence < 0.85) {
      return {
        label: best.label,
        confidence: Math.max(0, best.confidence - 0.10),
      };
    }
  }

  return best;
}
