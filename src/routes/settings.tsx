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
  Check,
  AlertTriangle,
  Cpu,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Copy,
} from "lucide-react";
import { apiHealthCheck } from "../lib/api";
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from "../lib/supabase";
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
    signEmitCooldownMs,
    targetFps,

    // MediaPipe Model Settings
    mediapipeDelegate,
    minDetectionConfidence,
    minTrackingConfidence,
    numHands,
    modelAssetUrl,

    // Database Settings
    apiUrl,
    databaseStatus,
    databaseLatencyMs,
    supabaseUrl,
    supabaseAnonKey,

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
    setSignEmitCooldownMs,
    setTargetFps,

    setMediapipeDelegate,
    setMinDetectionConfidence,
    setMinTrackingConfidence,
    setNumHands,
    setModelAssetUrl,

    setApiUrl,
    setDatabaseStatus,
    setSupabaseUrl,
    setSupabaseAnonKey,
    reset,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestMessage, setDbTestMessage] = useState<string | null>(null);
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState(supabaseUrl);
  const [tempSupabaseKey, setTempSupabaseKey] = useState(supabaseAnonKey);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

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

  // Run initial lightweight DB health check (prefer Supabase if credentials configured)
  useEffect(() => {
    let active = true;
    if (supabaseUrl && supabaseAnonKey) {
      testSupabaseConnection().then((res) => {
        if (!active) return;
        if (res.success) {
          setDatabaseStatus("connected", res.latencyMs);
        } else {
          setDatabaseStatus("disconnected", null);
        }
      });
    } else {
      apiHealthCheck().then((res) => {
        if (!active) return;
        if (res.success) {
          setDatabaseStatus("connected", res.latencyMs);
        } else {
          setDatabaseStatus("disconnected", null);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [supabaseUrl, supabaseAnonKey, apiUrl, setDatabaseStatus]);

  const handleTestSupabase = async () => {
    setTestingDb(true);
    setDbTestMessage(null);
    setDatabaseStatus("checking");

    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        setDatabaseStatus("connected", res.latencyMs);
        setDbTestMessage(res.message);
      } else {
        setDatabaseStatus("disconnected", null);
        setDbTestMessage(res.message);
      }
    } catch {
      setDatabaseStatus("disconnected", null);
      setDbTestMessage("Failed to reach Supabase project.");
    } finally {
      setTestingDb(false);
    }
  };

  const handleSaveSupabase = () => {
    setSupabaseUrl(tempSupabaseUrl.trim());
    setSupabaseAnonKey(tempSupabaseKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    handleTestSupabase();
  };

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestMessage(null);
    setDatabaseStatus("checking");

    try {
      const res = await apiHealthCheck();
      if (res.success) {
        setDatabaseStatus("connected", res.latencyMs);
        setDbTestMessage(`Connected to Ishara Backend API (${res.latencyMs}ms)`);
      } else {
        setDatabaseStatus("disconnected", null);
        setDbTestMessage("Backend server is offline. Ishara is running in local-only mode.");
      }
    } catch {
      setDatabaseStatus("disconnected", null);
      setDbTestMessage("Failed to reach backend endpoint.");
    } finally {
      setTestingDb(false);
    }
  };

  const handleSaveApiUrl = () => {
    setApiUrl(tempApiUrl.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    handleTestDatabase();
  };

  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  const audioInputDevices = devices.filter((d) => d.kind === "audioinput");
  const audioOutputDevices = devices.filter((d) => d.kind === "audiooutput");

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <main className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-medium mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>System & Model Preferences</span>
            </div>
            <h1 className="text-3xl font-normal text-[#202124] tracking-tight">Settings</h1>
            <p className="text-sm text-[#5f6368] mt-1">
              Configure MediaPipe AI vision models, MongoDB database connection, media devices, and accessibility.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. MediaPipe AI Vision Model Section */}
            <section className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#202124]">
                      MediaPipe Vision Model
                    </h2>
                    <p className="text-xs text-[#5f6368]">
                      On-device hand landmark detection parameters and hardware acceleration
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-[#ceead6] text-[#137333] px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Client-Side AI
                </span>
              </div>

              <div className="space-y-5 pt-2">
                {/* Hardware Delegate (GPU vs CPU) */}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-2">
                    Execution Delegate (Hardware Acceleration)
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMediapipeDelegate("GPU")}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        mediapipeDelegate === "GPU"
                          ? "border-[#1a73e8] bg-[#e8f0fe]/50 text-[#1a73e8]"
                          : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-[#1a73e8] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-xs text-[#202124]">GPU WebGL (Recommended)</div>
                        <div className="text-[11px] text-[#5f6368] mt-0.5">
                          High FPS, low CPU utilization using hardware graphics shaders
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMediapipeDelegate("CPU")}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        mediapipeDelegate === "CPU"
                          ? "border-[#1a73e8] bg-[#e8f0fe]/50 text-[#1a73e8]"
                          : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                      }`}
                    >
                      <Cpu className="w-5 h-5 text-[#ea4335] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-xs text-[#202124]">CPU (Fallback)</div>
                        <div className="text-[11px] text-[#5f6368] mt-0.5">
                          Software emulation for devices without WebGL acceleration
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Hand Detection Confidence & Tracking Confidence Sliders */}
                <div className="grid sm:grid-cols-2 gap-5 pt-2">
                  <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0]">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-[#3c4043]">
                        Min Detection Confidence
                      </label>
                      <span className="text-xs font-mono font-medium text-[#1a73e8] bg-white px-2 py-0.5 rounded border border-[#dadce0]">
                        {Math.round(minDetectionConfidence * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={minDetectionConfidence}
                      onChange={(e) => setMinDetectionConfidence(parseFloat(e.target.value))}
                      className="w-full accent-[#1a73e8] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#5f6368] mt-1.5">
                      Threshold to confirm hand presence before tracking begins
                    </p>
                  </div>

                  <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0]">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-[#3c4043]">
                        Min Tracking Confidence
                      </label>
                      <span className="text-xs font-mono font-medium text-[#1a73e8] bg-white px-2 py-0.5 rounded border border-[#dadce0]">
                        {Math.round(minTrackingConfidence * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={minTrackingConfidence}
                      onChange={(e) => setMinTrackingConfidence(parseFloat(e.target.value))}
                      className="w-full accent-[#1a73e8] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#5f6368] mt-1.5">
                      Threshold to retain landmark points between continuous frames
                    </p>
                  </div>
                </div>

                {/* Hands count & Target FPS */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0]">
                    <label className="block text-xs font-semibold text-[#3c4043] mb-2">
                      Max Hands Tracked
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNumHands(1)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          numHands === 1
                            ? "bg-white border-[#1a73e8] text-[#1a73e8] shadow-sm"
                            : "border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]"
                        }`}
                      >
                        1 Hand (Optimal)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumHands(2)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          numHands === 2
                            ? "bg-white border-[#1a73e8] text-[#1a73e8] shadow-sm"
                            : "border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]"
                        }`}
                      >
                        2 Hands (Bimanual)
                      </button>
                    </div>
                    <p className="text-[11px] text-[#5f6368] mt-2">
                      Single hand provides lowest latency for one-handed static gestures.
                    </p>
                  </div>

                  <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0]">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-[#3c4043]">Target FPS</label>
                      <span className="text-xs font-mono font-medium text-[#1a73e8] bg-white px-2 py-0.5 rounded border border-[#dadce0]">
                        {targetFps} FPS
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      step="2"
                      value={targetFps}
                      onChange={(e) => setTargetFps(Number(e.target.value))}
                      className="w-full accent-[#1a73e8] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#5f6368] mt-1.5">
                      Detection loop speed (18 FPS balances fluidity with minimal battery drain)
                    </p>
                  </div>
                </div>

                {/* Model Asset URL input */}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                    MediaPipe Hand Landmarker Model Asset
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modelAssetUrl}
                      onChange={(e) => setModelAssetUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white border border-[#dadce0] rounded-xl text-xs font-mono text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                      placeholder="https://.../hand_landmarker.task"
                    />
                    <button
                      type="button"
                      onClick={() => setModelAssetUrl(HAND_LANDMARKER_MODEL_URL)}
                      className="px-3 py-2 text-xs font-medium text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] rounded-xl transition-colors"
                    >
                      Reset Default
                    </button>
                  </div>
                  <p className="text-[11px] text-[#70757a] mt-1">
                    Default: Google Storage official float16 MediaPipe bundle.
                  </p>
                </div>

                {/* Visualizer and Classifier Toggles */}
                <div className="pt-3 border-t border-[#e8eaed] space-y-3">
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <div className="text-xs font-semibold text-[#202124]">
                        Show 21-Point Landmark Skeleton
                      </div>
                      <div className="text-[11px] text-[#5f6368]">
                        Render colored joints and connections over your camera feed
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHandLandmarks(!showHandLandmarks)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        showHandLandmarks ? "bg-[#1a73e8]" : "bg-[#dadce0]"
                      }`}
                      role="switch"
                      aria-checked={showHandLandmarks}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          showHandLandmarks ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <div className="text-xs font-semibold text-[#202124]">
                        Confidence Score Indicators
                      </div>
                      <div className="text-[11px] text-[#5f6368]">
                        Display live % match on recognized sign gestures
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfidenceScores(!showConfidenceScores)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        showConfidenceScores ? "bg-[#1a73e8]" : "bg-[#dadce0]"
                      }`}
                      role="switch"
                      aria-checked={showConfidenceScores}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          showConfidenceScores ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </section>

            {/* 2. Database & Cloud Storage Section (Supabase) */}
            <section className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ceead6] text-[#137333] flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#202124]">
                      Database & Cloud Storage (Supabase)
                    </h2>
                    <p className="text-xs text-[#5f6368]">
                      PostgreSQL database for practice progress, user profiles, badges, and call history
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {databaseStatus === "connected" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#ceead6] text-[#137333] px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse" />
                      Database Online {databaseLatencyMs ? `(${databaseLatencyMs}ms)` : ""}
                    </span>
                  ) : databaseStatus === "checking" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#feefe3] text-[#b06000] px-3 py-1 rounded-full">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Testing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#f1f3f4] text-[#5f6368] px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#9aa0a6]" />
                      Local Storage Mode (Offline)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4 text-xs text-[#3c4043] space-y-2">
                  <div className="flex items-center gap-2 font-medium text-[#202124]">
                    <ShieldCheck className="w-4 h-4 text-[#137333]" />
                    <span>Supabase-Ready & Git-Protected</span>
                  </div>
                  <p className="text-[#5f6368] leading-relaxed">
                    Credentials are read directly from <code>.env</code> (ignored in <code>.gitignore</code> so keys
                    are never exposed to GitHub). You can also configure or update them below.
                  </p>
                </div>

                {/* Supabase URL & Anon Key */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={tempSupabaseUrl}
                      onChange={(e) => setTempSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3.5 py-2 bg-white border border-[#dadce0] rounded-xl text-xs font-mono text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                      Supabase Anon Public Key
                    </label>
                    <div className="relative">
                      <input
                        type={showAnonKey ? "text" : "password"}
                        value={tempSupabaseKey}
                        onChange={(e) => setTempSupabaseKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full px-3.5 py-2 pr-10 bg-white border border-[#dadce0] rounded-xl text-xs font-mono text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAnonKey(!showAnonKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                      >
                        {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions: Save Supabase, Ping, Copy SQL */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveSupabase}
                      className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
                    >
                      {savedNotice ? "Saved!" : "Save Credentials"}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={testingDb}
                      className="px-4 py-2 bg-white border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? "animate-spin" : ""}`} />
                      Ping Supabase
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-4 py-2 bg-white border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#137333]" /> SQL Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#5f6368]" /> Copy SQL Schema
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional Backend API URL */}
                <div className="pt-4 border-t border-[#e8eaed]">
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                    Optional Express API Server URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempApiUrl}
                      onChange={(e) => setTempApiUrl(e.target.value)}
                      placeholder="http://localhost:5000"
                      className="flex-1 px-3.5 py-2 bg-white border border-[#dadce0] rounded-xl text-xs font-mono text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="px-4 py-2 bg-white border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] text-xs font-medium rounded-xl transition-colors"
                    >
                      Save API URL
                    </button>
                  </div>
                </div>

                {/* Test Feedback */}
                {dbTestMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      databaseStatus === "connected"
                        ? "bg-[#ceead6]/60 text-[#137333] border border-[#a8dab5]"
                        : "bg-[#feefe3] text-[#b06000] border border-[#fddfc4]"
                    }`}
                  >
                    <Activity className="w-4 h-4 flex-shrink-0" />
                    <span>{dbTestMessage}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Audio & Speech Recognition Section */}
            <section className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-[#202124] mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#1a73e8]" />
                Speech & Audio
              </h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#202124]">Live Speech-to-Text</div>
                    <div className="text-[11px] text-[#5f6368]">
                      Transcribe non-signing participant speech into real-time subtitles
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableSpeechRecognition(!enableSpeechRecognition)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      enableSpeechRecognition ? "bg-[#1a73e8]" : "bg-[#dadce0]"
                    }`}
                    role="switch"
                    aria-checked={enableSpeechRecognition}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        enableSpeechRecognition ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                    Speech Recognition Language
                  </label>
                  <select
                    value={speechRecognitionLanguage}
                    onChange={(e) => setSpeechRecognitionLanguage(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 bg-white border border-[#dadce0] rounded-xl text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="hi-IN">Hindi (India)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 4. Gemini AI Fallback Section */}
            <section className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ea4335]" />
                  <h2 className="text-base font-semibold text-[#202124]">Gemini AI Fallback</h2>
                </div>
                <span className="text-[11px] text-[#5f6368]">Optional Cloud Classifier</span>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-[#202124]">Enable Gemini AI Assistant</div>
                    <div className="text-[11px] text-[#5f6368]">
                      Use multimodal Gemini when local confidence falls below threshold
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableGeminiFallback(!enableGeminiFallback)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      enableGeminiFallback ? "bg-[#1a73e8]" : "bg-[#dadce0]"
                    }`}
                    role="switch"
                    aria-checked={enableGeminiFallback}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        enableGeminiFallback ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                {enableGeminiFallback && (
                  <div>
                    <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={geminiApiKey || ""}
                        onChange={(e) => setGeminiApiKey(e.target.value || null)}
                        placeholder="AIzaSy..."
                        className="w-full px-3.5 py-2 pr-10 bg-white border border-[#dadce0] rounded-xl text-xs font-mono text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#70757a] mt-1">
                      Stored in your browser localStorage, never sent to third-party servers.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 5. Appearance & Accessibility */}
            <section className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-[#202124] mb-4 flex items-center gap-2">
                <Contrast className="w-5 h-5 text-[#1a73e8]" />
                Appearance & Accessibility
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-colors ${
                          theme === t
                            ? "bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]"
                            : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="text-xs font-semibold text-[#202124]">High Contrast Mode</div>
                    <div className="text-[11px] text-[#5f6368]">
                      Enhance edge contrast and text sharpness for maximum readability
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      highContrast ? "bg-[#1a73e8]" : "bg-[#dadce0]"
                    }`}
                    role="switch"
                    aria-checked={highContrast}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        highContrast ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
