import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { APP_NAME, APP_TAGLINE, SUPPORTED_SIGNS, SIGN_HINTS } from "../lib/constants";
import {
  Target,
  Video,
  MessageSquare,
  Brain,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Download,
  Github,
  Twitter,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const features = [
    {
      icon: Video,
      title: "Real-time Video Calls",
      description:
        "High-quality 1:1 video calls with WebRTC peer-to-peer connectivity. No server required for the connection.",
    },
    {
      icon: Brain,
      title: "AI Sign Recognition",
      description:
        "Client-side hand tracking using MediaPipe detects 8 common signs in real-time at 18 FPS with temporal smoothing.",
    },
    {
      icon: MessageSquare,
      title: "Live Dialogue Panel",
      description:
        "Conversation history with speaker labels, sign vs speech tags, confidence scores, and gloss translation toggle.",
    },
    {
      icon: Target,
      title: "Practice Mode",
      description:
        "Interactive practice studio with visual hints, real-time feedback, accuracy tracking, and streak counters.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "All processing happens in your browser. No video or audio leaves your device. No account required.",
    },
    {
      icon: Users,
      title: "Accessibility Focused",
      description:
        "High contrast mode, reduced motion support, screen reader compatible, and keyboard navigable.",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Create or Join a Room",
      description:
        "Generate a room ID and share the connection code with your conversation partner.",
    },
    {
      step: "02",
      title: "Allow Camera & Mic",
      description:
        "Grant permissions for video, audio, and hand tracking. All processing stays local.",
    },
    {
      step: "03",
      title: "Start Communicating",
      description:
        "Sign naturally — recognized signs appear instantly in the dialogue panel with confidence scores.",
    },
    {
      step: "04",
      title: "Review & Practice",
      description:
        "Review the conversation transcript or jump to practice mode to improve your signing accuracy.",
    },
  ];

  const supportedSignsList = SUPPORTED_SIGNS.map((sign) => ({
    label: sign,
    hint: SIGN_HINTS[sign],
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Now in Public Beta — Free to use
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-in">
                {APP_NAME} <span className="text-primary">Connect</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in">
                {APP_TAGLINE}
              </p>
              <p className="text-base text-muted-foreground mb-10 max-w-xl mx-auto animate-in">
                Accessible video calls powered by real-time sign language recognition. Bridge
                communication between Deaf and hearing communities — no server, no signup, just open
                a link.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in">
                <Link
                  to="/room"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start a Call
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/practice"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-8 py-3 text-lg font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Try Practice Mode
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground animate-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>No account required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Peer-to-peer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Open source</span>
                </div>
              </div>
            </div>

            <div className="mt-16 relative">
              <div className="aspect-video rounded-xl border border-border bg-muted/50 overflow-hidden shadow-2xl">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                  <div className="text-center p-8">
                    <Video className="mx-auto h-16 w-16 text-primary/50 mb-4" />
                    <p className="text-muted-foreground">
                      Video call demo — try it live at <span className="font-mono">/room</span>
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="absolute -bottom-6 -right-6 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
                aria-hidden="true"
              />
              <div
                className="absolute -top-6 -left-6 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Four simple steps to start accessible video conversations
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="relative p-6 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors"
                >
                  <span className="text-4xl font-bold text-primary/20 mb-4 block">{step.step}</span>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Features</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need for accessible sign language communication
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Supported Signs
              </h2>
              <p className="text-lg text-muted-foreground">
                The local classifier recognizes these 8 common signs with high accuracy
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {supportedSignsList.map(({ label, hint }) => (
                <div
                  key={label}
                  className="p-4 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {label.charAt(0)}
                    </div>
                    <h3 className="font-semibold text-foreground">{label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to Start?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Create a room, share the connection code, and start communicating in seconds. No
              installation, no account, no server required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/room"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create a Room
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/practice"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-8 py-3 text-lg font-medium text-foreground transition-colors hover:bg-accent"
              >
                Practice First
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
