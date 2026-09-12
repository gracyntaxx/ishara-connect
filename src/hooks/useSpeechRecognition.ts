import { useCallback, useEffect, useRef, useState } from "react";

type SpeechAlternative = { transcript: string; confidence: number };
type SpeechResult = { isFinal: boolean; 0: SpeechAlternative; length: number };
type SpeechEvent = { resultIndex: number; results: { length: number; [i: number]: SpeechResult } };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechCtor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (text: string, isFinal: boolean) => void;
}

/**
 * Web Speech API wrapper with feature detection and imperative start/stop.
 *
 * Accepts an option-object with `onResult(text, isFinal)` callback.
 * Returns `{ transcript, finalTranscript, isListening, supported, start, stop }`.
 */
export function useSpeechRecognition({
  continuous = true,
  interimResults = true,
  language = "en-US",
  onResult,
}: UseSpeechRecognitionOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const callbackRef = useRef(onResult);
  const wantListening = useRef(false);

  useEffect(() => {
    callbackRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const Ctor = getConstructor();
    setSupported(Boolean(Ctor));
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const text = result[0].transcript.trim();
        if (!text) continue;
        if (result.isFinal) {
          setFinalTranscript(text);
          callbackRef.current?.(text, true);
        } else {
          pending = text;
          callbackRef.current?.(text, false);
        }
      }
      setTranscript(pending);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone access was blocked.");
      } else if (event.error !== "no-speech") {
        setError("Speech recognition hiccuped. Retrying.");
      }
    };

    recognition.onend = () => {
      setTranscript("");
      if (wantListening.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantListening.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    };
  }, [language, continuous, interimResults]);

  const start = useCallback(() => {
    wantListening.current = true;
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.start();
      setIsListening(true);
      setError(null);
    } catch {
      /* already running */
    }
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      /* already stopped */
    }
    setIsListening(false);
  }, []);

  return { transcript, finalTranscript, isListening, supported, error, start, stop };
}
