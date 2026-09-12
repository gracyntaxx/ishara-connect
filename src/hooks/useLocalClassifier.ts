import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { classifyLandmarks, classifyMultiLandmarks } from "@/lib/classifier/rules";
import { TemporalSmoother } from "@/lib/classifier/smoothing";
import type { Landmark } from "@/lib/classifier/landmarks";
import {
  CONFIDENCE_THRESHOLD,
  SMOOTHING_WINDOW,
  SMOOTHING_MIN_VOTES,
  SIGN_EMIT_COOLDOWN_MS,
  type SignLabel,
} from "@/lib/constants";

interface UseLocalClassifierOptions {
  landmarks?: Landmark[] | null;
  multiLandmarks?: Landmark[][] | null;
  confidenceThreshold?: number;
  smoothingWindow?: number;
  minVotes?: number;
  emitCooldownMs?: number;
  enabled?: boolean;
  onSignDetected?: (sign: SignLabel, confidence: number) => void;
}

/**
 * Turns a stream of hand landmarks into a stable sign prediction:
 * Supports single hand and dual-hand MediaPipe landmarks.
 * Automatically active when `enabled: true` (or via start/stop).
 */
export function useLocalClassifier({
  landmarks,
  multiLandmarks,
  confidenceThreshold = 0.50,
  smoothingWindow = SMOOTHING_WINDOW,
  minVotes = SMOOTHING_MIN_VOTES,
  emitCooldownMs = SIGN_EMIT_COOLDOWN_MS,
  enabled = true,
  onSignDetected,
}: UseLocalClassifierOptions) {
  const smoother = useMemo(
    () => new TemporalSmoother(smoothingWindow, minVotes),
    [smoothingWindow, minVotes],
  );

  const [prediction, setPrediction] = useState<SignLabel | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isLowConfidence, setIsLowConfidence] = useState(false);
  const [isActive, setIsActive] = useState(Boolean(enabled));

  const activeRef = useRef(Boolean(enabled));
  const lastEmitRef = useRef<{ sign: string; time: number }>({ sign: "", time: 0 });
  const callbackRef = useRef(onSignDetected);
  const idleFrames = useRef(0);

  // Sync active state with enabled prop
  useEffect(() => {
    activeRef.current = Boolean(enabled);
    setIsActive(Boolean(enabled));
    if (!enabled) {
      smoother.reset();
      setPrediction(null);
      setConfidence(0);
      setIsLowConfidence(false);
    }
  }, [enabled, smoother]);

  useEffect(() => {
    callbackRef.current = onSignDetected;
  }, [onSignDetected]);

  const start = useCallback(() => {
    activeRef.current = true;
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    smoother.reset();
    setPrediction(null);
    setConfidence(0);
    setIsLowConfidence(false);
  }, [smoother]);

  useEffect(() => {
    if (!activeRef.current) return;

    // Check if any hands are present
    const hasMulti = multiLandmarks && multiLandmarks.length > 0;
    const hasSingle = Boolean(landmarks && landmarks.length > 0);

    if (!hasMulti && !hasSingle) {
      idleFrames.current += 1;
      if (idleFrames.current > 12) {
        smoother.reset();
        setPrediction(null);
        setConfidence(0);
      }
      return;
    }

    idleFrames.current = 0;

    // Classify using dual-hand engine if available, or fallback to single
    const raw = hasMulti
      ? classifyMultiLandmarks(multiLandmarks!)
      : classifyLandmarks(landmarks!);

    if (!raw) return;

    const accepted = raw.confidence >= confidenceThreshold ? raw : null;
    const smoothed = smoother.push(accepted?.label ?? null, accepted?.confidence ?? 0);

    setPrediction(smoothed.label);
    setConfidence(smoothed.confidence);
    setIsLowConfidence(Boolean(raw) && !accepted);

    // Emit with cooldown
    if (smoothed.label && callbackRef.current) {
      const now = Date.now();
      const last = lastEmitRef.current;
      if (smoothed.label !== last.sign || now - last.time >= emitCooldownMs) {
        lastEmitRef.current = { sign: smoothed.label, time: now };
        callbackRef.current(smoothed.label, smoothed.confidence);
      }
    }
  }, [landmarks, multiLandmarks, confidenceThreshold, emitCooldownMs, smoother]);

  return { prediction, confidence, isLowConfidence, isActive, start, stop };
}
