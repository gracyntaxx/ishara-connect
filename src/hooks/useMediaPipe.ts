import { useCallback, useEffect, useRef, useState } from "react";

import { HAND_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_URL, TARGET_FPS } from "@/lib/constants";
import type { Landmark } from "@/lib/classifier/landmarks";
import { useSettingsStore } from "@/stores/useSettingsStore";

export type LandmarkerStatus = "idle" | "loading" | "ready" | "error";

interface UseMediaPipeOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  targetFps?: number;
}

/**
 * Runs the MediaPipe Hand Landmarker over a <video> element.
 * Uses configurable options (model URL, GPU/CPU delegate, confidence thresholds, numHands)
 * from useSettingsStore. All recognition runs client-side.
 */
export function useMediaPipe({ videoRef, targetFps }: UseMediaPipeOptions) {
  const {
    mediapipeDelegate,
    minDetectionConfidence,
    minTrackingConfidence,
    numHands,
    modelAssetUrl,
    targetFps: storeFps,
  } = useSettingsStore();

  const [status, setStatus] = useState<LandmarkerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const landmarksRef = useRef<Landmark[] | null>(null);
  const activeRef = useRef(false);
  const rafRef = useRef(0);
  const landmarkerRef = useRef<{
    detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: Landmark[][] };
    close: () => void;
  } | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const effectiveFps = targetFps ?? storeFps ?? TARGET_FPS;
  const frameInterval = 1000 / effectiveFps;

  const loop = useCallback(() => {
    if (!activeRef.current) return;
    rafRef.current = requestAnimationFrame(loop);

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!landmarker || !video || video.readyState < 2) return;

    const now = performance.now();
    // throttle based on configured targetFps
    if ((loop as any).__lastFrame && now - (loop as any).__lastFrame < frameInterval) return;
    (loop as any).__lastFrame = now;

    try {
      const result = landmarker.detectForVideo(video, now);
      const hand = result.landmarks?.[0] ?? null;
      const changed = Boolean(hand) !== Boolean(landmarksRef.current);
      landmarksRef.current = hand;
      if (hand || changed) setLandmarks(hand);
    } catch {
      /* transient decode errors are safe to skip */
    }
  }, [videoRef, frameInterval]);

  // Lazy-initialise the landmarker using configured MediaPipe options
  const init = useCallback(async () => {
    if (landmarkerRef.current) return;
    if (initPromiseRef.current) {
      await initPromiseRef.current;
      return;
    }

    const promise = (async () => {
      setStatus("loading");
      setError(null);
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const instance = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: modelAssetUrl || HAND_LANDMARKER_MODEL_URL,
            delegate: mediapipeDelegate || "GPU",
          },
          numHands: numHands || 1,
          minHandDetectionConfidence: minDetectionConfidence ?? 0.5,
          minHandPresenceConfidence: minDetectionConfidence ?? 0.5,
          minTrackingConfidence: minTrackingConfidence ?? 0.5,
          runningMode: "VIDEO",
        });
        landmarkerRef.current = instance as unknown as typeof landmarkerRef.current;
        setStatus("ready");
      } catch (err: any) {
        setStatus("error");
        setError(err?.message || "Hand tracking couldn't start. Check your connection and reload.");
      }
    })();

    initPromiseRef.current = promise;
    await promise;
  }, [mediapipeDelegate, minDetectionConfidence, minTrackingConfidence, numHands, modelAssetUrl]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setIsRunning(true);

    void init().then(() => {
      if (activeRef.current && landmarkerRef.current) {
        (loop as any).__lastFrame = 0;
        loop();
      }
    });
  }, [init, loop]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    landmarksRef.current = null;
    setLandmarks(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // ignore
        }
        landmarkerRef.current = null;
      }
    };
  }, []);

  return {
    status,
    error,
    landmarks,
    isRunning,
    start,
    stop,
  };
}
