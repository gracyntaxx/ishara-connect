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

  const { addMessage } = useDialogueStore();
  const { showHandLandmarks } = useSettingsStore();

  // Credentials (from .env - NEVER committed to GitHub)
  const envAppId = import.meta.env.VITE_ZEGO_APP_ID;
  const envServerSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

  const [appId, setAppId] = useState<string>(() => {
    return envAppId ? String(envAppId) : sessionStorage.getItem("zego_app_id") || "";
  });
  const [serverSecret, setServerSecret] = useState<string>(() => {
    return envServerSecret ? String(envServerSecret) : sessionStorage.getItem("zego_server_secret") || "";
  });
  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    const validId = envAppId || sessionStorage.getItem("zego_app_id");
    const validSecret = envServerSecret || sessionStorage.getItem("zego_server_secret");
    return Boolean(validId && validSecret);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const localUserId = useRef<string>(
    sessionStorage.getItem("ishara_user_id") ||
      `user_${Math.floor(100000 + Math.random() * 900000)}`
  ).current;

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

  // Handle recognized sign gesture
  const handleSignDetected = useCallback(
    (sign: SignLabel, confidence: number) => {
      if (!gestureMode) return;
      setCurrentSign(sign);
      setCurrentConfidence(confidence);

      // Add to local dialogue panel
      addMessage({
        senderId: localUserId,
        senderName: localName,
        type: "sign",
        text: sign,
        confidence,
        isFinal: true,
        timestamp: Date.now(),
      });

      // Broadcast sign to remote call participant via ZEGOCLOUD custom in-room command
      if (zegoInstanceRef.current?.sendInRoomCustomCommand) {
        try {
          zegoInstanceRef.current.sendInRoomCustomCommand({
            type: "ishara-sign",
            sign,
            confidence,
            senderName: localName,
          });
        } catch {
          // ignore
        }
      }
    },
    [gestureMode, localName, localUserId, addMessage]
  );

  // Local rule-based classifier evaluating 21 landmarks
  useLocalClassifier({
    landmarks,
    onSignDetected: handleSignDetected,
    enabled: gestureMode,
  });

  // Draw 21-point skeleton on monitor canvas
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
      color: "#1a73e8",
      connectionColor: "rgba(26, 115, 232, 0.6)",
      radius: 4,
      lineWidth: 2,
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

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId.trim() || !serverSecret.trim()) {
      setErrorMessage("Please provide both AppID and ServerSecret.");
      return;
    }
    sessionStorage.setItem("zego_app_id", appId.trim());
    sessionStorage.setItem("zego_server_secret", serverSecret.trim());
    setIsConfigured(true);
    setErrorMessage("");
  };

  // Credential configuration modal if credentials are missing
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white border border-[#dadce0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1a73e8]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-[#202124]">ZEGOCLOUD Call Setup</h1>
              <p className="text-sm text-[#5f6368]">Configure your 1:1 video calling keys securely</p>
            </div>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                ZEGOCLOUD AppID
              </label>
              <input
                type="number"
                placeholder="e.g. 830679237"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[#dadce0] text-[#202124] text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                ZEGOCLOUD ServerSecret
              </label>
              <input
                type="password"
                placeholder="32-character secret"
                value={serverSecret}
                onChange={(e) => setServerSecret(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[#dadce0] text-[#202124] text-sm font-mono"
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-sm"
            >
              Start ZEGOCLOUD Video Call
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            {/* Real-time Hand Tracking Visualizer Bar */}
            <div className="p-3 bg-[#f8f9fa] border-b border-[#dadce0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative w-16 h-12 bg-black rounded-lg overflow-hidden border border-[#dadce0]">
                  <canvas ref={canvasRef} width={64} height={48} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#1a73e8]" />
                    <span>Live Gesture AI</span>
                  </div>
                  <div className="text-[11px] text-[#5f6368]">
                    {currentSign ? (
                      <span className="text-[#137333] font-medium">
                        Recognized: {currentSign} ({Math.round(currentConfidence * 100)}%)
                      </span>
                    ) : (
                      "Waiting for sign gesture..."
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                title="Toggle Skeleton Overlay"
                className="p-1.5 text-[#5f6368] hover:text-[#202124] rounded-lg hover:bg-[#e8eaed]"
              >
                {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
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
