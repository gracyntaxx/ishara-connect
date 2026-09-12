import { useEffect, useMemo, useRef, useState } from "react";

import { classifyLandmarks } from "@/lib/classifier/rules";
import { TemporalSmoother } from "@/lib/classifier/smoothing";
import type { Landmark } from "@/lib/classifier/landmarks";
import { CONFIDENCE_THRESHOLD, type SignLabel } from "@/lib/constants";

export type ClassifierState = {
  /** Raw per-frame guess, before smoothing. */
  raw: { label: SignLabel; confidence: number } | null;
  /** Stable prediction after majority-vote smoothing. */
  stable: SignLabel | null;
  confidence: number;
  lowConfidence: boolean;
  handDetected: boolean;
};

/**
 * Turns a stream of hand landmarks into a stable sign prediction:
 * classify → confidence gate → temporal smoothing.
 */
export function useLocalClassifier(landmarks: Landmark[] | null): ClassifierState {
  const smoother = useMemo(() => new TemporalSmoother(), []);
  const [state, setState] = useState<ClassifierState>({
    raw: null,
    stable: null,
    confidence: 0,
    lowConfidence: false,
    handDetected: false,
  });
  const idleFrames = useRef(0);

  useEffect(() => {
    if (!landmarks) {
      idleFrames.current += 1;
      if (idleFrames.current > 12) smoother.reset();
      setState((prev) => ({ ...prev, raw: null, handDetected: false }));
      return;
    }

    idleFrames.current = 0;
    const raw = classifyLandmarks(landmarks);
    const accepted = raw && raw.confidence >= CONFIDENCE_THRESHOLD ? raw : null;
    const smoothed = smoother.push(accepted?.label ?? null, accepted?.confidence ?? 0);

    setState({
      raw,
      stable: smoothed.label,
      confidence: smoothed.confidence,
      lowConfidence: Boolean(raw) && !accepted,
      handDetected: true,
    });
  }, [landmarks, smoother]);

  return state;
}
