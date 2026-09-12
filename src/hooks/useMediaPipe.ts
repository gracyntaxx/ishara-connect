import { useCallback, useEffect, useRef, useState } from "react";

import { HAND_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_URL, TARGET_FPS } from "@/lib/constants";
import type { Landmark } from "@/lib/classifier/landmarks";
import { useSettingsStore } from "@/stores/useSettingsStore";

export type LandmarkerStatus = "idle" | "loading" | "ready" | "error";

interface UseMediaPipeOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  targetFps?: number;
  numHands?: number;
}

// Module-scoped singletons to ensure fast start (<50ms)
let sharedFilesetPromise: Promise<any> | null = null;
let sharedLandmarker: any = null;
let sharedLandmarkerPromise: Promise<any> | null = null;

async function getSharedLandmarker(options: {
  modelAssetUrl: string;
  mediapipeDelegate: string;
  numHands: number;
  minConfidence: number;
}) {
  if (sharedLandmarker) return sharedLandmarker;
  if (sharedLandmarkerPromise) return sharedLandmarkerPromise;

  sharedLandmarkerPromise = (async () => {
    const vision = await import("@mediapipe/tasks-vision");
    if (!sharedFilesetPromise) {
      sharedFilesetPromise = vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    }
    const fileset = await sharedFilesetPromise;
    const instance = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: options.modelAssetUrl || HAND_LANDMARKER_MODEL_URL,
        delegate: (options.mediapipeDelegate as any) || "GPU",
      },
      numHands: Math.max(options.numHands || 2, 2), // Track both hands simultaneously
      minHandDetectionConfidence: options.minConfidence ?? 0.5,
      minHandPresenceConfidence: options.minConfidence ?? 0.5,
      minTrackingConfidence: options.minConfidence ?? 0.5,
      runningMode: "VIDEO",
    });
    sharedLandmarker = instance;
    return instance;
  })();

  return sharedLandmarkerPromise;
}

/**
 * Runs the MediaPipe Hand Landmarker over a <video> element.
 * Supports dual-hand tracking (multiLandmarks: Landmark[][]) and single-hand (landmarks: Landmark[]).
 */
export function useMediaPipe({
  videoRef,
  targetFps,
  numHands: customNumHands,
}: UseMediaPipeOptions) {
  const {
    mediapipeDelegate,
    minDetectionConfidence,
    numHands: storeNumHands,
    modelAssetUrl,
    targetFps: storeFps,
  } = useSettingsStore();

  const effectiveNumHands = Math.max(customNumHands ?? storeNumHands ?? 2, 2);

  const [status, setStatus] = useState<LandmarkerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [multiLandmarks, setMultiLandmarks] = useState<Landmark[][]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const landmarksRef = useRef<Landmark[] | null>(null);
  const multiLandmarksRef = useRef<Landmark[][]>([]);
  const activeRef = useRef(false);
  const rafRef = useRef(0);
  const landmarkerRef = useRef<{
    detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: Landmark[][] };
    close: () => void;
  } | null>(null);

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
      const allHands = result.landmarks || [];
      const primaryHand = allHands[0] ?? null;

      const singleChanged = Boolean(primaryHand) !== Boolean(landmarksRef.current);
      landmarksRef.current = primaryHand;
      multiLandmarksRef.current = allHands;

      if (primaryHand || singleChanged) {
        setLandmarks(primaryHand);
      }
      setMultiLandmarks(allHands);
    } catch {
      /* transient decode errors are safe to skip */
    }
  }, [videoRef, frameInterval]);

  const init = useCallback(async () => {
    if (landmarkerRef.current) return;
    setStatus("loading");
    setError(null);
    try {
      const instance = await getSharedLandmarker({
        modelAssetUrl,
        mediapipeDelegate,
        numHands: effectiveNumHands,
        minConfidence: minDetectionConfidence ?? 0.5,
      });
      landmarkerRef.current = instance;
      setStatus("ready");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Hand tracking couldn't start. Check your connection and reload.");
    }
  }, [mediapipeDelegate, minDetectionConfidence, effectiveNumHands, modelAssetUrl]);

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
    multiLandmarksRef.current = [];
    setLandmarks(null);
    setMultiLandmarks([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    status,
    error,
    landmarks,
    multiLandmarks,
    isRunning,
    start,
    stop,
  };
}
