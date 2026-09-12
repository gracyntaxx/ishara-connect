import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { HAND_LANDMARKER_MODEL_URL } from "@/lib/constants";

export type ThemeMode = "light" | "dark" | "system";
export type Language = "en" | "es" | "fr" | "de" | "hi" | "zh";
export type MediaPipeDelegate = "GPU" | "CPU";
export type DatabaseStatus = "unknown" | "connected" | "disconnected" | "checking";

export interface SettingsState {
  // Appearance & Accessibility
  theme: ThemeMode;
  highContrast: boolean;
  reducedMotion: boolean;
  language: Language;

  // Media Devices
  cameraDeviceId: string | null;
  microphoneDeviceId: string | null;
  speakerDeviceId: string | null;

  // Audio / Speech Recognition
  enableSpeechRecognition: boolean;
  speechRecognitionLanguage: string;

  // AI & Recognition
  enableLocalClassifier: boolean;
  enableGeminiFallback: boolean;
  geminiApiKey: string | null;
  showConfidenceScores: boolean;
  showHandLandmarks: boolean;
  signEmitCooldownMs: number;
  targetFps: number;

  // MediaPipe Model Settings
  mediapipeDelegate: MediaPipeDelegate;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  numHands: number;
  modelAssetUrl: string;

  // Database / Backend Connection Settings
  apiUrl: string;
  databaseStatus: DatabaseStatus;
  databaseLatencyMs: number | null;
  supabaseUrl: string;
  supabaseAnonKey: string;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setReducedMotion: (enabled: boolean) => void;
  setLanguage: (language: Language) => void;
  setCameraDeviceId: (deviceId: string | null) => void;
  setMicrophoneDeviceId: (deviceId: string | null) => void;
  setSpeakerDeviceId: (deviceId: string | null) => void;
  setEnableSpeechRecognition: (enabled: boolean) => void;
  setSpeechRecognitionLanguage: (language: string) => void;
  setEnableLocalClassifier: (enabled: boolean) => void;
  setEnableGeminiFallback: (enabled: boolean) => void;
  setGeminiApiKey: (key: string | null) => void;
  setShowConfidenceScores: (show: boolean) => void;
  setShowHandLandmarks: (show: boolean) => void;
  setSignEmitCooldownMs: (ms: number) => void;
  setTargetFps: (fps: number) => void;

  // MediaPipe Actions
  setMediapipeDelegate: (delegate: MediaPipeDelegate) => void;
  setMinDetectionConfidence: (confidence: number) => void;
  setMinTrackingConfidence: (confidence: number) => void;
  setNumHands: (num: number) => void;
  setModelAssetUrl: (url: string) => void;

  // Database Actions
  setApiUrl: (url: string) => void;
  setDatabaseStatus: (status: DatabaseStatus, latency?: number | null) => void;
  setSupabaseUrl: (url: string) => void;
  setSupabaseAnonKey: (key: string) => void;

  reset: () => void;
}

const initialState = {
  theme: "system" as ThemeMode,
  highContrast: false,
  reducedMotion: false,
  language: "en" as Language,
  cameraDeviceId: null,
  microphoneDeviceId: null,
  speakerDeviceId: null,
  enableSpeechRecognition: true,
  speechRecognitionLanguage: "en-US",
  enableLocalClassifier: true,
  enableGeminiFallback: false,
  geminiApiKey: null,
  showConfidenceScores: true,
  showHandLandmarks: false,
  signEmitCooldownMs: 1600,
  targetFps: 18,

  // MediaPipe model defaults
  mediapipeDelegate: "GPU" as MediaPipeDelegate,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  numHands: 2,
  modelAssetUrl: HAND_LANDMARKER_MODEL_URL,

  // Database defaults
  apiUrl: (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:5000",
  databaseStatus: "unknown" as DatabaseStatus,
  databaseLatencyMs: null as number | null,
  supabaseUrl:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    "https://wcawlwpqxtiqoqatncao.supabase.co",
  supabaseAnonKey:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjYXdsd3BxeHRpcW9xYXRuY2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTc0NDAsImV4cCI6MjEwNDc3MzQ0MH0.ac1gc0pKNT9a0e51vgq-aE3UmUbKmqdAfJpFlB_HcNw",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setLanguage: (language) => set({ language }),
      setCameraDeviceId: (deviceId) => set({ cameraDeviceId: deviceId }),
      setMicrophoneDeviceId: (deviceId) => set({ microphoneDeviceId: deviceId }),
      setSpeakerDeviceId: (deviceId) => set({ speakerDeviceId: deviceId }),
      setEnableSpeechRecognition: (enabled) => set({ enableSpeechRecognition: enabled }),
      setSpeechRecognitionLanguage: (language) => set({ speechRecognitionLanguage: language }),
      setEnableLocalClassifier: (enabled) => set({ enableLocalClassifier: enabled }),
      setEnableGeminiFallback: (enabled) => set({ enableGeminiFallback: enabled }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setShowConfidenceScores: (show) => set({ showConfidenceScores: show }),
      setShowHandLandmarks: (show) => set({ showHandLandmarks: show }),
      setSignEmitCooldownMs: (ms) => set({ signEmitCooldownMs: ms }),
      setTargetFps: (fps) => set({ targetFps: fps }),

      setMediapipeDelegate: (delegate) => set({ mediapipeDelegate: delegate }),
      setMinDetectionConfidence: (confidence) => set({ minDetectionConfidence: confidence }),
      setMinTrackingConfidence: (confidence) => set({ minTrackingConfidence: confidence }),
      setNumHands: (num) => set({ numHands: num }),
      setModelAssetUrl: (url) => set({ modelAssetUrl: url }),

      setApiUrl: (url) => set({ apiUrl: url }),
      setDatabaseStatus: (status, latency = null) =>
        set({ databaseStatus: status, databaseLatencyMs: latency }),
      setSupabaseUrl: (url) => set({ supabaseUrl: url }),
      setSupabaseAnonKey: (key) => set({ supabaseAnonKey: key }),

      reset: () => set(initialState),
    }),
    {
      name: "ishara-settings-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function applyTheme(theme: ThemeMode, highContrast: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (highContrast) {
    root.classList.add("high-contrast");
  } else {
    root.classList.remove("high-contrast");
  }

  if (
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("ishara-settings-store");
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      applyTheme(state.theme, state.highContrast);
    } catch {
      applyTheme("system", false);
    }
  } else {
    applyTheme("system", false);
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const freshStored = localStorage.getItem("ishara-settings-store");
    if (freshStored) {
      try {
        const { state } = JSON.parse(freshStored);
        if (state.theme === "system") {
          applyTheme("system", state.highContrast);
        }
      } catch {
        // ignore
      }
    }
  });
}
