import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar, Footer } from "../components";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Camera,
  CameraOff,
  ChevronRight,
  Star,
  Hand,
  BookOpen,
  Sparkles,
  RotateCcw,
  Trophy,
  Play,
  Loader2,
  Zap,
} from "lucide-react";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import { drawMultiHandLandmarks, extractFeatures } from "../lib/classifier/landmarks";
import { classifyWithGemini, isGeminiConfigured } from "../lib/gemini/fallback";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { SignLabel } from "../lib/constants";
import { useAuthStore } from "../stores";

export const Route = createFileRoute("/learn")({
  component: LearnPage,
});

// ─── ASL Sign Lessons ──────────────────────────────────────────────────────
const LESSONS: Lesson[] = [
  {
    id: "hello",
    sign: "Hello",
    emoji: "👋",
    shortDesc: "A friendly wave greeting",
    howTo: [
      "Hold your dominant hand flat with all fingers together, palm facing outward",
      "Touch your fingertips to your forehead like a salute",
      "Move your hand outward and away from your forehead in a smooth outward arc",
      "The motion is similar to a casual relaxed salute",
    ],
    tips: "Keep fingers straight and together. The movement should be relaxed and natural. High spread fingers fanned wide is the key static pose.",
    handShape: "Open B hand: all fingers extended and held together, thumb relaxed to the side",
    localVideo: "/videos/hello_vid.mp4",
    videoCredit: "Ishara demonstration video",
  },
  {
    id: "thankyou",
    sign: "Thank You",
    emoji: "🙏",
    shortDesc: "Express gratitude",
    howTo: [
      "Hold your dominant hand flat with all four fingers straight and held close together",
      "Touch the tips of your fingers to your chin or lips, palm facing inward",
      "Move your hand forward and slightly downward away from your face",
      "The movement flows from your chin outward, like blowing a gentle kiss",
    ],
    tips: "Important: fingers must be held together. Keep all four fingers pressed close and straight.",
    handShape: "Flat B hand: four fingers straight and pressed together, thumb tucked or resting beside index",
    localVideo: "/videos/thankyou_vid.mp4",
    videoCredit: "Ishara demonstration video",
  },
  {
    id: "sorry",
    sign: "Sorry",
    emoji: "💙",
    shortDesc: "Apologise sincerely",
    howTo: [
      "Make a fist with your dominant hand (A hand shape, all fingers curled tightly)",
      "Place the fist flat against your chest over your heart area",
      "Move the fist in a slow circular motion on your chest (clockwise from your view)",
      "Repeat the circular motion 2 to 3 times while looking sincere",
    ],
    tips: "The circular chest motion is the entire sign. Keep fingers tightly curled into a fist. Do not extend any fingers.",
    handShape: "A hand: closed fist with thumb resting against the side, all fingers curled tightly",
    localVideo: "/videos/sorry_vid.mp4",
    videoCredit: "Ishara demonstration video",
  },
  {
    id: "bye",
    sign: "Bye",
    emoji: "✋",
    shortDesc: "Say farewell",
    howTo: [
      "Hold your dominant hand up high with all fingers extended and spread open",
      "Bend and straighten your fingers repeatedly in a wave motion",
      "Palm faces outward toward the person you are saying goodbye to",
      "Repeat the open and close wave motion 2 to 3 times",
    ],
    tips: "Very similar to a normal wave. Extended and spread fingers opening and closing is the key motion.",
    handShape: "5 hand: all five fingers spread open and extended wide",
    videoUrl: "https://www.signingsavvy.com/media/mp4-ld/2/2196.mp4",
    videoCredit: "SigningSavvy",
  },
  {
    id: "help",
    sign: "Help",
    emoji: "🤝",
    shortDesc: "Ask for assistance",
    howTo: [
      "Make a thumbs up with your dominant hand: only the thumb extends, all other fingers curl tightly into a fist",
      "Place your non-dominant hand flat and open (palm facing up) in front of you",
      "Place your thumbs up fist on top of the open flat hand",
      "Lift both hands upward together in one smooth upward motion",
    ],
    tips: "This is a two handed sign. The thumb up hand sits on the flat hand. The lifting motion symbolises one person supporting another.",
    handShape: "Dominant: A hand with thumb up. Non-dominant: B hand flat with palm facing up",
    videoUrl: "https://www.signingsavvy.com/media/mp4-ld/2/2192.mp4",
    videoCredit: "SigningSavvy",
  },
];

type Lesson = {
  id: string;
  sign: SignLabel | string;
  emoji: string;
  shortDesc: string;
  howTo: string[];
  tips: string;
  handShape: string;
  videoUrl?: string;
  localVideo?: string;
  videoId?: string;
  videoCredit?: string;
};

type Stage = "pick" | "learn" | "test" | "result";

// ─── Main Page ─────────────────────────────────────────────────────────────
function LearnPage() {
  const [stage, setStage] = useState<Stage>("pick");
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [testResult, setTestResult] = useState<"correct" | "incorrect" | null>(null);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);

  const handleSelectLesson = (lesson: Lesson) => {
    setSelected(lesson);
    setStage("learn");
    setTestResult(null);
    setDetectedSign(null);
  };

  const handleStartTest = () => {
    setStage("test");
    setTestResult(null);
    setDetectedSign(null);
  };

  const handleSuccess = useCallback((sign: string) => {
    if (!selected) return;
    setDetectedSign(sign);
    setTestResult("correct");
    setMasteredIds((prev) => new Set([...prev, selected.id]));
    setTimeout(() => {
      setStage("result");
    }, 1000);
  }, [selected]);

  const handleNext = () => {
    const currentIdx = LESSONS.findIndex((l) => l.id === selected?.id);
    const next = LESSONS[currentIdx + 1];
    if (next) {
      handleSelectLesson(next);
    } else {
      setStage("pick");
    }
  };

  const handleBack = () => {
    if (stage === "test" || stage === "learn") {
      setStage(stage === "test" ? "learn" : "pick");
      setTestResult(null);
      setDetectedSign(null);
    } else {
      setStage("pick");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {stage === "pick" && (
            <PickStage
              lessons={LESSONS}
              masteredIds={masteredIds}
              onSelect={handleSelectLesson}
            />
          )}
          {stage === "learn" && selected && (
            <LearnStage lesson={selected} onStartTest={handleStartTest} onBack={handleBack} />
          )}
          {stage === "test" && selected && (
            <TestStage
              lesson={selected}
              testResult={testResult}
              detectedSign={detectedSign}
              onSuccess={handleSuccess}
              onBack={handleBack}
            />
          )}
          {stage === "result" && selected && (
            <ResultStage
              lesson={selected}
              masteredCount={masteredIds.size}
              totalCount={LESSONS.length}
              onNext={handleNext}
              onBackToList={() => setStage("pick")}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Stage 1: Pick a Word (Categories) ──────────────────────────────────────
function PickStage({
  lessons,
  masteredIds,
  onSelect,
}: {
  lessons: Lesson[];
  masteredIds: Set<string>;
  onSelect: (l: Lesson) => void;
}) {
  return (
    <div>
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-semibold mb-4 border border-[#c5dbff]">
          <BookOpen className="w-3.5 h-3.5" />
          Interactive ASL Library
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0d1117] tracking-tight mb-3">
          Learn Sign Language
        </h1>
        <p className="text-[#5f6368] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Choose a sign below to open its lesson, watch the video demonstration, and practice with your camera.
        </p>
        {masteredIds.size > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#e6f4ea] text-[#34a853] rounded-full text-sm font-semibold border border-[#ceead6]">
            <Trophy className="w-4 h-4" />
            {masteredIds.size} of {lessons.length} mastered
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {lessons.map((lesson, idx) => {
          const mastered = masteredIds.has(lesson.id);

          return (
            <button
              key={lesson.id}
              onClick={() => onSelect(lesson)}
              className={`group text-left p-6 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                mastered
                  ? "border-[#34a853] bg-[#f0faf3]"
                  : "border-[#e8eaed] bg-white hover:border-[#1a73e8] hover:-translate-y-0.5"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{lesson.emoji}</span>
                  {mastered ? (
                    <div className="bg-[#34a853] text-white p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-1 rounded-full">
                      Lesson {idx + 1}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-[#0d1117] group-hover:text-[#1a73e8] transition-colors mb-1.5">
                  {lesson.sign}
                </h3>
                <p className="text-sm text-[#5f6368] leading-relaxed mb-4">
                  {lesson.shortDesc}
                </p>

                <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#f1f3f4]">
                  <p className="text-xs text-[#3c4043] font-medium">
                    <span className="font-bold text-[#1a73e8]">Pose: </span>
                    {lesson.handShape}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-sm font-bold text-[#1a73e8]">
                <span>Start Lesson</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stage 2: Learn It ──────────────────────────────────────────────────────
function LearnStage({
  lesson,
  onStartTest,
  onBack,
}: {
  lesson: Lesson;
  onStartTest: () => void;
  onBack: () => void;
}) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#202124] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to word list
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e8eaed] overflow-hidden shadow-sm mb-5">
        <div className="bg-[#1a73e8] px-6 py-5 text-white">
          <div className="text-4xl mb-2">{lesson.emoji}</div>
          <h2 className="text-2xl font-semibold">{lesson.sign}</h2>
          <p className="text-blue-100 text-sm mt-1">{lesson.shortDesc}</p>
        </div>

        {/* Video demo */}
        <div className="p-5 border-b border-[#f1f3f4]">
          <h3 className="text-sm font-semibold text-[#3c4043] mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#1a73e8]" /> Video Demonstration
          </h3>
          {!videoError ? (
            <div className="rounded-xl overflow-hidden bg-[#000] border border-[#e8eaed]">
              <video
                key={lesson.id}
                src={lesson.localVideo || lesson.videoUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full max-h-64 object-contain mx-auto"
              />
              <p className="text-center text-[11px] text-[#80868b] py-1.5 bg-[#f8f9fa] border-t border-[#f1f3f4]">
                Video: {lesson.videoCredit || "Demonstration"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#f8f9fa] border border-[#e8eaed] p-8 text-center">
              <Hand className="w-10 h-10 text-[#dadce0] mx-auto mb-2" />
              <p className="text-sm text-[#5f6368]">Video unavailable: follow the steps below</p>
            </div>
          )}
        </div>

        {/* Hand shape */}
        <div className="px-5 py-4 border-b border-[#f1f3f4] bg-[#fafbff]">
          <h3 className="text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">Hand Shape</h3>
          <p className="text-sm text-[#5f6368]">{lesson.handShape}</p>
        </div>

        {/* How-to steps */}
        <div className="px-5 py-4 border-b border-[#f1f3f4]">
          <h3 className="text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-3">How to Sign It</h3>
          <ol className="space-y-2.5">
            {lesson.howTo.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a73e8] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#3c4043] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Pro tip */}
        <div className="px-5 py-4 bg-[#fef9e7]">
          <h3 className="text-xs font-semibold text-[#f9a825] uppercase tracking-wider mb-1">Pro Tip</h3>
          <p className="text-sm text-[#5f6368]">{lesson.tips}</p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStartTest}
        className="w-full py-3.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-base"
      >
        <Camera className="w-5 h-5" />
        Test What I've Learned
        <ArrowRight className="w-5 h-5" />
      </button>
      <p className="text-center text-xs text-[#80868b] mt-2">Your camera will open: show the gesture and we will detect it</p>
    </div>
  );
}

// ─── Stage 3: Test It ───────────────────────────────────────────────────────
function TestStage({
  lesson,
  testResult,
  detectedSign,
  onSuccess,
  onBack,
}: {
  lesson: Lesson;
  testResult: "correct" | "incorrect" | null;
  detectedSign: string | null;
  onSuccess: (sign: string) => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camStarted, setCamStarted] = useState(true);
  const [holdProgress, setHoldProgress] = useState(0);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const { geminiApiKey } = useSettingsStore();
  const hasGemini = isGeminiConfigured(geminiApiKey);

  const { stream, error: streamError } = useMediaStream({ video: camStarted, audio: false });

  // Attach camera stream to video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const { landmarks, multiLandmarks, isRunning, start, stop } = useMediaPipe({
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    numHands: 2,
  });

  // Start tracking as soon as camera stream is ready
  useEffect(() => {
    if (stream && !isRunning) {
      start();
    }
  }, [stream, isRunning, start]);

  // Draw skeleton on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (videoRef.current && videoRef.current.videoWidth > 0) {
      if (
        canvasRef.current.width !== videoRef.current.videoWidth ||
        canvasRef.current.height !== videoRef.current.videoHeight
      ) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
    }

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (multiLandmarks && multiLandmarks.length > 0) {
      drawMultiHandLandmarks(ctx, multiLandmarks, {
        showCoordinates: true,
        radius: 4,
        lineWidth: 2.5,
      });
    }
  }, [multiLandmarks]);

  const handleStop = () => {
    stop();
    setCamStarted(false);
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const handleStart = () => {
    setCamStarted(true);
  };

  useEffect(() => () => { handleStop(); }, []);

  const {
    prediction,
    confidence,
    isLowConfidence,
    isAiResolving,
  } = useLocalClassifier({
    landmarks,
    multiLandmarks,
    enabled: isRunning && testResult !== "correct",
    confidenceThreshold: 0.44,
    targetSign: lesson.sign,
  });

  // Check if current prediction matches target lesson sign
  const isTargetMatch = Boolean(
    prediction &&
      prediction.toLowerCase().trim() === lesson.sign.toLowerCase().trim() &&
      confidence >= 0.46
  );

  // Hold-to-verify timer
  useEffect(() => {
    if (testResult === "correct") return;

    let timer: any;
    if (isTargetMatch) {
      timer = setInterval(() => {
        setHoldProgress((prev) => {
          const next = prev + 25;
          if (next >= 100) {
            clearInterval(timer);
            onSuccess(lesson.sign);
            return 100;
          }
          return next;
        });
      }, 120);
    } else {
      setHoldProgress(0);
    }

    return () => clearInterval(timer);
  }, [isTargetMatch, testResult, lesson.sign, onSuccess]);

  // Direct AI Analysis
  const handleAnalyzeWithAi = async () => {
    if (isAnalyzingAi) return;
    setIsAnalyzingAi(true);
    setAiFeedback("Analyzing hand sign with AI...");

    try {
      let imageDataUrl: string | null = null;
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const offscreen = document.createElement("canvas");
        offscreen.width = 320;
        offscreen.height = 240;
        const offCtx = offscreen.getContext("2d");
        if (offCtx) {
          offCtx.drawImage(videoRef.current, 0, 0, 320, 240);
          imageDataUrl = offscreen.toDataURL("image/jpeg", 0.75);
        }
      }

      const primaryHand = (multiLandmarks && multiLandmarks[0]) || landmarks || null;
      const feat = primaryHand ? extractFeatures(primaryHand) : null;

      const aiResult = await classifyWithGemini({
        features: feat,
        imageDataUrl,
        targetSign: lesson.sign,
        apiKey: geminiApiKey,
      });

      if (aiResult) {
        const matchesTarget =
          aiResult.label.toLowerCase().trim() === lesson.sign.toLowerCase().trim() ||
          aiResult.isTarget;

        if (matchesTarget && aiResult.confidence >= 0.5) {
          setAiFeedback(`AI confirmed "${aiResult.label}" (${Math.round(aiResult.confidence * 100)}%)! Excellent job!`);
          setHoldProgress(100);
          setTimeout(() => {
            onSuccess(lesson.sign);
          }, 600);
        } else {
          setAiFeedback(
            `AI detected: ${aiResult.label} (${Math.round(aiResult.confidence * 100)}%). ${aiResult.explanation || `Try to ${lesson.howTo[0]}`}`
          );
        }
      } else {
        setAiFeedback("Could not determine sign clearly. Please ensure your hand is well-lit and centered.");
      }
    } catch {
      setAiFeedback("AI check failed. Please check your connection.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#202124] mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to lesson
      </button>

      <div className="bg-white rounded-2xl border border-[#e8eaed] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f3f4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center text-xl">
              {lesson.emoji}
            </div>
            <div>
              <h2 className="font-bold text-[#202124] text-base sm:text-lg">Test: {lesson.sign}</h2>
              <p className="text-xs text-[#5f6368]">Show the gesture to your camera</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f1f3f4] text-[#3c4043] border border-[#dadce0]">
              <Sparkles className="w-3.5 h-3.5 text-[#1a73e8]" />
              AI Recognition
            </span>
            {testResult === "correct" && (
              <div className="flex items-center gap-1.5 text-[#34a853] font-bold text-sm bg-[#e6f4ea] px-3 py-1 rounded-full border border-[#ceead6]">
                <CheckCircle2 className="w-4 h-4" /> Correct!
              </div>
            )}
          </div>
        </div>

        {/* Camera area */}
        <div className="p-5">
          <div
            className="relative rounded-2xl overflow-hidden bg-[#202124] mx-auto shadow-inner"
            style={{ maxWidth: 520, aspectRatio: "4/3" }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              width={520}
              height={390}
              className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none"
            />

            {/* Overlay when not started */}
            {!camStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124] text-white p-4 text-center">
                <Camera className="w-12 h-12 text-[#9aa0a6] mb-3" />
                <p className="text-base font-semibold mb-1">Camera is off</p>
                <p className="text-xs text-[#9aa0a6] max-w-xs mb-4">
                  Click start to activate hand tracking and test your sign
                </p>
                <button
                  onClick={handleStart}
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Live Detection Badge (Top Left) */}
            {camStarted && (
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md backdrop-blur-md transition-all ${
                    isTargetMatch
                      ? "bg-[#34a853]/90 text-white ring-2 ring-white/50 animate-pulse"
                      : prediction
                      ? "bg-[#202124]/85 text-white border border-white/20"
                      : "bg-[#202124]/75 text-[#dadce0] border border-white/10"
                  }`}
                >
                  {isTargetMatch ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lesson.sign} Detected! ({Math.round(confidence * 100)}%)</span>
                    </>
                  ) : prediction ? (
                    <>
                      <Hand className="w-3.5 h-3.5 text-[#f9ab00]" />
                      <span>Seeing: {prediction} ({Math.round(confidence * 100)}%)</span>
                    </>
                  ) : isAiResolving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8ab4f8]" />
                      <span>AI resolving...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-[#9aa0a6]" />
                      <span>Waiting for hand...</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Top Right: AI Status */}
            {camStarted && (
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#202124]/80 text-[#8ab4f8] border border-[#8ab4f8]/30 backdrop-blur-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {hasGemini ? "AI Ready" : "MediaPipe Vision"}
                </span>
              </div>
            )}

            {/* Hold Progress Bar overlay at bottom of video */}
            {camStarted && isTargetMatch && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-white">
                  <span>Hold steady to verify...</span>
                  <span>{holdProgress}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#34a853] transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Guidance Feedback Box */}
          <div className="mt-4 p-4 rounded-xl border transition-colors bg-[#f8f9fa] border-[#e8eaed]">
            {isTargetMatch ? (
              <div className="flex items-center gap-3 text-[#137333]">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">Perfect sign shape!</p>
                  <p className="text-xs text-[#1e8e3e]">Keep holding your hand steady to complete this lesson.</p>
                </div>
              </div>
            ) : prediction ? (
              <div className="flex items-start gap-3 text-[#3c4043]">
                <Hand className="w-5 h-5 flex-shrink-0 text-[#1a73e8] mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-sm text-[#202124] mb-0.5">
                    Currently detected: <span className="text-[#1a73e8] font-bold">{prediction}</span>
                  </p>
                  <p className="text-[#5f6368] leading-relaxed">
                    Target is <span className="font-semibold text-[#202124]">{lesson.sign}</span>: {lesson.tips}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[#5f6368]">
                <Camera className="w-5 h-5 flex-shrink-0 text-[#80868b]" />
                <p className="text-xs">
                  Hold your hand upright in the camera frame to show the <span className="font-semibold text-[#202124]">{lesson.sign}</span> sign.
                </p>
              </div>
            )}

            {/* AI Custom Feedback Message */}
            {aiFeedback && (
              <div className="mt-3 pt-3 border-t border-[#e8eaed] flex items-start gap-2 text-xs text-[#1a73e8]">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{aiFeedback}</p>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            {/* Direct AI Analysis Button */}
            <button
              onClick={handleAnalyzeWithAi}
              disabled={isAnalyzingAi || !camStarted}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#1a73e8] to-[#1557b0] hover:from-[#1557b0] hover:to-[#0d47a1] disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
            >
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#fbbc04]" />
                  Verify Sign with AI
                </>
              )}
            </button>

            {camStarted ? (
              <button
                onClick={handleStop}
                className="py-2.5 px-4 border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4] font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <CameraOff className="w-4 h-4" /> Stop Camera
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Camera className="w-4 h-4" /> Start Camera
              </button>
            )}
          </div>
        </div>

        {/* Reminder footer */}
        <div className="px-5 py-3 bg-[#f8f9fa] border-t border-[#f1f3f4]">
          <p className="text-xs text-[#5f6368] text-center">
            Reminder: <span className="font-medium text-[#3c4043]">{lesson.howTo[0]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Stage 4: Result / Congrats ────────────────────────────────────────────
function ResultStage({
  lesson,
  masteredCount,
  totalCount,
  onNext,
  onBackToList,
}: {
  lesson: Lesson;
  masteredCount: number;
  totalCount: number;
  onNext: () => void;
  onBackToList: () => void;
}) {
  const isAllDone = masteredCount === totalCount;

  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className="w-20 h-20 rounded-full bg-[#e6f4ea] flex items-center justify-center mx-auto mb-5">
        {isAllDone ? (
          <Trophy className="w-10 h-10 text-[#34a853]" />
        ) : (
          <CheckCircle2 className="w-10 h-10 text-[#34a853]" />
        )}
      </div>

      <h2 className="text-2xl font-semibold text-[#202124] mb-2">
        {isAllDone ? "All Signs Mastered!" : `Nailed it! ${lesson.emoji}`}
      </h2>
      <p className="text-[#5f6368] mb-6 text-sm">
        {isAllDone
          ? "You have mastered all 5 signs. You're ready to start a real conversation!"
          : `You correctly signed "${lesson.sign}". Keep going!`}
      </p>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-[#5f6368] mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-[#202124]">{masteredCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-[#e8eaed] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#34a853] rounded-full transition-all duration-500"
            style={{ width: `${(masteredCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {Array.from({ length: totalCount }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < masteredCount ? "text-[#f9ab00] fill-[#f9ab00]" : "text-[#dadce0]"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {!isAllDone && (
          <button
            onClick={onNext}
            className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Next Word <ArrowRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onBackToList}
          className="w-full py-3 border border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4] font-medium rounded-xl transition-colors"
        >
          {isAllDone ? "Review All Signs" : "Back to Word List"}
        </button>
        {isAllDone && (
          <a
            href="/room"
            className="w-full py-3 bg-[#34a853] hover:bg-[#2d9244] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Start a Real Call
          </a>
        )}
      </div>
    </div>
  );
}
