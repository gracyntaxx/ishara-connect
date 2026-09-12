import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  Key,
  ArrowLeft,
  Sparkles,
  Hand,
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquare,
  Activity,
  Video,
} from "lucide-react";
import { SUPPORTED_SIGNS, SIGN_HINTS, SignLabel } from "../lib/constants";
import { DialoguePanel } from "./DialoguePanel";
import { useDialogueStore } from "../stores/useDialogueStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { drawLandmarks } from "../lib/classifier/landmarks";

interface ZegoCallProps {
  roomId: string;
  localName: string;
  initialGestureMode?: boolean;
  onSwitchToP2P?: () => void;
}

export function ZegoCall({
  roomId,
  localName,
  initialGestureMode = true,
  onSwitchToP2P,
}: ZegoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Mode Selection: Gestures (AI on) vs No Gestures (Pure video)
  const [gestureMode, setGestureMode] = useState<boolean>(initialGestureMode);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [currentSign, setCurrentSign] = useState<SignLabel | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);

  // Sentence Accumulator state
  const [draftTokens, setDraftTokens] = useState<SignLabel[]>([]);
  const [draftSentence, setDraftSentence] = useState<string>("");
  const commitTimerRef = useRef<any>(null);
  const lastDetectedRef = useRef<{ sign: SignLabel; time: number } | null>(null);

  const { addMessage } = useDialogueStore();
  const { showHandLandmarks } = useSettingsStore();

  // ZEGOCLOUD preconfigured credentials - auto-loaded silently in the background
  const DEFAULT_ZEGO_APP_ID = "830679237";
  const DEFAULT_ZEGO_SERVER_SECRET = "a7b1bc17853e307857204a6111b121c0";

  const envAppId = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_ZEGO_APP_ID : "") || DEFAULT_ZEGO_APP_ID;
  const envServerSecret = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_ZEGO_SERVER_SECRET : "") || DEFAULT_ZEGO_SERVER_SECRET;

  const [appId] = useState<string>(() => String(envAppId || DEFAULT_ZEGO_APP_ID));
  const [serverSecret] = useState<string>(() => String(envServerSecret || DEFAULT_ZEGO_SERVER_SECRET));
  const isConfigured = true;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const localUserId = useRef<string>(
    sessionStorage.getItem("ishara_user_id") ||
      `user_${Math.floor(100000 + Math.random() * 900000)}`
  ).current;

  // ─── Sentence Formation Rules ────────────────────────────────
  const assembleSentence = useCallback((signs: SignLabel[]): string => {
    if (signs.length === 0) return "";
    
    // Natural compound phrases
    if (signs.includes("Hello") && signs.includes("Help")) {
      return "Hello, I need help please.";
    }
    if (signs.includes("Thank You") && signs.includes("Good")) {
      return "Thank you, everything looks good!";
    }
    if (signs.includes("Yes") && signs.includes("Please")) {
      return "Yes, please do.";
    }
    if (signs.includes("No") && signs.includes("Thank You")) {
      return "No, thank you.";
    }
    if (signs.includes("Sorry") && signs.includes("Help")) {
      return "Sorry to bother you, could you please help me?";
    }
    if (signs.includes("Hello") && signs.includes("Good")) {
      return "Hello, good to connect with you!";
    }

    // Single sign expansions
    if (signs.length === 1) {
      switch (signs[0]) {
        case "Hello": return "Hello! Nice to meet you.";
        case "Thank You": return "Thank you very much.";
        case "Yes": return "Yes, I agree.";
        case "No": return "No, that is not correct.";
        case "Help": return "I need assistance, please.";
        case "Good": return "Everything is going good!";
        case "Please": return "Please proceed.";
        case "Sorry": return "I am sorry about that.";
      }
    }

    return signs.join(" ") + ".";
  }, []);

  // ─── Parallel MediaPipe & Gesture Recognition Pipeline ─────────
  const { stream: localCamStream } = useMediaStream({
    video: gestureMode,
    audio: false, // audio handled by ZEGOCLOUD
  });

  // Attach local stream to hidden video for MediaPipe processing
  useEffect(() => {
    if (localVideoRef.current && localCamStream && gestureMode) {
      localVideoRef.current.srcObject = localCamStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localCamStream, gestureMode]);

  const { landmarks, isRunning, start: startMediaPipe, stop: stopMediaPipe } = useMediaPipe({
    videoRef: localVideoRef,
  });

  // Handle recognized sign gesture & assemble into full sentences
  const handleSignDetected = useCallback(
    (sign: SignLabel, confidence: number) => {
      if (!gestureMode || confidence < 0.55) return;
      setCurrentSign(sign);
      setCurrentConfidence(confidence);

      const now = Date.now();
      const last = lastDetectedRef.current;

      // Debounce if same sign repeated in less than 800ms
      if (last && last.sign === sign && now - last.time < 800) {
        return;
      }
      lastDetectedRef.current = { sign, time: now };

      setDraftTokens((prev) => {
        const nextTokens = prev[prev.length - 1] === sign ? prev : [...prev, sign];
        const currentSentence = assembleSentence(nextTokens);
        setDraftSentence(currentSentence);

        // Reset commit timer: auto-commit sentence after 1.8 seconds of gesture completion
        if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
        commitTimerRef.current = setTimeout(() => {
          if (nextTokens.length > 0) {
            const finalSentence = assembleSentence(nextTokens);

            // Add translated sentence to Dialogue panel
            addMessage({
              senderId: localUserId,
              senderName: localName,
              type: "sign",
              text: finalSentence,
              confidence,
              isFinal: true,
              timestamp: Date.now(),
            });

            // Broadcast sign translation to remote partner
            if (zegoInstanceRef.current?.sendInRoomCustomCommand) {
              try {
                zegoInstanceRef.current.sendInRoomCustomCommand({
                  type: "ishara-sign",
                  sign: finalSentence,
                  confidence,
                  senderName: localName,
                });
              } catch {}
            }

            setDraftTokens([]);
            setDraftSentence("");
          }
        }, 1800);

        return nextTokens;
      });
    },
    [gestureMode, localName, localUserId, addMessage, assembleSentence]
  );

  // Local rule-based classifier evaluating 21 landmarks
  useLocalClassifier({
    landmarks,
    onSignDetected: handleSignDetected,
    enabled: gestureMode,
  });

  // Draw 21-point skeleton on monitor canvas with vibrant cyan/blue joints
  useEffect(() => {
    if (!canvasRef.current || !landmarks || !gestureMode || !showSkeleton) {
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
      connectionColor: "rgba(14, 165, 233, 0.75)",
      radius: 4,
      lineWidth: 2.5,
    });
  }, [landmarks, gestureMode, showSkeleton]);

  // Start / stop MediaPipe with gesture mode
  useEffect(() => {
    if (gestureMode && !isRunning) {
      startMediaPipe();
    } else if (!gestureMode && isRunning) {
      stopMediaPipe();
    }
  }, [gestureMode, isRunning, startMediaPipe, stopMediaPipe]);

  // Speech-to-text recognition
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!gestureMode || !isFinal || !transcript.trim()) return;

      addMessage({
        senderId: localUserId,
        senderName: localName,
        type: "speech",
        text: transcript.trim(),
        isFinal: true,
        timestamp: Date.now(),
      });

      if (zegoInstanceRef.current?.sendInRoomCustomCommand) {
        try {
          zegoInstanceRef.current.sendInRoomCustomCommand({
            type: "ishara-speech",
            text: transcript.trim(),
            senderName: localName,
          });
        } catch {
          // ignore
        }
      }
    },
    [gestureMode, localName, localUserId, addMessage]
  );

  const { isListening, start: startSpeech, stop: stopSpeech } = useSpeechRecognition({
    onResult: handleSpeechResult,
    continuous: true,
  });

  // ─── Initialize ZEGOCLOUD 1:1 Video Call ───────────────────────
  useEffect(() => {
    if (!isConfigured || !containerRef.current || typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    async function initZego() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

        if (!isMounted || !containerRef.current) return;

        const numericAppId = Number(appId);
        if (isNaN(numericAppId) || numericAppId <= 0) {
          throw new Error("Invalid ZEGOCLOUD AppID.");
        }
        if (!serverSecret || serverSecret.trim().length < 8) {
          throw new Error("Invalid ZEGOCLOUD ServerSecret.");
        }

        const userName = localName.trim() || `User_${localUserId.slice(-4)}`;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          numericAppId,
          serverSecret.trim(),
          roomId,
          localUserId,
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoInstanceRef.current = zp;

        // Listen for custom in-room commands from partner (sign language & speech text)
        if ((zp as any).on) {
          (zp as any).on("inRoomCustomCommandReceived", (messages: any[]) => {
            messages?.forEach((msg) => {
              try {
                const data = JSON.parse(msg.content);
                if (data.type === "ishara-sign") {
                  addMessage({
                    senderId: msg.fromUser.userID,
                    senderName: data.senderName || msg.fromUser.userName,
                    type: "sign",
                    text: data.sign,
                    confidence: data.confidence,
                    isFinal: true,
                    timestamp: Date.now(),
                  });
                } else if (data.type === "ishara-speech") {
                  addMessage({
                    senderId: msg.fromUser.userID,
                    senderName: data.senderName || msg.fromUser.userName,
                    type: "speech",
                    text: data.text,
                    isFinal: true,
                    timestamp: Date.now(),
                  });
                }
              } catch {
                // ignore non-json
              }
            });
          });
        }

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: "1:1 Call Room Link",
              url: `${window.location.origin}/call/${roomId}?name=Friend`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
            config: {
              role: ZegoUIKitPrebuilt.Host,
            },
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
          showTextChat: true,
          showUserList: true,
          maxUsers: 2,
          layout: "Auto",
          showLayoutButton: false,
          onLeaveRoom: () => {
            navigate({ to: "/room" });
          },
        });

        setIsLoading(false);
      } catch (err: any) {
        console.error("ZEGOCLOUD startup error:", err);
        if (isMounted) {
          setErrorMessage(err?.message || "Failed to start ZEGOCLOUD video session.");
          setIsLoading(false);
        }
      }
    }

    initZego();

    return () => {
      isMounted = false;
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy();
        } catch (e) {
          console.warn("Zego destroy error:", e);
        }
        zegoInstanceRef.current = null;
      }
    };
  }, [isConfigured, appId, serverSecret, roomId, localName, localUserId, navigate, addMessage]);

  return (
    <div className="relative w-full h-full bg-[#1e1f20] overflow-hidden flex flex-col">
      {/* Hidden camera stream for MediaPipe landmark extraction */}
      <video
        ref={localVideoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
        width={320}
        height={240}
      />

      {/* Top Bar with Mode Selector (Gestures vs No Gestures) */}
      <header className="h-14 bg-[#1e1f20] border-b border-[#3c4043] px-4 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/room"
            className="flex items-center gap-1.5 text-xs text-[#9aa0a6] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#2d2f31] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Leave Room
          </Link>
          <div className="h-4 w-px bg-[#3c4043]" />
          <div className="flex items-center gap-2 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse" />
            <span className="font-medium">Room: {roomId}</span>
          </div>
        </div>

        {/* Central Mode Selector: Gestures Mode vs Pure Video Mode */}
        <div className="flex items-center bg-[#2d2f31] p-1 rounded-xl border border-[#3c4043]">
          <button
            type="button"
            onClick={() => setGestureMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              gestureMode
                ? "bg-[#1a73e8] text-white shadow-sm"
                : "text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Gestures Mode (AI Active)</span>
          </button>
          <button
            type="button"
            onClick={() => setGestureMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              !gestureMode
                ? "bg-[#3c4043] text-white shadow-sm"
                : "text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>No Gestures (Pure Video)</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {gestureMode && (
            <button
              onClick={() => (isListening ? stopSpeech() : startSpeech())}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                isListening
                  ? "bg-[#ea4335] text-white animate-pulse"
                  : "bg-[#2d2f31] text-[#e8eaed] hover:bg-[#3c4043]"
              }`}
              title="Speech-to-Text Subtitles"
            >
              {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isListening ? "Subtitles Active" : "Start Subtitles"}</span>
            </button>
          )}

          {onSwitchToP2P && (
            <button
              onClick={onSwitchToP2P}
              className="text-xs text-[#9aa0a6] hover:text-white px-2 py-1 rounded hover:bg-[#2d2f31]"
            >
              P2P
            </button>
          )}
        </div>
      </header>

      {/* Main Call Viewport */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left / Center Video Area (ZEGOCLOUD Container) */}
        <div className={`relative flex-1 h-full overflow-hidden transition-all ${gestureMode ? "w-full lg:w-[65%]" : "w-full"}`}>
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: "100%" }}
          />

          {isLoading && (
            <div className="absolute inset-0 bg-[#1e1f20]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
              <div className="w-10 h-10 border-3 border-[#1a73e8] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Joining ZEGOCLOUD Video Call...</p>
            </div>
          )}

          {errorMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs px-4 py-2 rounded-xl z-30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Side: Dialogue Panel & MediaPipe Landmark Monitor (Only in Gestures Mode) */}
        {gestureMode && (
          <aside className="w-full lg:w-[35%] max-w-md bg-white border-l border-[#dadce0] shadow-xl flex flex-col z-20 h-full">
            {/* Enlarged Live Gesture AI Visualizer Panel */}
            <div className="p-3.5 bg-[#121316] border-b border-[#2d2f31] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white tracking-wide">Live Gesture AI</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    18 FPS
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    title="Toggle Skeleton Overlay"
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {showSkeleton ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Large, high-clarity canvas */}
              <div className="relative w-full h-44 bg-[#0a0b0d] rounded-xl overflow-hidden border border-cyan-500/30 shadow-inner flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={240}
                  className="w-full h-full object-cover -scale-x-100"
                />

                {/* Overlay status badge */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-md ${
                      currentSign
                        ? "bg-cyan-500/80 text-white shadow-sm"
                        : "bg-black/60 text-gray-400"
                    }`}
                  >
                    {currentSign ? `Sign: ${currentSign}` : "Analyzing Hand..."}
                  </span>
                  {currentConfidence > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-black/60 text-emerald-400 backdrop-blur-md">
                      {Math.round(currentConfidence * 100)}% Match
                    </span>
                  )}
                </div>

                {/* Live drafted sentence preview */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md rounded-lg p-2 border border-white/10 text-left">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                    <span>Drafting Translation</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <div className="text-xs text-white font-medium truncate mt-0.5">
                    {draftSentence ? (
                      <span>"{draftSentence}" <span className="animate-pulse font-mono">|</span></span>
                    ) : (
                      <span className="text-gray-400 italic">Sign gestures to form sentences...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Way Dialogue Panel */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <DialoguePanel localUserId={localUserId} className="h-full" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
