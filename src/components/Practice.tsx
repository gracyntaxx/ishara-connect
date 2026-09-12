"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Target, Award, RotateCcw, Download } from "lucide-react";
import { usePracticeStore } from "../stores";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import type { SignLabel } from "../lib/constants";
import { SIGN_HINTS, SUPPORTED_SIGNS } from "../lib/constants";

interface PracticeProps {
  className?: string;
}

export function Practice({ className = "" }: PracticeProps) {
  const {
    targetSign,
    attempts,
    signStats,
    currentStreak,
    bestStreak,
    isActive,
    setTargetSign,
    addAttempt,
    clearAttempts,
    startSession,
    endSession,
    setActive,
    getAccuracy,
    getOverallAccuracy,
  } = usePracticeStore();

  const [showHint, setShowHint] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const { stream, permissionState, requestPermission, retryStream } = useMediaStream({
    video: true,
    audio: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    landmarks,
    isRunning,
    start: startMediaPipe,
    stop: stopMediaPipe,
  } = useMediaPipe({
    videoRef,
    targetFps: 18,
  });

  const {
    prediction,
    confidence,
    isLowConfidence,
    start: startClassifier,
    stop: stopClassifier,
  } = useLocalClassifier({
    landmarks,
    confidenceThreshold: 0.5,
    smoothingWindow: 4,
    minVotes: 3,
    emitCooldownMs: 1000,
    onSignDetected: (sign, conf) => {
      if (targetSign && sign === targetSign) {
        const isCorrect = conf >= 0.65;
        addAttempt({
          sign: targetSign,
          isCorrect,
          confidence: conf,
          timestamp: Date.now(),
        });
      }
    },
  });

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (stream && targetSign && isActive) {
      startMediaPipe();
      startClassifier();
    } else {
      stopMediaPipe();
      stopClassifier();
    }
    return () => {
      stopMediaPipe();
      stopClassifier();
    };
  }, [stream, targetSign, isActive]);

  const handleSignSelect = (sign: SignLabel) => {
    setTargetSign(sign);
    setActive(true);
    startSession();
    clearAttempts();
    setShowResults(false);
    setShowHint(true);
  };

  const handleReset = () => {
    setTargetSign(null);
    setActive(false);
    endSession();
    clearAttempts();
    setShowResults(false);
  };

  const handleSaveProgress = () => {
    const data = {
      signStats,
      bestStreak,
      timestamp: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ishara-practice-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCorrect = targetSign && prediction === targetSign && confidence >= 0.65;
  const isClose = targetSign && prediction === targetSign && confidence >= 0.5 && confidence < 0.65;

  if (!targetSign) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <Target className="mx-auto h-16 w-16 text-primary/50 mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-2">Practice Mode</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Select a sign below to start practicing. The camera will track your hand movements and
              give you real-time feedback on your accuracy.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {SUPPORTED_SIGNS.map((sign) => (
                <button
                  key={sign}
                  onClick={() => handleSignSelect(sign)}
                  className="group p-4 border border-border rounded-xl bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <span className="text-2xl font-bold text-primary">{sign.charAt(0)}</span>
                    </div>
                    <h3 className="font-medium text-foreground">{sign}</h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {SIGN_HINTS[sign]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Best Streak: <span className="font-medium text-foreground">{bestStreak}</span>
              </span>
              <span>
                Overall Accuracy:{" "}
                <span className="font-medium text-foreground">
                  {getOverallAccuracy().toFixed(1)}%
                </span>
              </span>
            </div>
            <button
              onClick={handleSaveProgress}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-input rounded-lg hover:bg-accent transition-colors"
            >
              <Download className="h-4 w-4" />
              Save Progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Back to sign selection"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Practicing: {targetSign}</h2>
              <p className="text-sm text-muted-foreground">{SIGN_HINTS[targetSign]}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
              <span>Streak: {currentStreak}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success">
              <Award className="h-4 w-4" />
              <span>Best: {bestStreak}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning">
              <span>Accuracy: {getAccuracy(targetSign).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative min-w-0">
          {stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground">
                <Video className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>Starting camera...</p>
              </div>
            </div>
          )}

          {permissionState.video === "denied" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4">
              <div className="text-center max-w-md">
                <Video className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground">Camera access denied</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please allow camera access in your browser settings to practice signs.
                </p>
                <button
                  onClick={retryStream}
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {!landmarks && stream && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="bg-background/90 backdrop-blur px-4 py-2 rounded-full text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-warning" />
                <span>Position your hand in view of the camera</span>
              </div>
            </div>
          )}

          {targetSign && prediction && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div
                className={`px-6 py-3 rounded-full text-lg font-semibold transition-all ${
                  isCorrect
                    ? "bg-success text-success-foreground shadow-lg shadow-success/25"
                    : isClose
                      ? "bg-warning text-warning-foreground"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {isCorrect ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Correct! {Math.round(confidence * 100)}%
                  </span>
                ) : isClose ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse">⟳</span>
                    Almost there... {Math.round(confidence * 100)}%
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Try again: {prediction} ({Math.round(confidence * 100)}%)
                  </span>
                )}
              </div>
              {showHint && (
                <button
                  onClick={() => setShowHint(false)}
                  className="px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-background/90 backdrop-blur rounded-full border border-border"
                >
                  Hide hint
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="w-72 border-l border-border bg-card p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Your Progress</h3>
              <div className="space-y-2">
                {SUPPORTED_SIGNS.map((sign) => {
                  const stat = signStats[sign];
                  const accuracy = stat.attempts > 0 ? (stat.correct / stat.attempts) * 100 : 0;
                  return (
                    <div
                      key={sign}
                      className={`p-3 rounded-lg border transition-colors ${
                        sign === targetSign
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{sign}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.attempts} attempts
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">
                          {accuracy.toFixed(0)}% accurate
                        </span>
                        <span className="text-muted-foreground">
                          Best:{" "}
                          {stat.bestConfidence > 0
                            ? Math.round(stat.bestConfidence * 100) + "%"
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Recent Attempts</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {attempts
                  .slice(-10)
                  .reverse()
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        attempt.isCorrect ? "bg-success/10" : "bg-destructive/10"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${attempt.isCorrect ? "bg-success" : "bg-destructive"}`}
                      />
                      <span className="text-sm font-medium text-foreground">{attempt.sign}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.round(attempt.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                {attempts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No attempts yet</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Video({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
