import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { ArrowRight, Hand, MessageCircle, Shield, Zap, BookOpen, Video, Users, Sparkles } from "lucide-react";
import { useAuthStore } from "../stores";

export const Route = createFileRoute("/")(({
  component: Index,
}));

function Index() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════ */}
        <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-32 overflow-hidden">

          {/* Background doodle blobs */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {/* Top-left blob */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#e8f0fe] to-[#c5dbff] opacity-60 blur-3xl" />
            {/* Top-right blob */}
            <div className="absolute -top-12 -right-20 w-80 h-80 rounded-full bg-gradient-to-bl from-[#e6f4ea] to-[#b7efc5] opacity-50 blur-3xl" />
            {/* Bottom-center blob */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 rounded-full bg-gradient-to-t from-[#f0f4ff] to-transparent opacity-70 blur-2xl" />

            {/* Decorative hand doodles — floating icons */}
            <svg className="absolute top-16 right-[8%] w-14 h-14 text-[#1a73e8] opacity-10 rotate-12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 11V8a2 2 0 0 0-4 0v3H10V5a2 2 0 0 0-4 0v12l-2-2.59a2 2 0 0 0-2.83 2.83L4 21h16v-7a3 3 0 0 0-2-2.83Z"/></svg>
            <svg className="absolute bottom-24 left-[6%] w-10 h-10 text-[#34a853] opacity-15 -rotate-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18 11V8a2 2 0 0 0-4 0v3H10V5a2 2 0 0 0-4 0v12l-2-2.59a2 2 0 0 0-2.83 2.83L4 21h16v-7a3 3 0 0 0-2-2.83Z"/></svg>
            {/* Dotted circle accent */}
            <svg className="absolute top-32 left-[15%] w-20 h-20 text-[#1a73e8] opacity-8" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6"/>
            </svg>
            <svg className="absolute bottom-32 right-[12%] w-16 h-16 text-[#34a853] opacity-8" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="4 8"/>
            </svg>
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            {/* Eyebrow pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e8f0fe] border border-[#c5dbff] px-4 py-1.5 text-sm font-semibold text-[#1a73e8]">
              <Sparkles className="w-3.5 h-3.5" />
              AI Powered Sign Language Communication
            </div>

            <h1 className="text-[48px] sm:text-[64px] lg:text-[76px] leading-[1.05] font-extrabold text-[#0d1117] tracking-tight">
              Bridge the gap
              <br />
              <span className="bg-gradient-to-r from-[#1a73e8] to-[#0ea5e9] bg-clip-text text-transparent">
                between every voice
              </span>
            </h1>

            <p className="mt-7 text-xl sm:text-2xl text-[#3c4043] max-w-2xl mx-auto leading-relaxed font-medium">
              Ishara Connect turns your hand gestures into text, in real time, during a live video call.
              No specialised devices. No interpreters. Just your hands and a camera.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? "/room" : "/auth"}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#1a73e8] px-9 py-4 text-[16px] font-bold text-white hover:bg-[#1557b0] transition-all shadow-lg shadow-[#1a73e8]/30 hover:shadow-xl hover:shadow-[#1a73e8]/40 hover:-translate-y-0.5"
              >
                <Video className="h-5 w-5" />
                Start a Video Call
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to={user ? "/learn" : "/auth"}
                className="inline-flex items-center gap-2.5 rounded-full border-2 border-[#1a73e8] px-9 py-4 text-[16px] font-bold text-[#1a73e8] hover:bg-[#f0f4ff] transition-all"
              >
                <BookOpen className="h-5 w-5" />
                Learn Sign Language
              </Link>
            </div>

            <p className="mt-5 text-sm text-[#80868b]">
              {user ? "Welcome back! Jump straight in." : "Sign up free to get started, it takes 10 seconds."}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            WHAT IT DOES (visual demo mockup)
        ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-[#f8f9fa]">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0d1117] tracking-tight">
                How it works
              </h2>
              <p className="mt-4 text-lg text-[#5f6368] max-w-xl mx-auto">
                Three steps from sign to message. No extra hardware needed.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  emoji: "✋",
                  title: "Sign naturally",
                  desc: "Show ASL gestures to your camera during the video call. Ishara watches your hands in real time.",
                  color: "#1a73e8",
                  bg: "#e8f0fe",
                },
                {
                  step: "02",
                  emoji: "🤖",
                  title: "AI reads it",
                  desc: "Our on-device AI model detects your hand landmarks and classifies the sign instantly with confidence scoring.",
                  color: "#0ea5e9",
                  bg: "#e0f2fe",
                },
                {
                  step: "03",
                  emoji: "💬",
                  title: "Text appears",
                  desc: "The recognised word appears as a text subtitle on both your screen and your partner's screen simultaneously.",
                  color: "#34a853",
                  bg: "#e6f4ea",
                },
              ].map((item) => (
                <div key={item.step} className="relative bg-white rounded-2xl border-2 border-[#e8eaed] p-8 hover:border-[#1a73e8] hover:shadow-lg transition-all group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 font-black text-lg"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    {item.emoji}
                  </div>
                  <div className="absolute top-5 right-6 text-[10px] font-black text-[#dadce0] tracking-widest group-hover:text-[#1a73e8] transition-colors">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-[#0d1117] mb-2">{item.title}</h3>
                  <p className="text-[#5f6368] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            WHO IT IS FOR (problem statement)
        ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Doodle lines */}
          <div className="pointer-events-none absolute right-0 top-0 w-1/2 h-full" aria-hidden="true">
            <svg className="absolute right-8 top-12 w-40 h-40 text-[#1a73e8] opacity-5" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="3" strokeDasharray="12 8"/>
              <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10"/>
            </svg>
          </div>

          <div className="mx-auto max-w-5xl px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block text-xs font-black uppercase tracking-[0.15em] text-[#1a73e8] mb-4">The Problem</span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0d1117] leading-tight tracking-tight">
                  Millions of conversations
                  <span className="text-[#ea4335]"> lost every day</span>
                </h2>
                <p className="mt-5 text-lg text-[#5f6368] leading-relaxed">
                  Over 70 million Deaf people worldwide face daily barriers when communicating with hearing individuals. Video calls made the world smaller but left the Deaf community behind.
                </p>
                <p className="mt-3 text-lg text-[#5f6368] leading-relaxed">
                  Interpreters are expensive, hard to book, and not always available. Ishara gives everyone a way to be understood, instantly.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: "🔒", title: "100% private", desc: "All AI runs in your browser. Your video never leaves your device." },
                  { icon: "⚡", title: "Real-time speed", desc: "Gesture to text in under 200ms. No delays, no buffering." },
                  { icon: "🌍", title: "No barriers", desc: "Works on any modern browser. No app download, no account needed to try." },
                  { icon: "📚", title: "Learn as you go", desc: "Built-in learning module teaches you signs with video demos and live testing." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-5 rounded-2xl bg-[#f8f9fa] border border-[#e8eaed] hover:border-[#1a73e8] transition-colors group">
                    <div className="text-2xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-[#0d1117] group-hover:text-[#1a73e8] transition-colors">{item.title}</h3>
                      <p className="text-sm text-[#5f6368] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            FEATURES GRID
        ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-[#0d1117] text-white relative overflow-hidden">
          {/* Dark bg doodles */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-[#1a73e8] opacity-5 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#34a853] opacity-5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Built for real conversations
              </h2>
              <p className="mt-4 text-lg text-[#9aa0a6]">
                Every feature designed around accessibility and ease of use.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "AI Gesture Recognition",
                  desc: "MediaPipe tracks 21 landmarks per hand at 18 FPS. Detects Hello, Thank You, Sorry, Bye, Help and more.",
                  accent: "#1a73e8",
                },
                {
                  icon: MessageCircle,
                  title: "Live Transcript Panel",
                  desc: "Signed gestures and spoken words both appear as text for both participants in real time.",
                  accent: "#0ea5e9",
                },
                {
                  icon: Shield,
                  title: "Zero Data Leakage",
                  desc: "Recognition runs on your device. No video is uploaded anywhere. Encrypted peer to peer connection.",
                  accent: "#34a853",
                },
                {
                  icon: BookOpen,
                  title: "Learn with Videos",
                  desc: "Step by step ASL lessons with video demonstrations and live gesture testing. Interactive progress.",
                  accent: "#f9ab00",
                },
                {
                  icon: Users,
                  title: "Multi user Rooms",
                  desc: "Create a room code, share it, and both of you join the same call. Works across devices and networks.",
                  accent: "#ea4335",
                },
                {
                  icon: Hand,
                  title: "Dual Hand Tracking",
                  desc: "Tracks both hands simultaneously using MediaPipe. Shows skeleton overlay in the Live AI panel.",
                  accent: "#9c27b0",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="bg-[#1a1f2e] rounded-2xl border border-[#2d3748] p-6 hover:border-opacity-80 transition-all hover:-translate-y-1"
                  style={{ borderColor: `${f.accent}30` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${f.accent}20`, color: f.accent }}
                  >
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-[#9aa0a6] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            FINAL CTA
        ═══════════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-br from-[#1a73e8] to-[#0ea5e9] relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white opacity-5 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white opacity-5 blur-3xl" />
            <svg className="absolute right-16 top-8 w-24 h-24 text-white opacity-10 rotate-12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 11V8a2 2 0 0 0-4 0v3H10V5a2 2 0 0 0-4 0v12l-2-2.59a2 2 0 0 0-2.83 2.83L4 21h16v-7a3 3 0 0 0-2-2.83Z"/></svg>
            <svg className="absolute left-12 bottom-8 w-16 h-16 text-white opacity-10 -rotate-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18 11V8a2 2 0 0 0-4 0v3H10V5a2 2 0 0 0-4 0v12l-2-2.59a2 2 0 0 0-2.83 2.83L4 21h16v-7a3 3 0 0 0-2-2.83Z"/></svg>
          </div>

          <div className="relative mx-auto max-w-3xl px-6 text-center text-white">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
              Ready to connect?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
              Create a room, share the code with your friend, and start signing. It takes less than a minute to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? "/room" : "/auth"}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-9 py-4 text-[16px] font-bold text-[#1a73e8] hover:bg-blue-50 transition-all shadow-xl"
              >
                <Video className="h-5 w-5" />
                Start a Video Call
              </Link>
              <Link
                to={user ? "/learn" : "/auth"}
                className="inline-flex items-center gap-2.5 rounded-full border-2 border-white px-9 py-4 text-[16px] font-bold text-white hover:bg-white/10 transition-all"
              >
                <BookOpen className="h-5 w-5" />
                Learn First
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
