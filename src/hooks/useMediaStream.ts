import { useCallback, useEffect, useRef, useState } from "react";

export type MediaPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

type Options = { video?: boolean; audio?: boolean };

/**
 * Requests the camera (and optionally the microphone) once and keeps the
 * stream alive for the lifetime of the page that uses it.
 */
export function useMediaStream({ video = true, audio = true }: Options = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<MediaPermissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setError("This browser can't access the camera. Try Chrome or Edge.");
      return;
    }

    setState("requesting");
    setError(null);

    navigator.mediaDevices
      .getUserMedia({ video, audio })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = media;
        setStream(media);
        setState("granted");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setState("denied");
        setError(
          name === "NotFoundError"
            ? "No camera was found on this device."
            : "Ishara needs camera and microphone access to read signs and speech.",
        );
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [video, audio, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const toggleTrack = useCallback((kind: "audio" | "video", enabled: boolean) => {
    const tracks =
      kind === "audio" ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    tracks?.forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  return { stream, state, error, retry, toggleTrack };
}
