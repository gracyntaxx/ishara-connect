import { createFileRoute } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { Shield, Eye, Lock, Database, Brain, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  const lastUpdated = "September 12, 2026";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Privacy Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-foreground">Overview</h2>
              <p>
                Ishara Connect is designed with privacy as a core principle. This policy explains
                what data we process, how it's used, and your rights. In short:{" "}
                <strong>your video, audio, and sign language data never leaves your device.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Data We Process</h2>
              <div className="space-y-4 mt-4">
                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                  <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">
                      Camera & Microphone (Local Only)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Video and audio streams are captured for the WebRTC call and hand tracking.
                      <strong>This data never leaves your browser</strong> — it goes directly to the
                      other participant via peer-to-peer WebRTC.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                  <Brain className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Hand Landmarks (Local Only)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      MediaPipe extracts 21 3D hand landmarks per frame for sign classification.
                      This numerical data is processed entirely in your browser and discarded after
                      classification.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                  <MessageSquare className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Recognized Signs & Speech Text</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      When you make a sign or speak, the recognized text is sent to the other
                      participant via the WebRTC data channel. This is the <em>only</em> data that
                      leaves your device during a call.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                  <Database className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Local Storage (Your Device)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Settings (theme, preferences), practice statistics, and dialogue history are
                      stored in your browser's localStorage/sessionStorage. You can clear this
                      anytime in Settings.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">What We DON'T Collect</h2>
              <ul className="space-y-3 mt-4">
                <li className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-destructive" />
                  <span>No video recordings or screenshots</span>
                </li>
                <li className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-destructive" />
                  <span>No audio recordings</span>
                </li>
                <li className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-destructive" />
                  <span>No hand landmark data stored or transmitted</span>
                </li>
                <li className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-destructive" />
                  <span>No personal identifiers (no accounts, no emails required)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-destructive" />
                  <span>No analytics, tracking, or telemetry</span>
                </li>
                <li className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-destructive" />
                  <span>No third-party scripts (except MediaPipe from Google CDN)</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Third-Party Services</h2>
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-medium text-foreground">MediaPipe (Google)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hand landmark detection models are loaded from Google's CDN (
                    <code>cdn.jsdelivr.net</code> and <code>storage.googleapis.com</code>). See{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Google's Privacy Policy
                    </a>
                    . No user data is sent to Google — the models run locally via WebAssembly.
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-medium text-foreground">Gemini API (Optional)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    If you enable the optional Gemini fallback and provide an API key,
                    low-confidence sign images are sent to Google's Gemini API for classification.
                    This is <strong>disabled by default</strong>
                    and requires explicit opt-in with your own API key.
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-medium text-foreground">STUN Servers (Google)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    WebRTC uses Google's public STUN servers (<code>stun.l.google.com:19302</code>)
                    for NAT traversal. These servers only see your IP address temporarily to
                    establish the peer connection.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Data Retention</h2>
              <ul className="space-y-2 mt-4">
                <li>
                  <strong>Call data:</strong> Exists only during the active call. Destroyed when you
                  leave.
                </li>
                <li>
                  <strong>Local settings:</strong> Persist until you clear browser data or use the
                  "Reset" option in Settings.
                </li>
                <li>
                  <strong>Practice stats:</strong> Stored locally until you clear them or uninstall
                  the app.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Your Rights</h2>
              <ul className="space-y-2 mt-4">
                <li>
                  🗑️ <strong>Delete all data:</strong> Clear browser storage for this origin
                </li>
                <li>
                  ⚙️ <strong>Control permissions:</strong> Revoke camera/mic access in browser
                  settings
                </li>
                <li>
                  🚫 <strong>Opt out completely:</strong> Close the tab — no persistent identifiers
                  remain
                </li>
                <li>
                  📤 <strong>Export your data:</strong> Use "Export" buttons in Practice and
                  Leaderboard pages
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Children's Privacy</h2>
              <p className="mt-4">
                Ishara Connect is not directed at children under 13. We do not knowingly collect
                personal information from children. Since we don't collect any personal information
                at all, COPPA compliance is inherent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Changes to This Policy</h2>
              <p className="mt-4">
                We may update this policy as features evolve. The "Last updated" date at the top
                will reflect changes. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">Contact</h2>
              <p className="mt-4">
                Questions about this policy? Open an issue on our{" "}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  GitHub repository
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
