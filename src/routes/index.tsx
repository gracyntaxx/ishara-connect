import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { APP_TAGLINE, SUPPORTED_SIGNS } from "../lib/constants";
import { ArrowRight, Hand, MessageCircle, Shield, Zap, BookOpen, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────── */}
        <section className="pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-4 py-1.5 text-sm text-[#5f6368]">
              <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
              Free &amp; open source
            </div>

            <h1 className="text-[44px] sm:text-[56px] leading-[1.1] font-normal text-[#202124] tracking-[-0.02em]">
              Sign language meets
              <br />
              <span className="text-[#3b82f6]">real-time conversation</span>
            </h1>

            <p className="mt-6 text-lg text-[#5f6368] max-w-xl mx-auto leading-relaxed">
              Ishara Connect uses AI to recognise hand gestures in real time and convert them to text —
              making video calls accessible for Deaf and hearing users alike.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/room"
                className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-8 py-3 text-[15px] font-medium text-white hover:bg-[#1557b0] transition-colors shadow-sm"
              >
                Start a Call
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-8 py-3 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f0f4ff] transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Learn Sign Language
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[#80868b]">
              <span>Free to use</span>
              <span className="h-1 w-1 rounded-full bg-[#dadce0]" />
              <span>Works in your browser</span>
              <span className="h-1 w-1 rounded-full bg-[#dadce0]" />
              <span>No download needed</span>
            </div>
          </div>
        </section>

        {/* ─── Product preview ──────────────────────────────── */}
        <section className="pb-20 lg:pb-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-[#e8eaed] bg-[#f8f9fa] overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Video call mockup */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="rounded-xl bg-[#202124] aspect-video flex items-center justify-center relative overflow-hidden">
                    <div className="text-center">
                      <Hand className="mx-auto h-10 w-10 text-[#3b82f6] mb-3" />
                      <p className="text-sm text-[#9aa0a6]">Live sign recognition</p>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#0d9488] text-white text-xs px-2 py-1 rounded-md font-medium">
                      Hello — 94%
                    </div>
                  </div>
                </div>
                {/* Dialogue mockup */}
                <div className="p-8 bg-white border-l border-[#e8eaed] flex flex-col justify-center">
                  <p className="text-xs font-medium text-[#80868b] uppercase tracking-wider mb-4">
                    Live Dialogue
                  </p>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-medium text-[#3b82f6]">You</span>
                      <p className="text-[#202124] mt-0.5">Hello, how are you?</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#0d9488]">Alex</span>
                      <p className="text-[#202124] mt-0.5">I'm good, thank you!</p>
                    </div>
                    <div>
                      <span className="font-medium text-[#3b82f6]">You</span>
                      <p className="text-[#202124] mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[#0d9488] bg-[#f0fdfa] px-1.5 py-0.5 rounded text-xs font-medium">
                          ✋ Thank You
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Problem → Solution ───────────────────────────── */}
        <section className="py-16 lg:py-24 bg-[#f8f9fa]">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] tracking-[-0.01em]">
                  Communication should be
                  <br />
                  <span className="text-[#3b82f6]">accessible to everyone</span>
                </h2>
                <p className="mt-4 text-[#5f6368] leading-relaxed">
                  Millions of Deaf and hard-of-hearing individuals face daily barriers in
                  conversations with hearing people. Existing tools are expensive, require
                  specialised hardware, or send private video to remote servers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#202124] mb-3">Ishara changes that</h3>
                <ul className="space-y-3 text-[#5f6368]">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-[#e8f5e9] text-[#10b981] flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>Recognition runs entirely in your browser — zero cloud processing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-[#e8f5e9] text-[#10b981] flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>No downloads, no installation — works in any modern browser</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-[#e8f5e9] text-[#10b981] flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>Video stays between you and your partner via peer-to-peer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 rounded-full bg-[#e8f5e9] text-[#10b981] flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>Practice mode helps you learn and improve at your own pace</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── How it works (step line) ─────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] text-center mb-16 tracking-[-0.01em]">
              Get started in four steps
            </h2>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connecting line */}
              <div
                className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-[2px] bg-[#e8eaed]"
                aria-hidden="true"
              />

              {[
                {
                  n: "1",
                  title: "Create a room",
                  desc: "Generate a room code and share it with your conversation partner.",
                },
                {
                  n: "2",
                  title: "Allow camera",
                  desc: "Grant camera and microphone access. All processing stays on your device.",
                },
                {
                  n: "3",
                  title: "Start signing",
                  desc: "Sign naturally — recognised signs appear as text in real time.",
                },
                {
                  n: "4",
                  title: "Review & learn",
                  desc: "Check the dialogue transcript or head to practice mode to improve.",
                },
              ].map((step) => (
                <div key={step.n} className="text-center relative">
                  <div className="mx-auto w-12 h-12 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-lg font-medium relative z-10">
                    {step.n}
                  </div>
                  <h3 className="mt-4 text-[15px] font-medium text-[#202124]">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#5f6368] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─────────────────────────────────────── */}
        <section className="py-16 lg:py-24 bg-[#f8f9fa]">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] text-center mb-12 tracking-[-0.01em]">
              Built for accessibility
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Real-time recognition",
                  desc: "MediaPipe tracks 21 hand landmarks at 18 FPS. A rule-based classifier identifies 8 signs with temporal smoothing.",
                  color: "#3b82f6",
                },
                {
                  icon: MessageCircle,
                  title: "Live dialogue panel",
                  desc: "Conversation flows like a transcript with speaker names, sign vs speech labels, and confidence scores.",
                  color: "#0d9488",
                },
                {
                  icon: Shield,
                  title: "Privacy first",
                  desc: "No video leaves your browser. No account needed. WebRTC connects you directly to your partner.",
                  color: "#10b981",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-xl border border-[#e8eaed] p-6 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${f.color}15`, color: f.color }}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[15px] font-medium text-[#202124] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#5f6368] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Supported signs ──────────────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] mb-4 tracking-[-0.01em]">
              8 signs, recognised instantly
            </h2>
            <p className="text-[#5f6368] mb-8">
              The local classifier supports these signs at launch. More can be added by editing one
              file.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {SUPPORTED_SIGNS.map((sign) => (
                <span
                  key={sign}
                  className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                  {sign}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── More links ───────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-[#f8f9fa]">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                to="/guide"
                className="group flex items-center gap-4 rounded-xl border border-[#e8eaed] bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-[#202124] group-hover:text-[#3b82f6] transition-colors">
                    How to use Ishara
                  </h3>
                  <p className="text-sm text-[#5f6368] mt-0.5">
                    Step-by-step guide, tips, and supported sign reference.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#80868b] ml-auto flex-shrink-0 group-hover:text-[#3b82f6] transition-colors" />
              </Link>

              <Link
                to="/leaderboard"
                className="group flex items-center gap-4 rounded-xl border border-[#e8eaed] bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] text-[#10b981] flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-[#202124] group-hover:text-[#10b981] transition-colors">
                    Leaderboard
                  </h3>
                  <p className="text-sm text-[#5f6368] mt-0.5">
                    See how your practice compares with others.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#80868b] ml-auto flex-shrink-0 group-hover:text-[#10b981] transition-colors" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ────────────────────────────────────── */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] mb-4 tracking-[-0.01em]">
              Ready to start?
            </h2>
            <p className="text-[#5f6368] mb-8 max-w-md mx-auto">
              Create a room, share the code, and start communicating in seconds. No installation, no
              account required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/room"
                className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] px-8 py-3 text-[15px] font-medium text-white hover:bg-[#2563eb] transition-colors shadow-sm"
              >
                Create a Room
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-8 py-3 text-[15px] font-medium text-[#3b82f6] hover:bg-[#f8faff] transition-colors"
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
