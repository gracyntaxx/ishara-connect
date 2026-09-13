"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Settings,
  Copy,
  Check,
  X,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { useCallStore } from "../stores";
import { DialoguePanel } from "./DialoguePanel";
import { useLocalClassifier } from "../hooks/useLocalClassifier";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useMediaStream } from "../hooks/useMediaStream";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useWebRTC } from "../hooks/useWebRTC";
import { ManualSignaling } from "../lib/signaling";
import type { DataMessage, SessionDescriptionPayload } from "../lib/signaling";
import type { SignLabel } from "../lib/constants";

interface VideoCallProps {
  roomId: string;
  localName: string;
  isInitiator: boolean;
  remoteConnectionCode?: string;
}

export function VideoCall({
  roomId,
  localName,
  isInitiator,
  remoteConnectionCode,
}: VideoCallProps) {
  const {
    session,
    messages,
    localVideoEnabled,
    localAudioEnabled,
    showDialoguePanel,
    activeTab,
    setSession,
    updateSession,
    setConnected,
    setConnectionCode,
    setInitiator,
    addMessage,
    addParticipant,
    removeParticipant,
    updateParticipant,
    toggleLocalVideo,
    setLocalVideo,
    toggleLocalAudio,
    setLocalAudio,
    toggleDialoguePanel,
    setDialoguePanel,
    toggleSettings,
    setSettings,
    setActiveTab,
  } = useCallStore();

  const [connectionCode, setConnectionCodeState] = useState<string>("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [remoteCode, setRemoteCode] = useState(remoteConnectionCode || "");
  const [showRemoteCodeInput, setShowRemoteCodeInput] = useState(!isInitiator);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const {
    stream: mediaStream,
    permissionState,
    requestPermission,
    toggleAudio,
    toggleVideo,
    retryStream,
  } = useMediaStream({
    video: true,
    audio: true,
  });

  const {
    landmarks,
    isRunning: isMediaPipeRunning,
    start: startMediaPipe,
    stop: stopMediaPipe,
  } = useMediaPipe({
    videoRef: localVideoRef,
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
    confidenceThreshold: 0.65,
    smoothingWindow: 6,
    minVotes: 4,
    emitCooldownMs: 1600,
    onSignDetected: (sign, conf) => {
      const message: Omit<DataMessage, "timestamp"> = {
        type: "sign",
        text: sign,
        confidence: conf,
        isFinal: true,
        senderName: localName,
      };
      sendData(message);
      addMessage({
        senderId: "local",
        senderName: localName,
        type: "sign",
        text: sign,
        confidence: conf,
        isFinal: true,
        timestamp: Date.now(),
      });
    },
  });

  const {
    transcript: speechTranscriptInterim,
    finalTranscript,
    isListening,
    start: startSpeech,
    stop: stopSpeech,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: "en-US",
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        const message: Omit<DataMessage, "timestamp"> = {
          type: "speech",
          text: text.trim(),
          isFinal: true,
          senderName: localName,
        };
        sendData(message);
        addMessage({
          senderId: "local",
          senderName: localName,
          type: "speech",
          text: text.trim(),
          isFinal: true,
          timestamp: Date.now(),
        });
      }
      setSpeechTranscript(text);
    },
  });

  const signaling = new ManualSignaling();

  const {
    connectionState,
    iceConnectionState,
    localConnectionCode,
    connect,
    disconnect,
    sendData,
  } = useWebRTC({
    roomId,
    localName,
    signaling,
    localStream: mediaStream,
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      addParticipant({
        id: "remote",
        name: "Remote User",
        isLocal: false,
        isMuted: false,
        isCameraOff: false,
      });
    },
    onDataMessage: (message) => {
      if (message.type === "sign" || message.type === "speech") {
        addMessage({
          senderId: "remote",
          senderName: message.senderName || "Remote",
          type: message.type,
          text: message.text,
          confidence: message.confidence,
          isFinal: message.isFinal ?? true,
          timestamp: message.timestamp,
        });
      }
    },
    onConnectionStateChange: (state) => {
      setConnected(state === "connected");
      if (state === "connected") {
        addMessage({
          senderId: "system",
          senderName: "System",
          type: "system",
          text: "Connected to call",
          isFinal: true,
          timestamp: Date.now(),
        });
      } else if (state === "disconnected" || state === "failed") {
        addMessage({
          senderId: "system",
          senderName: "System",
          type: "system",
          text: "Call disconnected",
          isFinal: true,
          timestamp: Date.now(),
        });
      }
    },
    onIceConnectionStateChange: (state) => {
      console.log("[VideoCall] ICE state:", state);
    },
  });

  useEffect(() => {
    if (localVideoRef.current && mediaStream) {
      localVideoRef.current.srcObject = mediaStream;
      localStreamRef.current = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (isInitiator && !session) {
      setInitiator(true);
      connect().then(() => {
        setSession({
          roomId,
          localName,
          participants: [
            {
              id: "local",
              name: localName,
              isLocal: true,
              isMuted: !localAudioEnabled,
              isCameraOff: !localVideoEnabled,
            },
          ],
          isConnected: false,
          connectionCode: null,
          isInitiator: true,
        });
      });
    } else if (!isInitiator && remoteConnectionCode && !session) {
      setInitiator(false);
      connect(remoteConnectionCode).then(() => {
        setSession({
          roomId,
          localName,
          participants: [
            {
              id: "local",
              name: localName,
              isLocal: true,
              isMuted: !localAudioEnabled,
              isCameraOff: !localVideoEnabled,
            },
          ],
          isConnected: false,
          connectionCode: null,
          isInitiator: false,
        });
      });
    }
  }, [isInitiator, remoteConnectionCode, session]);

  useEffect(() => {
    if (localConnectionCode) {
      setConnectionCodeState(localConnectionCode);
      setConnectionCode(localConnectionCode);
      if (session) {
        updateSession({ connectionCode: localConnectionCode });
      }
    }
  }, [localConnectionCode]);

  useEffect(() => {
    if (mediaStream && localVideoEnabled) {
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
  }, [mediaStream, localVideoEnabled]);

  useEffect(() => {
    if (localAudioEnabled) {
      startSpeech();
    } else {
      stopSpeech();
    }
    return () => stopSpeech();
  }, [localAudioEnabled]);

  const handleCopyCode = async () => {
    if (connectionCode) {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveCall = () => {
    disconnect();
    stopMediaPipe();
    stopClassifier();
    stopSpeech();
    setShowLeaveConfirm(true);
  };

  const handleConfirmLeave = () => {
    window.location.href = "/room";
  };

  const getConnectionStatus = () => {
    if (connectionState === "connected" && iceConnectionState === "connected") return "connected";
    if (connectionState === "connecting" || iceConnectionState === "checking") return "connecting";
    return "disconnected";
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/ishara-logo.png" alt="Ishara Connect" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Ishara Connect</h1>
            <p className="text-xs text-muted-foreground">Room: {roomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-success"
                  : connectionStatus === "connecting"
                    ? "bg-warning"
                    : "bg-destructive"
              }`}
            />
            <span className="capitalize">{connectionStatus}</span>
          </div>

          {localConnectionCode && (
            <button
              onClick={() => setShowCodeModal(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
              aria-label="Show connection code"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={toggleDialoguePanel}
            className={`p-2 rounded-lg transition-colors ${showDialoguePanel ? "bg-accent" : "hover:bg-accent"}`}
            aria-label="Toggle dialogue panel"
            aria-pressed={showDialoguePanel}
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            aria-label="Leave call"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 relative ${showDialoguePanel ? "lg:max-w-[calc(100%-380px)]" : ""}`}
        >
          <div className="relative h-full">
            {remoteVideoRef.current ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <WifiOff className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <p>Waiting for remote user...</p>
                  <p className="text-sm mt-1">Share your connection code to start the call</p>
                </div>
              </div>
            )}

            {localVideoEnabled && mediaStream && (
              <div className="absolute bottom-4 right-4 m-4">
                <div className="relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-48 h-36 rounded-lg border-2 border-border bg-muted object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-48 h-36 rounded-lg pointer-events-none"
                  />
                </div>
              </div>
            )}

            {isMediaPipeRunning && landmarks && canvasRef.current && (
              <>
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  width={1280}
                  height={720}
                />
              </>
            )}

            {permissionState.video === "denied" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4">
                <div className="text-center max-w-md">
                  <VideoOff className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium text-foreground">Camera access denied</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please allow camera access in your browser settings to use video calls.
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

            {!landmarks && mediaStream && localVideoEnabled && (
              <div className="absolute bottom-20 left-4 right-4 flex justify-center pointer-events-none">
                <div className="bg-background/90 backdrop-blur px-3.5 py-1.5 rounded-full text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                  <span>No hand detected - position your hand in view</span>
                </div>
              </div>
            )}

            {isLowConfidence && prediction && (
              <div className="absolute bottom-24 left-4 right-4 flex justify-center">
                <div className="bg-warning/10 border border-warning px-4 py-2 rounded-full text-sm text-warning flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Low confidence: {prediction} ({Math.round(confidence * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2">
            <button
              onClick={toggleLocalAudio}
              className={`p-3 rounded-full transition-colors ${localAudioEnabled ? "bg-background hover:bg-accent" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
              aria-label={localAudioEnabled ? "Mute microphone" : "Unmute microphone"}
              aria-pressed={!localAudioEnabled}
            >
              {localAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleLocalVideo}
              className={`p-3 rounded-full transition-colors ${localVideoEnabled ? "bg-background hover:bg-accent" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
              aria-label={localVideoEnabled ? "Turn off camera" : "Turn on camera"}
              aria-pressed={!localVideoEnabled}
            >
              {localVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            <button
              onClick={handleLeaveCall}
              className="p-3 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              aria-label="Leave call"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showDialoguePanel && (
          <aside className="w-96 lg:w-[380px] border-l border-border bg-card flex flex-col">
            <DialoguePanel localUserId="local" />
          </aside>
        )}
      </main>

      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-card rounded-xl p-6 animate-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Connection Code</h2>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Share this code with the other participant to connect
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={connectionCode}
                readOnly
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
              />
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => setShowCodeModal(false)}
              className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRemoteCodeInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-card rounded-xl p-6 animate-in">
            <h2 className="text-lg font-semibold text-foreground mb-4">Join Call</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste the connection code from the other participant
            </p>
            <input
              type="text"
              value={remoteCode}
              onChange={(e) => setRemoteCode(e.target.value)}
              placeholder="Paste connection code here..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm font-mono mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  connect(remoteCode);
                  setShowRemoteCodeInput(false);
                }}
                disabled={!remoteCode.trim()}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Connect
              </button>
              <button
                onClick={() => setShowRemoteCodeInput(false)}
                className="flex-1 py-2 border border-input bg-background text-foreground rounded-md text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-card rounded-xl p-6 animate-in">
            <h2 className="text-lg font-semibold text-foreground mb-2">Leave Call</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to leave this call? You can rejoin later using the connection
              code.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 border border-input bg-background text-foreground rounded-md text-sm font-medium hover:bg-accent transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
