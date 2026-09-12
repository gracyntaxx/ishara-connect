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
} from "lucide-react";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import { drawMultiHandLandmarks } from "../lib/classifier/landmarks";
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

  const handleStartTest = () => setStage("test");

  const handleTestResult = useCallback((sign: SignLabel | string, confidence: number) => {
    if (!selected || confidence < 0.55) return;
    setDetectedSign(sign);
    const isCorrect = sign === selected.sign;
    setTestResult(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      setMasteredIds((prev) => new Set([...prev, selected.id]));
      setTimeout(() => setStage("result"), 800);
    }
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
              onSignDetected={handleTestResult}
              onBack={handleBack}
              onRetry={() => { setTestResult(null); setDetectedSign(null); }}
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
  onSignDetected,
  onBack,
  onRetry,
}: {
  lesson: Lesson;
  testResult: "correct" | "incorrect" | null;
  detectedSign: string | null;
  onSignDetected: (sign: SignLabel, confidence: number) => void;
  onBack: () => void;
  onRetry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camStarted, setCamStarted] = useState(false);

  const { stream } = useMediaStream({ video: camStarted, audio: false });

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

  // Draw skeleton on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (multiLandmarks && multiLandmarks.length > 0) {
      drawMultiHandLandmarks(ctx, multiLandmarks, { showCoordinates: true, radius: 4, lineWidth: 2.5 });
    }
  }, [multiLandmarks]);

  const handleStart = () => {
    setCamStarted(true);
    start();
  };

  const handleStop = () => {
    stop();
    setCamStarted(false);
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  useEffect(() => () => { handleStop(); }, []);

  useLocalClassifier({
    landmarks,
    multiLandmarks,
    enabled: isRunning && !testResult,
    confidenceThreshold: 0.52,
    onSignDetected,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#202124] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to lesson
      </button>

      <div className="bg-white rounded-2xl border border-[#e8eaed] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f3f4] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center text-xl">
            {lesson.emoji}
          </div>
          <div>
            <h2 className="font-semibold text-[#202124]">Test: {lesson.sign}</h2>
            <p className="text-xs text-[#5f6368]">Show the gesture to your camera</p>
          </div>
          {testResult === "correct" && (
            <div className="ml-auto flex items-center gap-1.5 text-[#34a853] font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Correct!
            </div>
          )}
          {testResult === "incorrect" && detectedSign && (
            <div className="ml-auto text-xs text-[#ea4335] font-medium">
              Detected: {detectedSign}, try again
            </div>
          )}
        </div>

        {/* Camera area — compact, not fullscreen */}
        <div className="p-5">
          <div className="relative rounded-xl overflow-hidden bg-[#202124] mx-auto" style={{ maxWidth: 480, aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none"
            />

            {/* Overlay when not started */}
            {!camStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]">
                <Camera className="w-12 h-12 text-[#5f6368] mb-3" />
                <p className="text-sm text-[#9aa0a6]">Camera not started</p>
              </div>
            )}

            {/* Status badge */}
            {camStarted && (
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                  testResult === "correct"
                    ? "bg-[#34a853] text-white"
                    : testResult === "incorrect"
                    ? "bg-[#ea4335] text-white"
                    : "bg-black/70 text-[#9aa0a6]"
                }`}>
                  {testResult === "correct" ? "✓ Correct!" : testResult === "incorrect" ? `Saw: ${detectedSign}` : "Waiting for gesture..."}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {!camStarted ? (
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" /> Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={() => { handleStop(); }}
                  className="flex-1 py-2.5 border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4] font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <CameraOff className="w-4 h-4" /> Stop Camera
                </button>
                {testResult === "incorrect" && (
                  <button
                    onClick={onRetry}
                    className="flex-1 py-2.5 bg-[#fce8e6] text-[#ea4335] hover:bg-[#fad2cf] font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Try Again
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reminder */}
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
