import { useEffect, useRef, useState } from "react";

import { HAND_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_URL, TARGET_FPS } from "@/lib/constants";
import type { Landmark } from "@/lib/classifier/landmarks";

export type LandmarkerStatus = "idle" | "loading" | "ready" | "error";

/**
 * Runs the MediaPipe Hand Landmarker over a <video> element at ~TARGET_FPS.
 * Loaded lazily in the browser only — nothing here runs during SSR, and no
 * frame or landmark ever leaves the device.
 */
export function useMediaPipe(videoRef: React.RefObject<HTMLVideoElement | null>, active: boolean) {
  const [status, setStatus] = useState<LandmarkerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      setLandmarks(null);
      return;
    }

    let cancelled = false;
    let raf = 0;
    let lastFrameAt = 0;
    let landmarker: {
      detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: Landmark[][] };
      close: () => void;
    } | null = null;

    const frameInterval = 1000 / TARGET_FPS;

    async function start() {
      setStatus("loading");
      setError(null);
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const instance = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAND_LANDMARKER_MODEL_URL, delegate: "GPU" },
          numHands: 1,
          runningMode: "VIDEO",
        });
        if (cancelled) {
          instance.close();
          return;
        }
        landmarker = instance as unknown as typeof landmarker;
        setStatus("ready");
        loop();
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("Hand tracking couldn't start. Check your connection and reload.");
      }
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!landmarker || !video || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastFrameAt < frameInterval) return;
      lastFrameAt = now;

      try {
        const result = landmarker.detectForVideo(video, now);
        const hand = result.landmarks?.[0] ?? null;
        const changed = Boolean(hand) !== Boolean(landmarksRef.current);
        landmarksRef.current = hand;
        if (hand || changed) setLandmarks(hand);
      } catch {
        /* transient decode errors are safe to skip */
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      landmarker?.close();
      landmarker = null;
      landmarksRef.current = null;
    };
  }, [active, videoRef]);

  return { status, error, landmarks, handDetected: Boolean(landmarks) };
}
