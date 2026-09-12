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
    // All 5 fingers extended AND fingers must be SPREAD WIDE APART.
    // Thumb must be abducted outward from index.
    label: "Hello",
    score: (f) => {
      const fourExt = (f.extension[1] + f.extension[2] + f.extension[3] + f.extension[4]) / 4;
      const thumbExt = f.extension[0];

      // If fingers are held close together, it is a flat hand (Thank You territory)
      if (f.spread < 0.38) {
        return 0.15 * fourExt;
      }

      const wideSpread = clamp01((f.spread - 0.35) / 0.35);
      const wideThumb = clamp01((f.thumbIndexGap - 0.22) / 0.35);

      return clamp01(
        0.35 * fourExt +
        0.15 * thumbExt +
        0.30 * wideSpread +
        0.20 * wideThumb
      );
    },
  },
  {
    // Thank You: flat B-hand — 4 fingers straight up and pressed close together.
    // Comes from chin outward. Key discriminator is fingers held TOGETHER (low spread).
    label: "Thank You",
    score: (f) => {
      const fourExt = (f.extension[1] + f.extension[2] + f.extension[3] + f.extension[4]) / 4;
      // Low spread: fingers are held parallel / close together
      const closeFingers = clamp01(1 - (f.spread / 0.42));
      const closeIndexMiddle = clamp01(1 - (f.indexMiddleGap / 0.25));
      // Thumb is not sticking out wide like a starfish
      const thumbNotWide = clamp01(1 - ((f.thumbIndexGap - 0.15) / 0.45));

      // If fingers are widely spread, it is Hello, not Thank You
      if (f.spread > 0.52) {
        return 0.2 * fourExt;
      }

      return clamp01(
        0.45 * fourExt +
        0.30 * closeFingers +
        0.15 * closeIndexMiddle +
        0.10 * thumbNotWide
      );
    },
  },
  {
    // Yes: S-hand — closed fist, everything curled tightly.
    label: "Yes",
    score: (f) => {
      const allCurled = fingers(f, [false, false, false, false, false]);
      const thumbOver = 1 - clamp01(f.thumbIndexGap / 0.3);
      return clamp01(0.7 * allCurled + 0.3 * thumbOver);
    },
  },
  {
    // No: index + middle out, close together — like scissors or a two-finger point.
    label: "No",
    score: (f) =>
      0.6 * fingers(f, [false, true, true, false, false]) +
      0.4 * near(f.indexMiddleGap, 0.12, 0.25),
  },
  {
    // Help: thumbs-up — only thumb extended, all other fingers tightly curled.
    label: "Help",
    score: (f) => {
      const thumbUp = f.extension[0];
      return clamp01(0.6 * thumbUp + 0.4 * (1 - (f.extension[1] + f.extension[2]) / 2));
    },
  },
  {
    // Good: index + middle up in a wide V shape, ring + pinky curled.
    label: "Good",
    score: (f) =>
      0.5 * fingers(f, [false, true, true, false, false]) +
      0.5 * near(f.indexMiddleGap, 0.6, 0.35),
  },
  {
    // Sorry: A-hand (fist) on chest — all fingers curled, thumb resting on side.
    label: "Sorry",
    score: (f) => {
      const allCurled = fingers(f, [false, false, false, false, false]);
      const thumbSide = clamp01(f.thumbIndexGap / 0.25);
      return clamp01(0.7 * allCurled + 0.3 * thumbSide);
    },
  },
  {
    // Please: OK / ring shape — thumb + index tip touching (small gap),
    // middle + ring + pinky extended.
    label: "Please",
    score: (f) =>
      0.55 * fingers(f, [true, true, true, true, true]) +
      0.45 * near(f.thumbIndexGap, 0.08, 0.22),
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
  }

  // Whichever hand has highest confidence
  if (pred1 && pred2) {
    return pred1.confidence >= pred2.confidence ? pred1 : pred2;
  }
  return pred1 || pred2 || null;
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
