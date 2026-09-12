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

interface LessonItem {
  sign: SignLabel;
  title: string;
  unit: number;
  unitTitle: string;
  description: string;
  handIllustration: string;
  tips: string[];
}

const LESSONS: LessonItem[] = [
  {
    sign: "Hello",
    title: "Greeting (Hello)",
    unit: 1,
    unitTitle: "Unit 1: Essentials & Greetings",
    description: "Open palm facing forward towards the camera with all five fingers spread naturally.",
    handIllustration: "🖐️",
    tips: [
      "Keep your palm facing directly at the camera lens.",
      "Spread all fingers apart comfortably.",
      "Hold your hand at chest height.",
    ],
  },
  {
    sign: "Thank You",
    title: "Gratitude (Thank You)",
    unit: 1,
    unitTitle: "Unit 1: Essentials & Greetings",
    description: "Flat hand with all four fingers straight, pressed together, thumb alongside palm.",
    handIllustration: "✋",
    tips: [
      "Keep all four fingers pressed closely together.",
      "Keep your palm flat without curling knuckles.",
      "Extend your hand forward gently.",
    ],
  },
  {
    sign: "Please",
    title: "Politeness (Please)",
    unit: 1,
    unitTitle: "Unit 1: Essentials & Greetings",
    description: "Form an 'OK' ring with your thumb and index fingertip touching, remaining three fingers extended.",
    handIllustration: "👌",
    tips: [
      "Touch the tips of your thumb and index finger together.",
      "Keep middle, ring, and pinky fingers upright.",
      "Hold the circular ring steady.",
    ],
  },
  {
    sign: "Yes",
    title: "Affirmation (Yes)",
    unit: 2,
    unitTitle: "Unit 2: Responses & Agreement",
    description: "Closed fist with thumb resting comfortably against the side of your curled fingers.",
    handIllustration: "✊",
    tips: [
      "Curl all four fingers completely into your palm.",
      "Rest your thumb against your index finger side.",
      "Present the front of your knuckles clearly.",
    ],
  },
  {
    sign: "No",
    title: "Negation (No)",
    unit: 2,
    unitTitle: "Unit 2: Responses & Agreement",
    description: "Index and middle fingers extended straight upward and pressed together, other fingers curled.",
    handIllustration: "✌️",
    tips: [
      "Point index and middle fingers straight up.",
      "Keep them pressed tightly together.",
      "Tuck ring finger and pinky into your palm with thumb.",
    ],
  },
  {
    sign: "Good",
    title: "Approval (Good)",
    unit: 2,
    unitTitle: "Unit 2: Responses & Agreement",
    description: "Peace / Victory shape — index and middle fingers extended in an open, wide V shape.",
    handIllustration: "✌️",
    tips: [
      "Spread index and middle finger apart into a V.",
      "Palm can face slightly towards the camera.",
      "Keep wrist steady.",
    ],
  },
  {
    sign: "Sorry",
    title: "Apology (Sorry)",
    unit: 3,
    unitTitle: "Unit 3: Emotions & Requests",
    description: "Thumb and little pinky finger extended out, with the middle three fingers curled in.",
    handIllustration: "🤙",
    tips: [
      "Extend your thumb and little finger fully.",
      "Curl middle three fingers firmly into palm.",
      "Often known as the shaka / apology sign shape.",
    ],
  },
  {
    sign: "Help",
    title: "Assistance (Help)",
    unit: 3,
    unitTitle: "Unit 3: Emotions & Requests",
    description: "Thumbs up gesture — thumb pointed straight upward, all four other fingers curled in a fist.",
    handIllustration: "👍",
    tips: [
      "Point your thumb straight up towards the ceiling.",
      "Curl all other fingers into a neat fist.",
      "Hold with a clear, positive gesture.",
    ],
  },
];

function LearnPage() {
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [stage, setStage] = useState<"learn" | "test" | "success">("learn");

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

  // Camera & MediaPipe testing state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);

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

  // MediaStream for live practice test
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

  // Landmark canvas drawing
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
      color: "#1a73e8",
      connectionColor: "rgba(26, 115, 232, 0.5)",
      radius: 4,
      lineWidth: 2,
    });
  }, [landmarks, stage, showWireframe]);

  // Sign detection callback during testing
  const handleSignDetected = useCallback(
    (detectedSign: SignLabel, confidence: number) => {
      if (stage !== "test" || !selectedLesson) return;

      if (detectedSign === selectedLesson.sign) {
        setMatchScore(confidence);
        setHoldProgress((prev) => {
          const next = prev + 25;
          if (next >= 100) {
            // Passed test!
            handleLessonSuccess(selectedLesson.sign, confidence);
            return 100;
          }
          return next;
        });
      } else {
        setMatchScore(0.2);
        setHoldProgress((prev) => Math.max(0, prev - 10));
      }
    },
    [stage, selectedLesson]
  );

  useLocalClassifier({
    landmarks,
    onSignDetected: handleSignDetected,
    enabled: stage === "test",
  });

  // Success handler
  const handleLessonSuccess = (sign: SignLabel, score: number) => {
    setStage("success");

    // Update local state & storage
    const newCompleted = Array.from(new Set([...completedSigns, sign]));
    setCompletedSigns(newCompleted);
    localStorage.setItem("ishara_mastered_signs", JSON.stringify(newCompleted));

    const newXp = xp + 50;
    setXp(newXp);
    localStorage.setItem("ishara_user_xp", String(newXp));

    // Sync to Supabase
    syncProgressToSupabase(userId, sign, score, true);

    // Check for badge unlocks
    if (newCompleted.length >= 1) {
      unlockSupabaseBadge(userId, "first_sign", "First Sign");
    }
    if (newCompleted.length >= 5) {
      unlockSupabaseBadge(userId, "sign_scholar", "Sign Scholar");
    }
    if (newCompleted.length >= 8) {
      unlockSupabaseBadge(userId, "sign_master", "Master of Ishara");
    }
  };

  const startLesson = (lesson: LessonItem) => {
    setSelectedLesson(lesson);
    setStage("learn");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Top Header & Duolingo-style XP / Streaks Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#dadce0] rounded-2xl p-6 mb-8 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Learning Academy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-normal text-[#202124] tracking-tight">
                Learn Sign Language
              </h1>
              <p className="text-xs sm:text-sm text-[#5f6368] mt-1">
                Step-by-step interactive lessons powered by live MediaPipe camera feedback.
              </p>
            </div>

            {/* Gamification Stats Bar */}
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
                <span>Leaderboard</span>
              </Link>
            </div>
          </div>

          {/* Active Lesson Modal / View */}
          {selectedLesson ? (
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 sm:p-8 mb-8 shadow-md">
              {/* Back to roadmap */}
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="text-xs text-[#5f6368] hover:text-[#202124] flex items-center gap-1.5 mb-6 font-medium"
              >
                &larr; Back to Curriculum
              </button>

              {/* Stage 1: Learn the Sign */}
              {stage === "learn" && (
                <div className="max-w-2xl mx-auto text-center space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-[#e8f0fe] border-2 border-[#1a73e8]/20 flex items-center justify-center text-5xl shadow-sm">
                    {selectedLesson.handIllustration}
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#1a73e8]">
                      {selectedLesson.unitTitle}
                    </span>
                    <h2 className="text-2xl font-bold text-[#202124] mt-1">
                      {selectedLesson.title}
                    </h2>
                    <p className="text-sm text-[#5f6368] mt-2 leading-relaxed">
                      {selectedLesson.description}
                    </p>
                  </div>

                  {/* Visual Instructions Cards */}
                  <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-5 text-left space-y-2.5">
                    <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#fbbc04]" />
                      <span>Forming the Gesture Accurately:</span>
                    </div>
                    {selectedLesson.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#5f6368]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34a853] flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>

                  {/* Start Camera Test Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setStage("test")}
                      className="w-full sm:w-auto px-8 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-xl shadow-md transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Start Camera Practice Test
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Interactive Camera Test */}
              {stage === "test" && (
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Left: Camera Feed with Skeleton */}
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-[#dadce0]">
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

                    {/* Landmark toggle */}
                    <button
                      type="button"
                      onClick={() => setShowWireframe(!showWireframe)}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors text-xs flex items-center gap-1"
                    >
                      {showWireframe ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{showWireframe ? "Wireframe" : "Camera"}</span>
                    </button>

                    {/* Live Match Bar overlay */}
                    <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md rounded-xl p-3 text-white flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold">Target: {selectedLesson.sign}</div>
                        <div className="text-[11px] text-gray-300">
                          {matchScore > 0.5 ? "Hold gesture steady!" : "Perform the sign to test"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-[#34a853]">
                          {Math.round(matchScore * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Real-time Feedback & Hold Meter */}
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-semibold text-[#1a73e8] uppercase tracking-wider">
                        Real-Time AI Evaluation
                      </span>
                      <h3 className="text-xl font-bold text-[#202124] mt-1">
                        Show the "{selectedLesson.sign}" sign
                      </h3>
                      <p className="text-xs text-[#5f6368] mt-1">
                        Hold your hand in front of the camera so MediaPipe can analyze your 21 hand joints.
                      </p>
                    </div>

                    {/* Progress Fill Meter */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#202124]">Recognition Verification</span>
                        <span className="text-[#1a73e8]">{holdProgress}%</span>
                      </div>
                      <div className="h-3 w-full bg-[#e8eaed] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#34a853] transition-all duration-200"
                          style={{ width: `${holdProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-xl text-xs space-y-2">
                      <div className="font-semibold text-[#202124]">Sign Reference:</div>
                      <p className="text-[#5f6368]">{SIGN_HINTS[selectedLesson.sign]}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStage("learn")}
                        className="px-4 py-2 border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] text-xs font-medium rounded-lg transition-colors"
                      >
                        Review Sign Guide
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 3: Success Celebration Screen */}
              {stage === "success" && (
                <div className="max-w-md mx-auto text-center space-y-6 py-6 animate-in">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#ceead6] text-[#137333] flex items-center justify-center text-4xl shadow-md">
                    🎉
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-[#202124]">Sign Mastered!</h2>
                    <p className="text-sm text-[#5f6368] mt-1">
                      You successfully performed <strong>{selectedLesson.sign}</strong> with accurate hand orientation.
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

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLesson(null)}
                      className="flex-1 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
                    >
                      Continue Path
                    </button>
                    <Link
                      to="/leaderboard"
                      className="flex-1 py-2.5 bg-white border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] text-xs font-medium rounded-xl transition-colors text-center"
                    >
                      View Leaderboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Curriculum Units (Duolingo Style Lessons) */}
          <div className="space-y-8">
            {[1, 2, 3].map((unitNumber) => {
              const unitLessons = LESSONS.filter((l) => l.unit === unitNumber);
              const unitTitle = unitLessons[0]?.unitTitle || `Unit ${unitNumber}`;

              return (
                <div key={unitNumber} className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-[#e8eaed] pb-3">
                    <h2 className="text-base font-semibold text-[#202124]">{unitTitle}</h2>
                    <span className="text-xs text-[#5f6368]">
                      {unitLessons.filter((l) => completedSigns.includes(l.sign)).length} / {unitLessons.length} Completed
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {unitLessons.map((lesson) => {
                      const isCompleted = completedSigns.includes(lesson.sign);

                      return (
                        <div
                          key={lesson.sign}
                          onClick={() => startLesson(lesson)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isCompleted
                              ? "border-[#a8dab5] bg-[#ceead6]/20 hover:border-[#137333]"
                              : "border-[#dadce0] bg-white hover:border-[#1a73e8] hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-3xl">{lesson.handIllustration}</div>
                            {isCompleted ? (
                              <span className="p-1 bg-[#ceead6] text-[#137333] rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="text-xs text-[#1a73e8] font-medium flex items-center gap-0.5">
                                Start <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            <h3 className="font-semibold text-sm text-[#202124]">{lesson.sign}</h3>
                            <p className="text-xs text-[#5f6368] mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
