import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Sparkles,
  Hand,
  Mic,
  MicOff,
  AlertTriangle,
  Eye,
  EyeOff,
  Video,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { SignLabel } from "../lib/constants";
import { DialoguePanel } from "./DialoguePanel";
import { useDialogueStore } from "../stores/useDialogueStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useMediaStream } from "../hooks/useMediaStream";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { drawMultiHandLandmarks } from "../lib/classifier/landmarks";
import { getSupabase } from "../lib/supabase";

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
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const broadcastChannelRef = useRef<any>(null);
  const navigate = useNavigate();

  // Mode Selection: Gestures (AI on) vs No Gestures (Pure video)
  const [gestureMode, setGestureMode] = useState<boolean>(initialGestureMode);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isVisualizerCollapsed, setIsVisualizerCollapsed] = useState(false);
  const [currentSign, setCurrentSign] = useState<SignLabel | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);

  // Sentence Accumulator state
  const [draftTokens, setDraftTokens] = useState<SignLabel[]>([]);
  const [draftSentence, setDraftSentence] = useState<string>("");
  const commitTimerRef = useRef<any>(null);
  const lastDetectedRef = useRef<{ sign: SignLabel; time: number } | null>(null);

  // Relay connection status
  const [relayStatus, setRelayStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const seenMessageIds = useRef<Set<string>>(new Set());

  const { addMessage, messages, clearMessages } = useDialogueStore();
  const { showHandLandmarks } = useSettingsStore();

  // Clear messages when entering a new room so both users start fresh
  useEffect(() => {
    clearMessages();
    seenMessageIds.current.clear();
  }, [roomId, clearMessages]);

  // ZEGOCLOUD preconfigured credentials - auto-loaded silently in the background
  const DEFAULT_ZEGO_APP_ID = "830679237";
  const DEFAULT_ZEGO_SERVER_SECRET = "a7b1bc17853e307857204a6111b121c0";

  const envAppId =
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_ZEGO_APP_ID : "") ||
    DEFAULT_ZEGO_APP_ID;
  const envServerSecret =
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_ZEGO_SERVER_SECRET : "") ||
    DEFAULT_ZEGO_SERVER_SECRET;

  const [appId] = useState<string>(() => String(envAppId || DEFAULT_ZEGO_APP_ID));
  const [serverSecret] = useState<string>(() =>
    String(envServerSecret || DEFAULT_ZEGO_SERVER_SECRET),
  );
  const isConfigured = true;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const localUserId = useRef<string>(
    sessionStorage.getItem("ishara_user_id") ||
      `user_${Math.floor(100000 + Math.random() * 900000)}`,
  ).current;

  // ─── Sentence Formation Rules ────────────────────────────────
  const assembleSentence = useCallback((signs: SignLabel[]): string => {
    if (signs.length === 0) return "";

    // Natural compound phrases for staging conversational demos
    if (signs.includes("Hello") && signs.includes("How Are You")) {
      return "Hello! How are you doing today?";
    }
    if (signs.includes("Good") && signs.includes("Thank You")) {
      return "I am doing good, thank you!";
    }
    if (signs.includes("Understand") && signs.includes("Yes")) {
      return "Yes, I understand you clearly!";
    }
    if (signs.includes("Understand") && signs.includes("No")) {
      return "Sorry, I did not understand that.";
    }
    if (signs.includes("I Love You") && signs.includes("Thank You")) {
      return "Thank you so much! Sending you lots of love! 🤟";
    }
    if (signs.includes("Friend") && signs.includes("Good")) {
      return "It is so good to connect with you, my friend!";
    }
    if (signs.includes("Peace") && signs.includes("Friend")) {
      return "Peace to you, my friend! ✌️";
    }
    if (signs.includes("Stop") && signs.includes("Please")) {
      return "Please hold on for a moment.";
    }
    if (signs.includes("Welcome") && signs.includes("Friend")) {
      return "You are always welcome, friend!";
    }
    if (signs.includes("Bye") && signs.includes("Thank You")) {
      return "Thank you so much, goodbye! 👋";
    }
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
        case "Hello":
          return "Hello! Nice to meet you.";
        case "How Are You":
          return "How are you doing today?";
        case "Good":
          return "I am doing good!";
        case "Thank You":
          return "Thank you very much.";
        case "Welcome":
          return "You are very welcome!";
        case "I Love You":
          return "I love you! 🤟";
        case "Understand":
          return "I understand you clearly.";
        case "Peace":
          return "Peace and harmony! ✌️";
        case "Friend":
          return "We are great friends!";
        case "Stop":
          return "Please wait a moment.";
        case "Yes":
          return "Yes, I agree.";
        case "No":
          return "No, that is not correct.";
        case "Help":
          return "I need assistance, please.";
        case "Please":
          return "Please proceed.";
        case "Sorry":
          return "I am sorry about that.";
        case "Bye":
          return "Goodbye! Have a great day. 👋";
      }
    }

    return signs.join(" ") + ".";
  }, []);

  // ─── Unified Cross-Client Broadcast (Supabase Realtime primary) ───
  const broadcastDialogueMessage = useCallback(
    (msg: {
      id: string;
      senderId: string;
      senderName: string;
      type: "sign" | "speech";
      text: string;
      confidence?: number;
      isFinal: boolean;
      timestamp: number;
    }) => {
      // Skip if we already processed this message id (dedup guard)
      if (seenMessageIds.current.has(msg.id)) return;
      seenMessageIds.current.add(msg.id);

      // 1. Add locally immediately
      addMessage(msg);
      console.log("[Relay] SEND", msg.type, msg.text, "→ room", roomId);

      // 2. Broadcast via Supabase Realtime WebSocket
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.send({
            type: "broadcast",
            event: "dialogue",
            payload: msg,
          });
        } catch (e) {
          console.warn("[Relay] Supabase send error:", e);
        }
      }

      // 3. Fallback: ZEGOCLOUD in-room command (sends to all users in room)
      if (zegoInstanceRef.current?.sendInRoomCommand) {
        try {
          // Pass empty array to send to ALL users in the room
          zegoInstanceRef.current.sendInRoomCommand(
            JSON.stringify({ ...msg, _source: "zego" }),
            [],
          );
        } catch (e) {
          console.warn("[Relay] ZEGOCLOUD command error:", e);
        }
      }
    },
    [addMessage, roomId],
  );

  // ─── Parallel MediaPipe & Dual-Hand Recognition Pipeline ─────────
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

  // Track both hands simultaneously (numHands: 2)
  const {
    landmarks,
    multiLandmarks,
    isRunning,
    start: startMediaPipe,
    stop: stopMediaPipe,
  } = useMediaPipe({
    videoRef: localVideoRef,
    numHands: 2,
  });

  // Commit current drafted gesture sentence and broadcast to call
  const commitDraftSentence = useCallback(() => {
    if (draftTokens.length === 0 && !draftSentence) return;
    const finalSentence = draftSentence || assembleSentence(draftTokens);
    if (!finalSentence) return;

    const messageId = `sign_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    broadcastDialogueMessage({
      id: messageId,
      senderId: localUserId,
      senderName: localName,
      type: "sign",
      text: finalSentence,
      confidence: currentConfidence || 0.85,
      isFinal: true,
      timestamp: Date.now(),
    });

    setDraftTokens([]);
    setDraftSentence("");
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
  }, [
    draftTokens,
    draftSentence,
    assembleSentence,
    broadcastDialogueMessage,
    currentConfidence,
    localName,
    localUserId,
  ]);

  // Handle recognized sign gesture & assemble into full sentences
  const handleSignDetected = useCallback(
    (sign: SignLabel, confidence: number) => {
      if (!gestureMode || confidence < 0.50) return;
      setCurrentSign(sign);
      setCurrentConfidence(confidence);

      const now = Date.now();
      const last = lastDetectedRef.current;

      // Debounce if same sign repeated in less than 750ms
      if (last && last.sign === sign && now - last.time < 750) {
        return;
      }
      lastDetectedRef.current = { sign, time: now };

      setDraftTokens((prev) => {
        const nextTokens = prev[prev.length - 1] === sign ? prev : [...prev, sign];
        const currentSentence = assembleSentence(nextTokens);
        setDraftSentence(currentSentence);

        // Auto-commit sentence after 1.2 seconds of completed gesture
        if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
        commitTimerRef.current = setTimeout(() => {
          if (nextTokens.length > 0) {
            const final = assembleSentence(nextTokens);
            const messageId = `sign_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            broadcastDialogueMessage({
              id: messageId,
              senderId: localUserId,
              senderName: localName,
              type: "sign",
              text: final,
              confidence,
              isFinal: true,
              timestamp: Date.now(),
            });

            setDraftTokens([]);
            setDraftSentence("");
          }
        }, 1200);

        return nextTokens;
      });
    },
    [gestureMode, localName, localUserId, assembleSentence, broadcastDialogueMessage],
  );

  // Local rule-based classifier evaluating both hands with higher stability
  useLocalClassifier({
    landmarks,
    multiLandmarks,
    onSignDetected: handleSignDetected,
    enabled: gestureMode,
    confidenceThreshold: 0.52,
    smoothingWindow: 9,
    minVotes: 6,
  });

  // Draw dual-hand skeleton on monitor canvas with refined narrow markers
  useEffect(() => {
    if (!canvasRef.current || !gestureMode || !showSkeleton) {
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
    if (multiLandmarks && multiLandmarks.length > 0) {
      drawMultiHandLandmarks(ctx, multiLandmarks, {
        showCoordinates: true,
        radius: 2.2,
        lineWidth: 1.3,
      });
    }
  }, [multiLandmarks, gestureMode, showSkeleton]);

  // Start / stop MediaPipe with gesture mode
  useEffect(() => {
    if (gestureMode && !isRunning) {
      startMediaPipe();
    } else if (!gestureMode && isRunning) {
      stopMediaPipe();
    }
  }, [gestureMode, isRunning, startMediaPipe, stopMediaPipe]);

  // Speech-to-text recognition — works regardless of gesture mode
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal || !transcript.trim()) return;

      const messageId = `speech_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      broadcastDialogueMessage({
        id: messageId,
        senderId: localUserId,
        senderName: localName,
        type: "speech",
        text: transcript.trim(),
        isFinal: true,
        timestamp: Date.now(),
      });
    },
    [localName, localUserId, broadcastDialogueMessage],
  );

  const {
    isListening,
    start: startSpeech,
    stop: stopSpeech,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    continuous: true,
  });

  // ─── Supabase Realtime Broadcast Channel with auto-reconnect ────
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !roomId) {
      setRelayStatus("disconnected");
      return;
    }

    let isMounted = true;
    let reconnectTimer: any = null;

    function setupChannel() {
      if (!isMounted) return;
      setRelayStatus("connecting");

      const channel = supabase!.channel(`ishara_call_${roomId}`, {
        config: {
          broadcast: { self: false, ack: false },
        },
      });

      // Listen for incoming dialogue messages from the remote peer
      channel.on("broadcast", { event: "dialogue" }, ({ payload }) => {
        if (!payload || !payload.text) return;
        // Accept messages from anyone in the room (including echoed own messages from other devices)
        if (payload.senderId === localUserId) return;
        if (seenMessageIds.current.has(payload.id)) return;
        seenMessageIds.current.add(payload.id);

        console.log("[Relay] RECV", payload.type, payload.text, "from", payload.senderName);
        addMessage({
          id: payload.id,
          senderId: payload.senderId,
          senderName: payload.senderName || "Remote Partner",
          type: payload.type || "sign",
          text: payload.text,
          confidence: payload.confidence,
          isFinal: true,
          timestamp: payload.timestamp || Date.now(),
        });
      });

      channel.subscribe((status) => {
        console.log("[Relay] Channel status:", status, "room:", roomId);
        if (!isMounted) return;
        if (status === "SUBSCRIBED") {
          setRelayStatus("connected");
          broadcastChannelRef.current = channel;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRelayStatus("disconnected");
          broadcastChannelRef.current = null;
          // Auto-reconnect after 3 seconds
          reconnectTimer = setTimeout(() => {
            if (isMounted) {
              console.log("[Relay] Reconnecting...");
              supabase!.removeChannel(channel);
              setupChannel();
            }
          }, 3000);
        }
      });

      return channel;
    }

    const channel = setupChannel();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      broadcastChannelRef.current = null;
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId, localUserId, addMessage]);

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
          userName,
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoInstanceRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: "Share this link to join",
              url: `${window.location.origin}/call/${roomId}?name=Guest&engine=zego&gestures=${gestureMode ? "true" : "false"}`,
            },
          ],
          scenario: {
            // GroupCall allows multiple people to join the same room freely
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: true,
          maxUsers: 4,
          layout: "Auto",
          showLayoutButton: false,
          // Receive in-room commands from remote peer as a fallback channel
          onInRoomCommandReceived: (fromUser: any, command: string) => {
            try {
              const data = JSON.parse(command);
              // Ignore if it came back to us or has _source=zego and we sent it
              if (!data || data.senderId === localUserId || !data.text) return;
              if (seenMessageIds.current.has(data.id)) return;
              seenMessageIds.current.add(data.id);

              console.log("[Relay/ZEGO] RECV", data.type, data.text, "from", data.senderName);
              addMessage({
                id: data.id,
                senderId: data.senderId || fromUser?.userID || "remote",
                senderName: data.senderName || fromUser?.userName || "Remote Partner",
                type: data.type || "sign",
                text: data.text,
                confidence: data.confidence,
                isFinal: true,
                timestamp: data.timestamp || Date.now(),
              });
            } catch {
              // ignore non-json
            }
          },
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
  }, [isConfigured, appId, serverSecret, roomId, localName, localUserId, navigate, addMessage, gestureMode]);

  // Most recent message for in-call subtitle banner
  const lastSubtitleMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Real-time telemetry coordinates for Hand 1 and Hand 2
  const h1 = multiLandmarks?.[0];
  const h2 = multiLandmarks?.[1];
  const h1Wrist = h1?.[0];
  const h2Wrist = h2?.[0];

  return (
    <div className="relative w-full h-full bg-[#1e1f20] overflow-hidden flex flex-col">
      {/* Hidden camera stream for MediaPipe landmark extraction */}
      <video
        ref={localVideoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
        width={640}
        height={480}
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
              gestureMode ? "bg-[#1a73e8] text-white shadow-sm" : "text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Gestures Mode (Dual AI Active)</span>
          </button>
          <button
            type="button"
            onClick={() => setGestureMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              !gestureMode ? "bg-[#3c4043] text-white shadow-sm" : "text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>No Gestures (Pure Video)</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Relay status indicator */}
          <div
            className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg ${
              relayStatus === "connected"
                ? "text-emerald-400 bg-emerald-500/10"
                : relayStatus === "connecting"
                  ? "text-yellow-400 bg-yellow-500/10 animate-pulse"
                  : "text-red-400 bg-red-500/10"
            }`}
            title={`Message relay: ${relayStatus}`}
          >
            {relayStatus === "connected" ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline capitalize">{relayStatus}</span>
          </div>

          {/* Speech toggle — works in both gesture and plain video mode */}
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
            <span className="hidden sm:inline">
              {isListening ? "Subtitles On" : "Subtitles Off"}
            </span>
          </button>

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
        <div
          className={`relative flex-1 h-full overflow-hidden transition-all ${gestureMode ? "w-full lg:w-[65%]" : "w-full"}`}
        >
          <div ref={containerRef} className="w-full h-full" style={{ minHeight: "100%" }} />

          {/* Real-Time Dual-Hand Telemetry HUD in the Video Window */}
          {gestureMode && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-wrap gap-2 max-w-[90%]">
              {/* Hand 1 (Cyan) Telemetry Pill */}
              <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-lg">
                <div
                  className={`w-2 h-2 rounded-full ${h1 ? "bg-cyan-400 animate-pulse" : "bg-gray-500"}`}
                />
                <div className="text-[10px] sm:text-[11px] font-mono">
                  <span className="text-cyan-400 font-bold">HAND 1: </span>
                  {h1 && h1Wrist ? (
                    <span className="text-gray-200">
                      X:<span className="text-white font-semibold">{h1Wrist.x.toFixed(2)}</span> Y:
                      <span className="text-white font-semibold">{h1Wrist.y.toFixed(2)}</span> Z:
                      <span className="text-white font-semibold">
                        {(h1Wrist.z ?? 0).toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Ready (Show hand)</span>
                  )}
                </div>
              </div>

              {/* Hand 2 (Purple) Telemetry Pill */}
              <div className="bg-black/80 backdrop-blur-md border border-purple-500/50 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-lg">
                <div
                  className={`w-2 h-2 rounded-full ${h2 ? "bg-purple-400 animate-pulse" : "bg-gray-500"}`}
                />
                <div className="text-[10px] sm:text-[11px] font-mono">
                  <span className="text-purple-400 font-bold">HAND 2: </span>
                  {h2 && h2Wrist ? (
                    <span className="text-gray-200">
                      X:<span className="text-white font-semibold">{h2Wrist.x.toFixed(2)}</span> Y:
                      <span className="text-white font-semibold">{h2Wrist.y.toFixed(2)}</span> Z:
                      <span className="text-white font-semibold">
                        {(h2Wrist.z ?? 0).toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Ready (Show hand)</span>
                  )}
                </div>
              </div>

              {/* Real-time sign detected badge */}
              {currentSign && (
                <div className="bg-cyan-950/90 border border-cyan-400/60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-cyan-200">
                    Interpreted: <span className="text-white font-bold">{currentSign}</span> (
                    {Math.round(currentConfidence * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Floating Subtitle Banner in Video Call Window (Positioned cleanly above mic/cam controls) */}
          {gestureMode && lastSubtitleMessage && (
            <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-md w-[85%] sm:w-auto pointer-events-none transition-all">
              <div className="bg-black/85 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 shadow-xl text-center">
                <div className="text-[9px] uppercase font-bold tracking-wider text-cyan-400 flex items-center justify-center gap-1.5">
                  <span>
                    {lastSubtitleMessage.senderId === localUserId
                      ? "You"
                      : lastSubtitleMessage.senderName}{" "}
                    •{" "}
                    {lastSubtitleMessage.type === "sign"
                      ? "ASL Gesture Translation"
                      : "Speech Subtitle"}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-white mt-0.5">
                  "{lastSubtitleMessage.text}"
                </div>
              </div>
            </div>
          )}

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
            {/* Streamlined Live Gesture Tracking Panel */}
            <div className="p-3 bg-[#161820] border-b border-[#252834] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white tracking-wide">
                    Live Gesture AI
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono border border-cyan-500/20">
                    Dual Hands • Stabilized
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    title="Toggle Skeleton Coordinates"
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {showSkeleton ? (
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsVisualizerCollapsed(!isVisualizerCollapsed)}
                    title={isVisualizerCollapsed ? "Expand Monitor" : "Minimize Monitor"}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {isVisualizerCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsed quick status summary */}
              {isVisualizerCollapsed ? (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0f1117] rounded-lg border border-slate-800 text-xs text-gray-300">
                  <span className="truncate font-medium">
                    {currentSign ? (
                      <span className="text-cyan-300 font-bold">Sign: {currentSign}</span>
                    ) : (
                      <span className="text-gray-500 italic">Tracking gestures...</span>
                    )}
                  </span>
                  {draftSentence && (
                    <button
                      onClick={commitDraftSentence}
                      className="ml-2 px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded"
                    >
                      Send "{draftSentence}"
                    </button>
                  )}
                </div>
              ) : (
                /* High-clarity visualizer canvas with refined narrow markers */
                <div className="relative w-full h-44 bg-gradient-to-b from-[#0c0e14] to-[#12151e] rounded-xl overflow-hidden border border-slate-700/60 shadow-inner flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={240}
                    className="w-full h-full object-cover -scale-x-100"
                  />

                  {/* Overlay status badge */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium backdrop-blur-md border ${
                        currentSign
                          ? "bg-cyan-950/80 border-cyan-500/40 text-cyan-200 shadow-sm"
                          : "bg-slate-900/70 border-slate-700/50 text-slate-400"
                      }`}
                    >
                      {currentSign ? `Sign: ${currentSign}` : "Tracking Hands..."}
                    </span>
                    {currentConfidence > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/80 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">
                        {Math.round(currentConfidence * 100)}% Match
                      </span>
                    )}
                  </div>

                  {/* Sleek drafted sentence preview & action controls */}
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-md rounded-xl p-2 border border-slate-700/50 text-left shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-[9.5px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                        <span>Live Sentence Buffer</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1 pointer-events-auto">
                        {draftSentence && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setDraftTokens([]);
                                setDraftSentence("");
                                if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-white/10 transition-colors"
                              title="Clear Draft"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={commitDraftSentence}
                              className="flex items-center gap-1 px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded shadow transition-all"
                              title="Send Immediately"
                            >
                              <Send className="w-2.5 h-2.5" /> Send
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-white font-medium truncate mt-0.5">
                      {draftSentence ? (
                        <span>
                          "{draftSentence}" <span className="animate-pulse font-mono text-cyan-400">|</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">
                          Form hand signs to assemble sentences...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
