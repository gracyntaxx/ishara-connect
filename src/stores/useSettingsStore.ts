import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type Language = "en" | "es" | "fr" | "de" | "hi" | "zh";

export interface SettingsState {
  theme: ThemeMode;
  highContrast: boolean;
  reducedMotion: boolean;
  language: Language;
  cameraDeviceId: string | null;
  microphoneDeviceId: string | null;
  speakerDeviceId: string | null;
  enableSpeechRecognition: boolean;
  speechRecognitionLanguage: string;
  enableLocalClassifier: boolean;
  enableGeminiFallback: boolean;
  geminiApiKey: string | null;
  showConfidenceScores: boolean;
  showHandLandmarks: boolean;
  signEmitCooldownMs: number;
  targetFps: number;

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
      reset: () => set(initialState),
    }),
    {
      name: "ishara-settings-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useSettingsActions() {
  const {
    theme,
    highContrast,
    reducedMotion,
    language,
    cameraDeviceId,
    microphoneDeviceId,
    speakerDeviceId,
    enableSpeechRecognition,
    speechRecognitionLanguage,
    enableLocalClassifier,
    enableGeminiFallback,
    geminiApiKey,
    showConfidenceScores,
    showHandLandmarks,
    signEmitCooldownMs,
    targetFps,
    setTheme,
    setHighContrast,
    toggleHighContrast,
    setReducedMotion,
    setLanguage,
    setCameraDeviceId,
    setMicrophoneDeviceId,
    setSpeakerDeviceId,
    setEnableSpeechRecognition,
    setSpeechRecognitionLanguage,
    setEnableLocalClassifier,
    setEnableGeminiFallback,
    setGeminiApiKey,
    setShowConfidenceScores,
    setShowHandLandmarks,
    setSignEmitCooldownMs,
    setTargetFps,
    reset,
  } = useSettingsStore();

  return {
    theme,
    highContrast,
    reducedMotion,
    language,
    cameraDeviceId,
    microphoneDeviceId,
    speakerDeviceId,
    enableSpeechRecognition,
    speechRecognitionLanguage,
    enableLocalClassifier,
    enableGeminiFallback,
    geminiApiKey,
    showConfidenceScores,
    showHandLandmarks,
    signEmitCooldownMs,
    targetFps,
    setTheme,
    setHighContrast,
    toggleHighContrast,
    setReducedMotion,
    setLanguage,
    setCameraDeviceId,
    setMicrophoneDeviceId,
    setSpeakerDeviceId,
    setEnableSpeechRecognition,
    setSpeechRecognitionLanguage,
    setEnableLocalClassifier,
    setEnableGeminiFallback,
    setGeminiApiKey,
    setShowConfidenceScores,
    setShowHandLandmarks,
    setSignEmitCooldownMs,
    setTargetFps,
    reset,
  };
}

export function applyTheme(theme: ThemeMode, highContrast: boolean) {
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

  if (typeof window !== "undefined") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      const stored = localStorage.getItem("ishara-settings-store");
      if (stored) {
        try {
          const { state } = JSON.parse(stored);
          if (state.theme === "system") {
            applyTheme("system", state.highContrast);
          }
        } catch {
          // ignore
        }
      }
    });
  }
}
