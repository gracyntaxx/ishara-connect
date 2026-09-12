import { useCallback, useEffect, useRef, useState } from "react";

export type MediaPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

type Options = { video?: boolean; audio?: boolean };

/**
 * Requests the camera (and optionally the microphone) once and keeps the
 * stream alive for the lifetime of the page that uses it.
 *
 * Return shape matches what VideoCall and Practice components expect.
 */
export function useMediaStream({ video = true, audio = true }: Options = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<MediaPermissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      setError("This browser can't access the camera. Try Chrome or Edge.");
      return;
    }

    setPermissionState("requesting");
    setError(null);

    const videoConstraints: MediaTrackConstraints | boolean = video
      ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: "user",
        }
      : false;

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = media;
        setStream(media);
        setPermissionState("granted");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setPermissionState("denied");
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

  const retryStream = useCallback(() => setAttempt((v) => v + 1), []);
  const requestPermission = retryStream; // alias
  const startStream = retryStream; // alias for initiating or restarting camera

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setPermissionState("idle");
  }, []);

  const toggleAudio = useCallback((enabled?: boolean) => {
    const tracks = streamRef.current?.getAudioTracks();
    tracks?.forEach((track) => {
      track.enabled = enabled !== undefined ? enabled : !track.enabled;
    });
  }, []);

  const toggleVideo = useCallback((enabled?: boolean) => {
    const tracks = streamRef.current?.getVideoTracks();
    tracks?.forEach((track) => {
      track.enabled = enabled !== undefined ? enabled : !track.enabled;
    });
  }, []);

  const toggleTrack = useCallback(
    (kind: "audio" | "video", enabled: boolean) => {
      if (kind === "audio") toggleAudio(enabled);
      else toggleVideo(enabled);
    },
    [toggleAudio, toggleVideo],
  );

  return {
    stream,
    permissionState,
    error,
    retryStream,
    requestPermission,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
    toggleTrack,
  };
}
