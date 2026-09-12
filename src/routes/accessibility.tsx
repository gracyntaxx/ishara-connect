import { createFileRoute } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import {
  Eye,
  Keyboard,
  Contrast,
  Move,
  Volume2,
  Brain,
  CheckCircle,
  Target,
  Shield,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/accessibility")({
  component: Accessibility,
});

function Accessibility() {
  const features = [
    {
      icon: Contrast,
      title: "High Contrast Mode",
      description:
        "Toggle a high-contrast color scheme that meets WCAG 2.1 AAA contrast ratios. All text, borders, and interactive elements maintain 7:1 contrast.",
      wcag: "1.4.6 Contrast (Enhanced)",
      implemented: true,
    },
    {
      icon: Move,
      title: "Reduced Motion",
      description:
        "Disable all non-essential animations, transitions, and auto-playing media. Respects the prefers-reduced-motion media query.",
      wcag: "2.3.3 Animation from Interactions",
      implemented: true,
    },
    {
      icon: Keyboard,
      title: "Full Keyboard Navigation",
      description:
        "Every interactive element is reachable and operable via keyboard. Focus indicators are visible and meet 3:1 contrast against adjacent colors.",
      wcag: "2.1.1 Keyboard, 2.4.7 Focus Visible",
      implemented: true,
    },
    {
      icon: Eye,
      title: "Screen Reader Support",
      description:
        "Semantic HTML, ARIA labels, roles, and live regions for dynamic content. Dialogue panel uses aria-live for real-time updates.",
      wcag: "4.1.2 Name, Role, Value",
      implemented: true,
    },
    {
      icon: Volume2,
      title: "Speech Recognition",
      description:
        "Web Speech API integration for real-time speech-to-text. Works as an alternative input method for users who cannot sign.",
      wcag: "2.5.1 Pointer Gestures, 2.5.2 Pointer Cancellation",
      implemented: true,
    },
    {
      icon: Brain,
      title: "Visual Sign Feedback",
      description:
        "Real-time visual feedback for sign recognition including confidence meters, correctness indicators, and hand landmark overlay option.",
      wcag: "3.3.1 Error Identification, 3.3.3 Error Suggestion",
      implemented: true,
    },
    {
      icon: Target,
      title: "Practice Mode Accessibility",
      description:
        "Adjustable confidence thresholds, visual hints for each sign, streak counters with text alternatives, and exportable progress data.",
      wcag: "2.5.3 Label in Name, 3.3.2 Labels or Instructions",
      implemented: true,
    },
    {
      icon: Shield,
      title: "Privacy by Design",
      description:
        "All AI processing happens locally. No video, audio, or biometric data leaves your device. No accounts or tracking required.",
      wcag: "Privacy Principle",
      implemented: true,
    },
  ];

  const keyboardShortcuts = [
    { keys: ["Tab"], action: "Navigate forward" },
    { keys: ["Shift", "Tab"], action: "Navigate backward" },
    { keys: ["Enter", "Space"], action: "Activate buttons/links" },
    { keys: ["Escape"], action: "Close modals/dropdowns" },
    { keys: ["Arrow keys"], action: "Navigate within components" },
    { keys: ["H"], action: "Toggle high contrast (in call)" },
    { keys: ["M"], action: "Toggle microphone (in call)" },
    { keys: ["V"], action: "Toggle camera (in call)" },
    { keys: ["D"], action: "Toggle dialogue panel (in call)" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Accessibility Statement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Accessibility</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ishara Connect is built to be accessible to everyone. We target WCAG 2.1 Level AA
              compliance and strive for Level AAA where possible.
            </p>
          </div>

          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-foreground">Supported Features</h2>
            <div className="space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                        {feature.implemented && (
                          <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{feature.description}</p>
                      <p className="text-xs text-primary font-medium">{feature.wcag}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-foreground">Keyboard Shortcuts</h2>
            <p className="text-muted-foreground">
              Global shortcuts work anywhere in the app. In-call shortcuts work during active video
              calls.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 font-medium text-foreground">Keys</th>
                    <th className="pb-3 font-medium text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {keyboardShortcuts.map((shortcut) => (
                    <tr key={shortcut.keys.join("+")} className="border-b border-border/50">
                      <td className="py-3">
                        <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono text-foreground">
                          {shortcut.keys.join(" + ")}
                        </kbd>
                      </td>
                      <td className="py-3 text-muted-foreground">{shortcut.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-foreground">Testing & Compliance</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Automated Testing</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> axe-core integration in CI
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Color contrast validation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> ARIA attribute checking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Keyboard navigation tests
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Manual Testing</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> NVDA + Firefox
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> VoiceOver + Safari
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> JAWS + Chrome
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Keyboard-only navigation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> High contrast mode
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Reduced motion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Zoom up to 200%
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-foreground">Known Limitations</h2>
            <div className="p-6 rounded-xl border border-border bg-card">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Sign recognition accuracy</strong> varies with lighting, camera quality,
                    and signing style. The classifier is designed for clear, frontal signing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Speech recognition</strong> requires browser support (Chrome, Edge,
                    Safari) and may not work in all languages or accents.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Hand tracking</strong> requires a visible hand in good lighting. May not
                    work well with gloves, dark skin tones in low light, or complex backgrounds.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Only 8 signs</strong> are currently supported. We're working to expand
                    the vocabulary.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Feedback & Support</h2>
            <p className="text-muted-foreground mb-4">
              Accessibility is an ongoing commitment. If you encounter barriers or have suggestions:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                📧 Open an issue on{" "}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  GitHub
                </a>
              </li>
              <li>🐛 Use the "Report Issue" button in the app (when available)</li>
              <li>💬 Join our community discussions</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
