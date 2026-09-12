import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar, Footer } from "../components";
import {
  User,
  Video,
  Hand,
  Brain,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Shield,
  Copy,
  Check,
  ArrowRight,
  Radio,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/room")({
  component: Room,
});

function Room() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [engine, setEngine] = useState<"zego" | "p2p">("zego");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [callGestureMode, setCallGestureMode] = useState(true);

  const generateRoomId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const newRoomId = generateRoomId();
    setRoomId(newRoomId);

    const connectionCode = btoa(
      JSON.stringify({
        roomId: newRoomId,
        type: "offer-placeholder",
        senderName: name,
        engine,
        gestures: callGestureMode,
      })
    );
    setGeneratedCode(connectionCode);
    setShowCode(true);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const cleanInput = joinInput.trim();
    if (!cleanInput) {
      setError("Please enter a Room ID or connection code");
      return;
    }

    let targetRoomId = cleanInput;
    let targetCode = cleanInput;

    // Check if it's a base64 connection code
    try {
      if (cleanInput.length > 10) {
        const decoded = JSON.parse(atob(cleanInput));
        if (decoded.roomId) {
          targetRoomId = decoded.roomId;
        }
      }
    } catch {
      // It's a plain room ID like "ABC123"
      targetRoomId = cleanInput.toUpperCase();
    }

    navigate({
      to: "/call/$roomId",
      params: { roomId: targetRoomId },
      search: {
        name: name.trim(),
        initiator: "false",
        code: targetCode,
        engine,
        gestures: callGestureMode ? "true" : "false",
      },
    });
  };

  const handleStartCall = () => {
    if (!roomId) return;
    navigate({
      to: "/call/$roomId",
      params: { roomId },
      search: {
        name: name.trim() || "User",
        initiator: "true",
        code: generatedCode,
        engine,
        gestures: callGestureMode ? "true" : "false",
      },
    });
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/call/${roomId}?name=Guest&engine=${engine}&gestures=${callGestureMode ? "true" : "false"}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Form Section */}
            <div>
              <div className="text-left mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-medium mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Accessible 1:1 Video Calls</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-normal text-[#202124] tracking-tight">
                  {mode === "create" ? "Create a Call Room" : "Join Existing Room"}
                </h1>
                <p className="text-sm text-[#5f6368] mt-1">
                  {mode === "create"
                    ? "Start a secure video session and share the link with your call partner."
                    : "Enter a Room ID or invite code to connect with your partner."}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex bg-[#e8eaed] p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode("create");
                    setShowCode(false);
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                    mode === "create"
                      ? "bg-white text-[#202124] shadow-sm"
                      : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("join");
                    setShowCode(false);
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                    mode === "join"
                      ? "bg-white text-[#202124] shadow-sm"
                      : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  Join Room
                </button>
              </div>

              <form
                onSubmit={mode === "create" ? handleCreateRoom : handleJoinRoom}
                className="space-y-5 bg-white p-6 rounded-2xl border border-[#dadce0] shadow-sm"
              >
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f6368]" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-xl text-sm text-[#202124] placeholder:text-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                      placeholder="e.g. Alex"
                      required
                    />
                  </div>
                </div>

                {/* Call Engine Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-2">
                    Video Calling Engine
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEngine("zego")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        engine === "zego"
                          ? "border-[#1a73e8] bg-[#e8f0fe]/40 text-[#1a73e8]"
                          : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-xs text-[#202124]">
                        <Zap className="w-3.5 h-3.5 text-[#1a73e8]" />
                        <span>ZEGOCLOUD HD</span>
                      </div>
                      <p className="text-[11px] text-[#5f6368] mt-1 leading-tight">
                        Ultra-low latency, screen share, and chat
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEngine("p2p")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        engine === "p2p"
                          ? "border-[#1a73e8] bg-[#e8f0fe]/40 text-[#1a73e8]"
                          : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-xs text-[#202124]">
                        <Radio className="w-3.5 h-3.5 text-[#34a853]" />
                        <span>Direct P2P AI</span>
                      </div>
                      <p className="text-[11px] text-[#5f6368] mt-1 leading-tight">
                        Browser-to-browser isolated recognition
                      </p>
                    </button>
                  </div>
                </div>

                {/* Gesture Analysis Mode Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-2">
                    AI Gesture Recognition Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCallGestureMode(true)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        callGestureMode
                          ? "border-[#1a73e8] bg-[#e8f0fe]/50 text-[#1a73e8]"
                          : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-xs text-[#202124]">
                        <Hand className="w-3.5 h-3.5 text-[#1a73e8]" />
                        <span>With Gestures (AI On)</span>
                      </div>
                      <p className="text-[11px] text-[#5f6368] mt-1 leading-tight">
                        MediaPipe recognition, dual transcript, & subtitles
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCallGestureMode(false)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        !callGestureMode
                          ? "border-[#1a73e8] bg-[#e8f0fe]/50 text-[#1a73e8]"
                          : "border-[#dadce0] bg-white text-[#5f6368] hover:border-[#bdc1c6]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-xs text-[#202124]">
                        <Video className="w-3.5 h-3.5 text-[#5f6368]" />
                        <span>No Gestures (Pure Video)</span>
                      </div>
                      <p className="text-[11px] text-[#5f6368] mt-1 leading-tight">
                        Standard HD video call without AI gesture analysis
                      </p>
                    </button>
                  </div>
                </div>

                {/* Join Input (when mode === join) */}
                {mode === "join" && (
                  <div>
                    <label
                      htmlFor="joinInput"
                      className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1.5"
                    >
                      Room ID or Connection Code
                    </label>
                    <input
                      id="joinInput"
                      type="text"
                      value={joinInput}
                      onChange={(e) => setJoinInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#dadce0] rounded-xl text-sm font-mono text-[#202124] placeholder:text-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
                      placeholder="e.g. ABC123"
                      required
                    />
                  </div>
                )}

                {/* Generated Code Display for Room Creation */}
                {mode === "create" && showCode && roomId && (
                  <div className="p-4 bg-[#e8f0fe]/50 border border-[#d2e3fc] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1a73e8] uppercase tracking-wider">
                        Room Created: {roomId}
                      </span>
                      <span className="text-[11px] text-[#5f6368]">Ready to join</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyShareLink}
                        className="flex-1 py-2 px-3 bg-white border border-[#dadce0] hover:bg-[#f1f3f4] text-[#202124] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#34a853]" /> Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#5f6368]" /> Copy Invite Link
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleStartCall}
                        className="flex-1 py-2 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        Enter Call Room <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {(!showCode || mode === "join") && (
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1a73e8] text-white rounded-xl text-sm font-medium hover:bg-[#1557b0] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {mode === "create" ? "Generate Room" : "Join Video Call"}
                  </button>
                )}
              </form>

              <div className="mt-4 p-3 bg-white border border-[#e8eaed] rounded-xl flex items-start gap-2.5 text-xs text-[#5f6368]">
                <Shield className="w-4 h-4 text-[#34a853] flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Private & Secure:</strong> All API credentials are git-ignored and never committed to public repositories.
                </p>
              </div>
            </div>

            {/* Right Information Panel */}
            <div className="space-y-4">
              <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[#202124] mb-4">
                  Ishara Accessibility Features
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#202124]">ZEGOCLOUD 1-on-1 Calling</h3>
                      <p className="text-xs text-[#5f6368] mt-0.5">
                        Industry-standard HD audio and video with host controls, screen sharing, and in-call text chat.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#ceead6] text-[#137333] flex items-center justify-center flex-shrink-0">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#202124]">Client-Side Sign Recognition</h3>
                      <p className="text-xs text-[#5f6368] mt-0.5">
                        MediaPipe tracks 21 hand landmarks directly in your browser with zero video recording.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#feefe3] text-[#b06000] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#202124]">Two-Way Dialogue & Captions</h3>
                      <p className="text-xs text-[#5f6368] mt-0.5">
                        Sign language translations and speech-to-text live subtitles allow effortless conversation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
