# Ishara — accessible sign ↔ speech calling

A browser-based platform for 1:1 conversation between sign-language users and speaking users. Hand-sign recognition and speech-to-text both run inside the browser; only the resulting text is ever shared.

## Two notes before we build

**Logo** — your uploaded ishara mark is in. Full logo in the top-left header on every page, the icon on its own in tight spaces, and a square version as the browser tab icon.

**How two people connect** — you want a real backend later, so for now connecting works by copy/paste: the person who creates a room copies a short connection code and sends it to their partner (chat, email, whatever), the partner pastes it back. No server needed. The connection logic sits behind one small swappable piece, so when your Express backend exists, room IDs will "just connect" without touching the call, recognition, or dialogue code.

## Pages

- `/` Landing — logo, "Talk with signs. Understand with text.", problem → solution, feature cards, how it works, Start a Call / Try Practice Mode
- `/room` Create or Join — two large cards, guest mode, sign-in placeholders (email/password + Google, visually present, not wired)
- `/call/:roomId` The call — your video and your partner's side by side, dialogue panel underneath, controls for mic, camera, speech, practice
- `/practice` Practice mode — pick a target sign, live camera, instant Correct / Try again with a confidence meter, session score, Save progress (stub)
- `/leaderboard` — local sample data + "Coming soon with backend"
- `/settings` — theme, high-contrast toggle, camera/mic permission status
- `/about`, `/privacy`, `/accessibility`

## The dialogue panel

Messages read like a transcript of a conversation, not chat bubbles:

```text
You            hi, how are you?
Alex           hi, im fine.
You            thankyou
```

Named speakers ("You" / partner's name), clear visual difference between the two sides, timestamps on hover, smooth auto-scroll, and a toggle between plain English and simple gloss.

## Recognition

Camera → hand tracking (~15–20 fps) → 21 hand points → local classifier → only accept above 65% confidence → confirm across 5–8 frames before showing it → append to the dialogue and send the text to your partner.

Signs supported at launch, editable in one place: Hello, Thank You, Yes, No, Help, Good, Sorry, Please.

Speech-to-text runs alongside it in browsers that support it; where it isn't supported the control is disabled with a "Chrome recommended" note.

## What happens when things go wrong

- Camera or mic blocked → full-screen explanation with a retry button
- No hand in frame → "Show a supported sign"
- Unsure reading → keeps the last confident word or shows "…"
- Partner disconnects → status banner, call stays usable
- Optional AI fallback or a future backend being down never blocks anything

## Colours and accessibility

Your exact palette (indigo #3B82F6, teal #0D9488, slate white #F8FAFC, white surfaces, #0F172A / #64748B text, emerald #10B981, amber #F59E0B) becomes the app's design tokens. Dark mode plus a separate high-contrast mode toggle. Keyboard-reachable controls, visible focus, live-region announcements for new dialogue lines, WCAG 2.1 AA contrast.

## Technical notes

- This project runs on Lovable's TanStack Start stack (React 19 + Vite + TypeScript strict + Tailwind v4 + shadcn/ui). Routing is TanStack Router file routes under `src/routes/` rather than React Router v6 — same URLs, same structure. Everything else in your spec (Zustand, MediaPipe Tasks Vision Hand Landmarker, Web Speech API, native WebRTC) is used as specified.
- Structure: `src/components/{VideoCall,DialoguePanel,Practice}`, `src/hooks/{useMediaPipe,useLocalClassifier,useSpeechRecognition,useWebRTC}.ts`, `src/lib/{classifier,gemini,constants.ts}`, `src/stores/`, routes in `src/routes/`.
- Typed data-channel payload exactly as specified: `{ type: "sign" | "speech" | "control", text, confidence?, isFinal?, timestamp, senderName? }`.
- Classifier: geometric rules over normalised landmark distances/angles per sign, scored 0–1, with a ring buffer for majority-vote smoothing. Pure functions, unit-testable, no model download.
- Signaling is isolated behind a `SignalingTransport` interface with a manual copy/paste implementation; a future `HttpSignaling` hitting Express drops in without changing `useWebRTC`.
- MediaPipe and speech APIs are browser-only, so camera surfaces mount client-side after hydration.
- Gemini fallback is stubbed behind a feature flag, off by default, only fires below 0.65 confidence with a 1.5s throttle and a result cache.
- `.env.example` plus a README with two-browser demo instructions.

## Not included, per your instructions

Continuous signing, full ISL translation, multi-party calls, any server-side video or landmark processing.
