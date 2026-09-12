import { createFileRoute } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { useSettingsStore, applyTheme, initTheme } from "../stores";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Contrast,
  Move,
  Globe,
  Video,
  Mic,
  Volume2,
  Brain,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { HAND_LANDMARKER_MODEL_URL } from "../lib/constants";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
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
    setTheme,
    setHighContrast,
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
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    applyTheme(theme, highContrast);
  }, [theme, highContrast]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((d) => setDevices(d));
    }
  }, []);

  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  const audioInputDevices = devices.filter((d) => d.kind === "audioinput");
  const audioOutputDevices = devices.filter((d) => d.kind === "audiooutput");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Customize your Ishara Connect experience</p>
          </div>

          <div className="space-y-8">
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Contrast className="h-5 w-5" />
                Appearance
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "System", icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value as "light" | "dark" | "system")}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          theme === value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Contrast className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">High Contrast Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Maximum contrast for better visibility
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        highContrast ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={highContrast}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          highContrast ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <div className="pt-6 border-t border-border">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Move className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Reduced Motion</p>
                        <p className="text-sm text-muted-foreground">
                          Minimize animations and transitions
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        reducedMotion ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={reducedMotion}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          reducedMotion ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Interface Language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value as "en" | "es" | "fr" | "de" | "hi" | "zh")
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="hi">हिन्दी</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="speechLanguage"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Speech Recognition Language
                  </label>
                  <select
                    id="speechLanguage"
                    value={speechRecognitionLanguage}
                    onChange={(e) => setSpeechRecognitionLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="fr-FR">Français (France)</option>
                    <option value="de-DE">Deutsch (Deutschland)</option>
                    <option value="hi-IN">हिन्दी (भारत)</option>
                    <option value="zh-CN">中文 (中国)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Video className="h-5 w-5" />
                Camera & Microphone
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="camera"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Camera
                  </label>
                  <select
                    id="camera"
                    value={cameraDeviceId || ""}
                    onChange={(e) => setCameraDeviceId(e.target.value || null)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Default</option>
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="microphone"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Microphone
                  </label>
                  <select
                    id="microphone"
                    value={microphoneDeviceId || ""}
                    onChange={(e) => setMicrophoneDeviceId(e.target.value || null)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Default</option>
                    {audioInputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="speaker"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Speaker
                  </label>
                  <select
                    id="speaker"
                    value={speakerDeviceId || ""}
                    onChange={(e) => setSpeakerDeviceId(e.target.value || null)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Default</option>
                    {audioOutputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Speaker ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Recognition
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Local Sign Classifier</p>
                      <p className="text-sm text-muted-foreground">
                        Enable client-side sign recognition (8 signs)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableLocalClassifier(!enableLocalClassifier)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      enableLocalClassifier ? "bg-primary" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={enableLocalClassifier}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        enableLocalClassifier ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Speech Recognition</p>
                      <p className="text-sm text-muted-foreground">
                        Convert spoken words to text in real-time
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableSpeechRecognition(!enableSpeechRecognition)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      enableSpeechRecognition ? "bg-primary" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={enableSpeechRecognition}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        enableSpeechRecognition ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Gemini AI Fallback</p>
                      <p className="text-sm text-muted-foreground">
                        Use Google Gemini for improved recognition (requires API key)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableGeminiFallback(!enableGeminiFallback)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      enableGeminiFallback ? "bg-primary" : "bg-muted"
                    }`}
                    role="switch"
                    aria-checked={enableGeminiFallback}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        enableGeminiFallback ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                {enableGeminiFallback && (
                  <div className="pt-2">
                    <label
                      htmlFor="geminiKey"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        id="geminiKey"
                        type={showApiKey ? "text" : "password"}
                        value={geminiApiKey || ""}
                        onChange={(e) => setGeminiApiKey(e.target.value || null)}
                        placeholder="Enter your Gemini API key"
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get your API key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <label
                      htmlFor="confidence"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Show Confidence Scores
                    </label>
                    <button
                      onClick={() => setShowConfidenceScores(!showConfidenceScores)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        showConfidenceScores ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={showConfidenceScores}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          showConfidenceScores ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <label
                      htmlFor="landmarks"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Show Hand Landmarks
                    </label>
                    <button
                      onClick={() => setShowHandLandmarks(!showHandLandmarks)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        showHandLandmarks ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={showHandLandmarks}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          showHandLandmarks ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
