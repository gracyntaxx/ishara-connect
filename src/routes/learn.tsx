import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar, Footer } from "../components";
import {
  Sparkles,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Camera,
  Eye,
  EyeOff,
  Star,
  ChevronRight,
  Shield,
  Lightbulb,
  Zap,
  Play,
  Volume2,
  Lock,
  Unlock,
  Check,
} from "lucide-react";
import { SUPPORTED_SIGNS, SIGN_HINTS, SignLabel } from "../lib/constants";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import { drawLandmarks } from "../lib/classifier/landmarks";
import {
  syncProgressToSupabase,
  unlockSupabaseBadge,
  getSupabaseBadges,
} from "../lib/supabase";

export const Route = createFileRoute("/learn")({
  component: LearnPage,
});

export interface LevelItem {
  level: number;
  sign: SignLabel;
  title: string;
  category: "Greetings" | "Responses" | "Politeness" | "Assistance";
  description: string;
  handDiagram: {
    palmDirection: string;
    extendedFingers: string;
    motion: string;
  };
  keySteps: string[];
  sampleSentence: string;
}

export const LEVELS: LevelItem[] = [
  {
    level: 1,
    sign: "Hello",
    title: "Greeting (Hello)",
    category: "Greetings",
    description: "Raise open palm forward toward the camera with all five fingers spread naturally, waving gently.",
    handDiagram: {
      palmDirection: "Facing Camera (Forward)",
      extendedFingers: "All 5 fingers extended and spread",
      motion: "Side-to-side gentle waving motion",
    },
    keySteps: [
      "Position hand at chest height in center frame",
      "Face your palm directly at the webcam lens",
      "Spread all 5 fingers apart comfortably",
      "Hold still for 1.2s to verify gesture alignment",
    ],
    sampleSentence: "Hello! Nice to meet you.",
  },
  {
    level: 2,
    sign: "Thank You",
    title: "Gratitude (Thank You)",
    category: "Politeness",
    description: "Flat hand with all four fingers pressed together and thumb alongside, moving from chin forward.",
    handDiagram: {
      palmDirection: "Facing inward to chin, then forward",
      extendedFingers: "4 fingers straight and pressed together",
      motion: "Extend smoothly forward toward camera",
    },
    keySteps: [
      "Keep index, middle, ring, and pinky pressed together",
      "Keep palm completely flat (no curled knuckles)",
      "Move hand gently forward toward the other person",
    ],
    sampleSentence: "Thank you for your help today.",
  },
  {
    level: 3,
    sign: "Yes",
    title: "Affirmation (Yes)",
    category: "Responses",
    description: "Form a solid closed fist and nod the wrist up and down like a nodding head.",
    handDiagram: {
      palmDirection: "Knuckles facing camera",
      extendedFingers: "None (Fist closed, thumb across)",
      motion: "Gentle vertical nod of the wrist",
    },
    keySteps: [
      "Curl all four fingers firmly into your palm",
      "Rest your thumb against the side of your index finger",
      "Present front knuckles to camera and hold steady",
    ],
    sampleSentence: "Yes, I understand clearly.",
  },
  {
    level: 4,
    sign: "No",
    title: "Negation (No)",
    category: "Responses",
    description: "Extend index and middle fingers upward pressed closely together, while ring and pinky are tucked.",
    handDiagram: {
      palmDirection: "Facing camera",
      extendedFingers: "Index & Middle fingers straight together",
      motion: "Snap downward against thumb",
    },
    keySteps: [
      "Point index and middle fingers straight up",
      "Keep them pressed tightly together (two fingers)",
      "Tuck ring finger and pinky into palm with thumb",
    ],
    sampleSentence: "No, that is not required.",
  },
  {
    level: 5,
    sign: "Please",
    title: "Politeness (Please)",
    category: "Politeness",
    description: "Form an 'OK' circle with thumb and index tips touching, while middle, ring, and pinky stay extended.",
    handDiagram: {
      palmDirection: "Facing forward or chest",
      extendedFingers: "Middle, Ring, Pinky upright; Index + Thumb ring",
      motion: "Gentle circular rub or steady presentation",
    },
    keySteps: [
      "Touch the tips of your thumb and index finger together into an 'O'",
      "Keep remaining three fingers pointed upright",
      "Display the clear ring circle to the camera",
    ],
    sampleSentence: "Please repeat that once more.",
  },
  {
    level: 6,
    sign: "Good",
    title: "Approval (Good)",
    category: "Politeness",
    description: "The classic open Victory / V shape — index and middle fingers extended apart in a clear V.",
    handDiagram: {
      palmDirection: "Facing camera",
      extendedFingers: "Index & Middle spread wide in a V",
      motion: "Static upright posture",
    },
    keySteps: [
      "Extend index and middle fingers wide apart",
      "Curl ring and pinky fingers tightly against palm",
      "Hold wrist steady in the center of the frame",
    ],
    sampleSentence: "That is very good work!",
  },
  {
    level: 7,
    sign: "Help",
    title: "Assistance (Help)",
    category: "Assistance",
    description: "Thumbs-up gesture — thumb pointing straight up towards ceiling, all other fingers closed in a fist.",
    handDiagram: {
      palmDirection: "Side of fist to camera, thumb upright",
      extendedFingers: "Thumb only (pointed straight up)",
      motion: "Upward supporting motion",
    },
    keySteps: [
      "Curl all four fingers into a tight fist",
      "Point thumb straight up toward the ceiling",
      "Keep hand steady at mid-chest level",
    ],
    sampleSentence: "I need help with this sentence.",
  },
  {
    level: 8,
    sign: "Sorry",
    title: "Apology (Sorry)",
    category: "Politeness",
    description: "Extend thumb and pinky finger fully outward, while the middle three fingers remain tucked in palm.",
    handDiagram: {
      palmDirection: "Facing forward",
      extendedFingers: "Thumb and Pinky extended (Shaka/Y shape)",
      motion: "Gentle chest circular motion",
    },
    keySteps: [
      "Extend your thumb and little pinky finger fully out",
      "Tuck middle, ring, and index fingers into palm",
      "Present gesture clearly to camera",
    ],
    sampleSentence: "I am sorry for the delay.",
  },
];

// Synthesize a pleasant harmonic chime when completing a level
function playLevelUpChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Dual-tone harmonic chime (C5 + G5)
    [523.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.55);
    });
  } catch {
    // audio not allowed
  }
}

function LearnPage() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [selectedLevel, setSelectedLevel] = useState<LevelItem | null>(null);
  const [stage, setStage] = useState<"learn" | "test" | "celebrate">("learn");

  // User Stats & Progress
  const [completedSigns, setCompletedSigns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ishara_mastered_signs");
      return saved ? JSON.parse(saved) : ["Hello"];
    } catch {
      return ["Hello"];
    }
  });

  const [xp, setXp] = useState<number>(() => {
    return Number(localStorage.getItem("ishara_user_xp") || 150);
  });
  const [streak, setStreak] = useState<number>(() => {
    return Number(localStorage.getItem("ishara_user_streak") || 3);
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);

  // Camera & MediaPipe testing state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [feedbackTip, setFeedbackTip] = useState<string>("Show your hand clearly to the camera");

  const userId = useRef<string>(
    sessionStorage.getItem("ishara_user_id") ||
      `user_${Math.floor(100000 + Math.random() * 900000)}`
  ).current;

  // Load badges from Supabase
  useEffect(() => {
    getSupabaseBadges(userId).then((b) => {
      if (b && b.length > 0) {
        setUnlockedBadges(b.map((item: any) => item.badge_name));
      }
    });
  }, [userId]);

  // MediaStream for live practice test (camera startup speed optimized)
  const { stream, startStream, stopStream } = useMediaStream({
    video: stage === "test",
    audio: false,
  });

  useEffect(() => {
    if (videoRef.current && stream && stage === "test") {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, stage]);

  const { landmarks, isRunning, start: startMediaPipe, stop: stopMediaPipe } = useMediaPipe({
    videoRef,
  });

  // Start / stop camera and AI on entering test stage
  useEffect(() => {
    if (stage === "test") {
      startStream();
      startMediaPipe();
    } else {
      stopMediaPipe();
      stopStream();
      setHoldProgress(0);
      setMatchScore(0);
    }
  }, [stage, startStream, stopStream, startMediaPipe, stopMediaPipe]);

  // Landmark canvas drawing (blue glowing skeleton)
  useEffect(() => {
    if (!canvasRef.current || !landmarks || stage !== "test" || !showWireframe) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLandmarks(ctx, landmarks, {
      color: "#38bdf8",
      connectionColor: "rgba(14, 165, 233, 0.7)",
      radius: 4,
      lineWidth: 2.5,
    });
  }, [landmarks, stage, showWireframe]);

  // Handle successful mastery of a level
  const handleLevelMastered = useCallback(
    (levelItem: LevelItem, score: number) => {
      playLevelUpChime();
      setStage("celebrate");

      // Update completed signs
      const newCompleted = Array.from(new Set([...completedSigns, levelItem.sign]));
      setCompletedSigns(newCompleted);
      localStorage.setItem("ishara_mastered_signs", JSON.stringify(newCompleted));

      const newXp = xp + 50;
      setXp(newXp);
      localStorage.setItem("ishara_user_xp", String(newXp));

      // Sync progress & badges to Supabase
      syncProgressToSupabase(userId, levelItem.sign, score, true);
      if (newCompleted.length >= 1) unlockSupabaseBadge(userId, "first_sign", "First Sign");
      if (newCompleted.length >= 4) unlockSupabaseBadge(userId, "halfway_hero", "Sign Scholar");
      if (newCompleted.length >= 8) unlockSupabaseBadge(userId, "sign_master", "Master of Ishara");

      // AUTO-ADVANCE AUTOMATICALLY AFTER 1.5 SECONDS!
      const nextIdx = LEVELS.findIndex((l) => l.level === levelItem.level) + 1;
      setAutoAdvanceTimer(
        window.setTimeout(() => {
          if (nextIdx < LEVELS.length) {
            setSelectedLevel(LEVELS[nextIdx]);
            setCurrentLevelIdx(nextIdx);
            setStage("learn");
          } else {
            // Completed all levels!
            setSelectedLevel(null);
          }
        }, 1500)
      );
    },
    [completedSigns, xp, userId]
  );

  // Real-time classification & verification hold progress
  const handleSignDetected = useCallback(
    (detectedSign: SignLabel, confidence: number) => {
      if (stage !== "test" || !selectedLevel) return;

      if (detectedSign === selectedLevel.sign && confidence >= 0.55) {
        setMatchScore(confidence);
        setFeedbackTip("Perfect posture! Hold steady to pass...");
        setHoldProgress((prev) => {
          const next = prev + 20; // Reaches 100% in ~1.2 seconds of holding
          if (next >= 100) {
            handleLevelMastered(selectedLevel, confidence);
            return 100;
          }
          return next;
        });
      } else {
        setMatchScore(Math.max(0.1, confidence * 0.4));
        setHoldProgress((prev) => Math.max(0, prev - 8));
        setFeedbackTip(`Form the "${selectedLevel.sign}" hand shape as shown in the guide`);
      }
    },
    [stage, selectedLevel, handleLevelMastered]
  );

  useLocalClassifier({
    landmarks,
    onSignDetected: handleSignDetected,
    enabled: stage === "test",
  });

  const openLevel = (levelItem: LevelItem) => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    setSelectedLevel(levelItem);
    setCurrentLevelIdx(LEVELS.findIndex((l) => l.level === levelItem.level));
    setStage("learn");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Academy Header & Duolingo-style XP / Streak Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#dadce0] rounded-2xl p-6 mb-8 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level-by-Level Interactive Learning</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-normal text-[#202124] tracking-tight">
                Sign Language Learning Academy
              </h1>
              <p className="text-xs sm:text-sm text-[#5f6368] mt-1">
                Step through structured levels with video demonstration guides and live camera AI testing.
              </p>
            </div>

            {/* Gamification Stats */}
            <div className="flex items-center gap-4 bg-[#f8f9fa] border border-[#e8eaed] rounded-xl px-4 py-3 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ea4335]">
                <Flame className="w-4 h-4 fill-current" />
                <span>{streak} Days</span>
              </div>
              <div className="h-4 w-px bg-[#dadce0]" />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#fbbc04]">
                <Star className="w-4 h-4 fill-current" />
                <span>{xp} XP</span>
              </div>
              <div className="h-4 w-px bg-[#dadce0]" />
              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] hover:underline"
              >
                <Trophy className="w-4 h-4" />
                <span>Rankings</span>
              </Link>
            </div>
          </div>

          {/* Active Level Card */}
          {selectedLevel ? (
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 sm:p-8 mb-8 shadow-md">
              {/* Top Navigation Row */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8eaed]">
                <button
                  type="button"
                  onClick={() => setSelectedLevel(null)}
                  className="text-xs text-[#5f6368] hover:text-[#202124] flex items-center gap-1.5 font-medium transition-colors"
                >
                  &larr; Back to All Levels
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8]">
                    Level {selectedLevel.level} of {LEVELS.length}
                  </span>
                  <span className="text-xs text-[#5f6368]">{selectedLevel.category}</span>
                </div>
              </div>

              {/* Stage 1: Learn with Visual Demonstration Guide */}
              {stage === "learn" && (
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Left: Animated Demonstration Player Card */}
                  <div className="bg-[#1e2022] rounded-2xl p-6 text-white border border-[#3c4043] flex flex-col justify-between aspect-[4/3] shadow-inner relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#8ab4f8]">
                        Visual Demonstration
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        Level {selectedLevel.level}
                      </span>
                    </div>

                    {/* Rich Visual Demonstration Vector & Key Landmarks */}
                    <div className="my-auto flex flex-col items-center justify-center py-4 text-center">
                      <div className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-[#1a73e8]/20 to-[#4285f4]/30 border border-[#8ab4f8]/40 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
                        {/* Dynamic Vector Hand Illustration for specific sign */}
                        <div className="text-center">
                          <div className="text-5xl mb-1 filter drop-shadow">
                            {selectedLevel.sign === "Hello" && "🖐️"}
                            {selectedLevel.sign === "Thank You" && "✋"}
                            {selectedLevel.sign === "Yes" && "✊"}
                            {selectedLevel.sign === "No" && "✌️"}
                            {selectedLevel.sign === "Please" && "👌"}
                            {selectedLevel.sign === "Good" && "✌️"}
                            {selectedLevel.sign === "Help" && "👍"}
                            {selectedLevel.sign === "Sorry" && "🤙"}
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-[#8ab4f8]">
                            {selectedLevel.sign}
                          </span>
                        </div>

                        {/* Animated motion pulse ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#8ab4f8] animate-ping opacity-20 pointer-events-none" />
                      </div>

                      <div className="text-xs text-gray-300 font-medium">
                        Motion: <span className="text-white">{selectedLevel.handDiagram.motion}</span>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-[11px] text-gray-300 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400">Palm Direction: </span>
                        <span className="text-white font-medium">{selectedLevel.handDiagram.palmDirection}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400">Posture: </span>
                        <span className="text-white font-medium">{selectedLevel.handDiagram.extendedFingers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Step-by-Step Instructions & Start Button */}
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold text-[#202124]">
                        {selectedLevel.title}
                      </h2>
                      <p className="text-sm text-[#5f6368] mt-1.5 leading-relaxed">
                        {selectedLevel.description}
                      </p>
                    </div>

                    {/* Key Checklist Steps */}
                    <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4 space-y-2.5">
                      <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-[#fbbc04]" />
                        <span>Posture Checklist:</span>
                      </div>
                      {selectedLevel.keySteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#5f6368]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34a853] flex-shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#e8f0fe]/60 border border-[#d2e3fc] rounded-xl text-xs text-[#1a73e8]">
                      <strong>Real-world usage:</strong> "{selectedLevel.sampleSentence}"
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setStage("test")}
                        className="w-full sm:w-auto px-8 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" /> Start Camera Practice Test
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 2: Interactive Camera Test (Decent Size Viewport) */}
              {stage === "test" && (
                <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
                  {/* Clean Decent-Sized Camera Testing Viewport */}
                  <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-[#1a73e8]/30">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover -scale-x-100"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none -scale-x-100"
                    />

                    {/* Top Controls Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[11px] font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Testing: {selectedLevel.sign}
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowWireframe(!showWireframe)}
                        className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors text-[11px] flex items-center gap-1"
                      >
                        {showWireframe ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{showWireframe ? "Skeleton" : "Camera"}</span>
                      </button>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-xl p-3 text-white flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white">{feedbackTip}</div>
                        <div className="text-[10px] text-gray-400">Maintain posture for 1.2s to auto-advance</div>
                      </div>
                      <div className="text-right pl-3">
                        <div className="text-base font-bold font-mono text-emerald-400">
                          {Math.round(matchScore * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hold Progress Bar */}
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#202124]">Level Progress</span>
                      <span className="text-[#1a73e8]">{holdProgress}%</span>
                    </div>
                    <div className="h-3.5 w-full bg-[#e8eaed] rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#1a73e8] to-[#34a853] rounded-full transition-all duration-200"
                        style={{ width: `${holdProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStage("learn")}
                      className="px-4 py-2 border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] text-xs font-medium rounded-lg transition-colors"
                    >
                      &larr; Review Demonstration
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 3: Auto-Advance Celebration Screen */}
              {stage === "celebrate" && (
                <div className="max-w-md mx-auto text-center space-y-6 py-6 animate-in">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#ceead6] text-[#137333] flex items-center justify-center text-4xl shadow-md animate-bounce">
                    🎉
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#137333]">
                      Level {selectedLevel.level} Cleared!
                    </span>
                    <h2 className="text-2xl font-bold text-[#202124] mt-1">
                      {selectedLevel.sign} Mastered!
                    </h2>
                    <p className="text-sm text-[#5f6368] mt-1">
                      Outstanding! Advancing you automatically to the next level...
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0]">
                    <div className="text-center">
                      <div className="text-xs text-[#5f6368]">XP Earned</div>
                      <div className="text-lg font-bold text-[#fbbc04] mt-0.5">+50 XP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#5f6368]">Streak</div>
                      <div className="text-lg font-bold text-[#ea4335] mt-0.5">{streak} Days</div>
                    </div>
                  </div>

                  <div className="text-xs text-[#1a73e8] font-medium animate-pulse">
                    Auto-advancing to Level {selectedLevel.level < LEVELS.length ? selectedLevel.level + 1 : "Mastery"} in 1s...
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Structured Level Roadmap (Duolingo-style progression) */}
          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8eaed]">
              <div>
                <h2 className="text-lg font-bold text-[#202124]">Level Progression Path</h2>
                <p className="text-xs text-[#5f6368]">Master each sign level-by-level to complete your curriculum.</p>
              </div>
              <span className="text-xs font-semibold text-[#1a73e8]">
                {completedSigns.length} / {LEVELS.length} Mastered
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {LEVELS.map((item) => {
                const isMastered = completedSigns.includes(item.sign);
                const isCurrent = selectedLevel?.level === item.level;

                return (
                  <div
                    key={item.level}
                    onClick={() => openLevel(item)}
                    className={`group relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                      isMastered
                        ? "bg-[#e6f4ea]/40 border-[#ceead6] hover:border-[#34a853] hover:shadow-md"
                        : "bg-white border-[#dadce0] hover:border-[#1a73e8] hover:shadow-md"
                    } ${isCurrent ? "ring-2 ring-[#1a73e8]" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isMastered ? "bg-[#ceead6] text-[#137333]" : "bg-[#f1f3f4] text-[#5f6368]"
                        }`}
                      >
                        Level {item.level}
                      </span>
                      {isMastered ? (
                        <CheckCircle2 className="w-4 h-4 text-[#34a853]" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-[#80868b] group-hover:text-[#1a73e8] transition-colors" />
                      )}
                    </div>

                    <div className="text-base font-bold text-[#202124] group-hover:text-[#1a73e8] transition-colors">
                      {item.sign}
                    </div>
                    <div className="text-xs text-[#5f6368] mt-1 line-clamp-2">
                      {item.description}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-[11px] text-[#80868b]">
                      <span>{item.category}</span>
                      <span className="text-[#1a73e8] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {isMastered ? "Review" : "Start"} &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
