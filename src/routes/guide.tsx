import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { SUPPORTED_SIGNS, SIGN_HINTS } from "../lib/constants";
import {
  ArrowRight,
  Camera,
  Hand,
  MessageCircle,
  Target,
  Monitor,
  Sun,
  Lightbulb,
} from "lucide-react";

export const Route = createFileRoute("/guide")({
  component: GuidePage,
});

function GuidePage() {
  const steps = [
    {
      n: 1,
      icon: Monitor,
      title: "Create or join a room",
      desc: 'Head to the Start Call page. Click "Create Room" to generate a unique room code, or paste a code you received from someone else to join their room.',
      tip: "Room codes are 6 characters long and expire after 2 hours.",
    },
    {
      n: 2,
      icon: Camera,
      title: "Allow camera and microphone",
      desc: "Your browser will ask for camera and microphone permissions. Grant both to enable video calling and sign recognition. All processing happens locally — nothing is uploaded.",
      tip: "If you denied permissions by accident, click the camera icon in your browser address bar to reset.",
    },
    {
      n: 3,
      icon: Hand,
      title: "Start signing",
      desc: "Position your hand clearly in front of the camera. Ishara tracks 21 hand landmarks at 18 frames per second and matches your hand pose against 8 supported signs. When a sign is recognised with high confidence, it appears as text.",
      tip: "Keep your hand well-lit and in front of a plain background for best accuracy.",
    },
    {
      n: 4,
      icon: MessageCircle,
      title: "Read the dialogue",
      desc: "Both signed and spoken text appear in the dialogue panel as a flowing conversation transcript. Each message is labelled with the speaker's name and whether it was detected from a sign or from speech.",
      tip: "Toggle between English and sign gloss notation using the button at the top of the dialogue panel.",
    },
    {
      n: 5,
      icon: Target,
      title: "Practice to improve",
      desc: "Visit Practice Mode to train on individual signs. Select a target sign, hold the pose, and get instant feedback with confidence scores. Track your streak, accuracy, and session stats.",
      tip: 'Start with "Hello" (open palm) — it\'s the easiest sign to recognise reliably.',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="pt-16 pb-12 lg:pt-24 lg:pb-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-normal text-[#202124] tracking-[-0.02em]">
              How to use Ishara
            </h1>
            <p className="mt-4 text-lg text-[#5f6368]">
              A complete guide to setting up calls, signing, and practising.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="pb-16 lg:pb-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.n} className="relative pl-16 pb-12 last:pb-0">
                  {/* Vertical line */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-[#e8eaed]" />
                  )}
                  {/* Step number circle */}
                  <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-sm font-medium">
                    {step.n}
                  </div>

                  <h3 className="text-lg font-medium text-[#202124] mb-2">{step.title}</h3>
                  <p className="text-[#5f6368] leading-relaxed mb-3">{step.desc}</p>
                  <div className="flex items-start gap-2 bg-[#eff6ff] rounded-lg px-4 py-3">
                    <Lightbulb className="h-4 w-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#3b82f6]">{step.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signs reference */}
        <section className="py-16 lg:py-24 bg-[#f8f9fa]">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-2xl font-normal text-[#202124] text-center mb-4">
              Supported signs reference
            </h2>
            <p className="text-center text-[#5f6368] mb-10">
              These conversational signs are recognized in real time by the gesture classifier. Hold the hand pose steady for 1 to 2 seconds.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {SUPPORTED_SIGNS.map((sign) => (
                <div
                  key={sign}
                  className="flex items-start gap-4 bg-white rounded-xl border border-[#e8eaed] p-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center text-lg font-semibold flex-shrink-0">
                    {sign.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#202124]">{sign}</h3>
                    <p className="text-sm text-[#5f6368] mt-0.5">{SIGN_HINTS[sign]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-normal text-[#202124] text-center mb-10">
              Tips for best results
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Sun,
                  title: "Good lighting",
                  desc: "Face a window or lamp so your hand is evenly lit. Avoid backlighting.",
                },
                {
                  icon: Camera,
                  title: "Camera position",
                  desc: "Keep your hand between your chest and face, roughly 30–60 cm from the camera.",
                },
                {
                  icon: Hand,
                  title: "Clear hand pose",
                  desc: 'Spread your fingers clearly for signs like "Hello". Avoid overlapping fingers when not needed.',
                },
                {
                  icon: Monitor,
                  title: "Use Chrome",
                  desc: "Chrome has the best support for MediaPipe and the Web Speech API. Edge also works well.",
                },
              ].map((tip) => (
                <div key={tip.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#f0fdf4] text-[#0d9488] flex items-center justify-center flex-shrink-0">
                    <tip.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#202124]">{tip.title}</h3>
                    <p className="text-sm text-[#5f6368] mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-[#f8f9fa]">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-normal text-[#202124] mb-6">Ready to try it?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/room"
                className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] px-8 py-3 text-[15px] font-medium text-white hover:bg-[#2563eb] transition-colors"
              >
                Start a Call
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-8 py-3 text-[15px] font-medium text-[#3b82f6] hover:bg-[#f8faff] transition-colors"
              >
                Try Practice Mode
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
