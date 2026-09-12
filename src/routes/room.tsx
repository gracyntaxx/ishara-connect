import { createFileRoute } from "@tanstack/react-router";
import { Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar, Footer } from "../components";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Video,
  Brain,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/room")({
  component: Room,
});

function Room() {
  const search = useSearch({ from: "/room" });
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  const generateRoomId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name.trim()) {
      setError("Please enter your name");
      setIsLoading(false);
      return;
    }

    const newRoomId = generateRoomId();
    setRoomId(newRoomId);

    const connectionCode = btoa(
      JSON.stringify({
        roomId: newRoomId,
        type: "offer-placeholder",
        senderName: name,
      }),
    );
    setGeneratedCode(connectionCode);
    setShowCode(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name.trim()) {
      setError("Please enter your name");
      setIsLoading(false);
      return;
    }

    if (!joinCode.trim()) {
      setError("Please enter a connection code");
      setIsLoading(false);
      return;
    }

    try {
      const decoded = JSON.parse(atob(joinCode.trim()));
      if (decoded.roomId) {
        setRoomId(decoded.roomId);
      }
    } catch {
      setError("Invalid connection code format");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleStartCall = () => {
    if (mode === "create" && roomId) {
      window.location.href = `/call/${roomId}?name=${encodeURIComponent(name)}&initiator=true&code=${encodeURIComponent(generatedCode)}`;
    } else if (mode === "join" && roomId) {
      window.location.href = `/call/${roomId}?name=${encodeURIComponent(name)}&initiator=false&code=${encodeURIComponent(joinCode)}`;
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
              <div className="text-center lg:text-left mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  {mode === "create" ? "Create a Room" : "Join a Room"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {mode === "create"
                    ? "Generate a room and share the connection code to start a call"
                    : "Enter a connection code from another participant to join their call"}
                </p>
              </div>

              <form
                onSubmit={mode === "create" ? handleCreateRoom : handleJoinRoom}
                className="space-y-6 bg-card p-6 rounded-xl border border-border"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Enter your name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {mode === "create" ? (
                  <>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4">
                        A connection code will be generated. Share it with the person you want to
                        call.
                      </p>
                    </div>
                    {showCode && generatedCode && (
                      <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Connection Code</span>
                          <span className="text-xs text-muted-foreground">
                            Share this with the other participant
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={generatedCode}
                            readOnly
                            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={copyCode}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor="joinCode"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Connection Code
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          id="joinCode"
                          type="text"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono"
                          placeholder="Paste connection code here..."
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {mode === "create" ? "Creating..." : "Joining..."}
                    </>
                  ) : mode === "create" ? (
                    "Create Room"
                  ) : (
                    "Join Room"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === "create" ? "Already have a code?" : "Want to create a room instead?"}{" "}
                  <button
                    onClick={() => {
                      setMode(mode === "create" ? "join" : "create");
                      setError("");
                      setShowCode(false);
                      setGeneratedCode("");
                      setJoinCode("");
                      setRoomId("");
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === "create" ? "Join instead" : "Create instead"}
                  </button>
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-card border border-border rounded-xl p-8 h-full">
                <h2 className="text-xl font-semibold text-foreground mb-6">How It Works</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">No Server Required</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connection codes are exchanged directly between participants. No central
                        server, no recording.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Video className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Peer-to-Peer Video</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        WebRTC establishes a direct connection. Your video and audio never touch our
                        servers.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Local AI Recognition</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        MediaPipe hand tracking runs entirely in your browser. 8 signs recognized at
                        18 FPS.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Live Dialogue Panel</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Real-time transcript with speaker names, sign vs speech tags, and gloss
                        translation.
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
