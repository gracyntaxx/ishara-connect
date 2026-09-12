import { createFileRoute } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { APP_NAME, APP_TAGLINE, SUPPORTED_SIGNS } from "../lib/constants";
import { Target, Brain, Shield, Users, Code, Heart, Github, Twitter } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Target className="h-5 w-5" />
              <span className="font-medium">About Ishara Connect</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {APP_NAME} <span className="text-primary">Connect</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{APP_TAGLINE}</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Our Mission</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="mb-4">
                  Communication is a fundamental human right. Yet millions of Deaf and
                  hard-of-hearing individuals face barriers in everyday video calls — from work
                  meetings to catching up with family.
                </p>
                <p className="mb-4">
                  Ishara Connect was built to bridge this gap. By combining real-time hand tracking
                  with a lightweight rule-based classifier, we enable sign language recognition
                  directly in the browser — no servers, no accounts, no compromises.
                </p>
                <p className="mb-4">
                  Our goal is simple: make video communication accessible to everyone, regardless of
                  hearing ability. Whether you're Deaf, hard of hearing, or hearing, Ishara Connect
                  helps you communicate naturally.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-border bg-card">
                  <Brain className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Local AI Processing
                  </h3>
                  <p className="text-muted-foreground">
                    MediaPipe hand tracking runs entirely in your browser at 18 FPS. Your video
                    never leaves your device.
                  </p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-card">
                  <Target className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Rule-Based Classification
                  </h3>
                  <p className="text-muted-foreground">
                    8 common signs recognized using geometric finger analysis — no heavy models to
                    download, works offline.
                  </p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-card">
                  <Shield className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Peer-to-Peer WebRTC
                  </h3>
                  <p className="text-muted-foreground">
                    Direct browser-to-browser connections via connection codes. No central server,
                    no recording, complete privacy.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Supported Signs</h2>
              <p className="text-muted-foreground mb-6">
                The current version recognizes these 8 fundamental signs. More signs coming soon!
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SUPPORTED_SIGNS.map((sign) => (
                  <div
                    key={sign}
                    className="p-4 rounded-lg border border-border bg-card text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                      {sign.charAt(0)}
                    </div>
                    <p className="font-medium text-foreground">{sign}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Technology Stack</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <Code className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Frontend</h3>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>React 19 + TypeScript</li>
                    <li>TanStack Router + Start</li>
                    <li>Tailwind CSS v4</li>
                    <li>Zustand for state</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <Brain className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">AI & Media</h3>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>@mediapipe/tasks-vision</li>
                    <li>Web Speech API</li>
                    <li>WebRTC (P2P)</li>
                    <li>Custom rule-based classifier</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <Users className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Accessibility</h3>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>WCAG 2.1 AA compliant</li>
                    <li>High contrast mode</li>
                    <li>Reduced motion support</li>
                    <li>Keyboard navigation</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <Heart className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Open Source</h3>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>MIT License</li>
                    <li>Community driven</li>
                    <li>Extensible architecture</li>
                    <li>Backend-ready design</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border-t border-border pt-10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Get Involved</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="mb-4">
                  Ishara Connect is open source and community-driven. We welcome contributions of
                  all kinds:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Code className="h-5 w-5" /> Add new signs to the classifier
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-5 w-5" /> Translate the interface
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Improve accessibility
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="h-5 w-5" /> Report bugs & suggest features
                  </li>
                </ul>
                <div className="flex items-center justify-center gap-4">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="h-6 w-6" />
                    GitHub
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-6 w-6" />
                    Twitter
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Globe({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12h20" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
