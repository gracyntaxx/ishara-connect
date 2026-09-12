# Ishara Connect

---
FINAL WEBSITE GENERATION PROMPT
---

You are a Senior Frontend Engineer, Product Architect, and Accessibility-focused UI/UX Designer. Build a complete, production-ready frontend for **Ishara**.

### Product Vision
Ishara is a browser-based accessibility platform that enables real-time 1:1 communication between sign-language users and speaking users through:
- 1:1 video calling
- Isolated static hand-sign recognition (5–8 signs) → live text
- Speech-to-text → live text
- Real-time dialogue-style text exchange
- Interactive practice mode

All critical recognition runs 100% client-side for privacy and low latency. Backend, database, and Gemini are optional and must never break the core experience. The frontend must be ready to connect to a real Express + MongoDB backend later.

### Logo
Use the exact provided logo image (hand forming “OK / thank-you” gesture inside a speech-bubble outline + the word “ishara” with a teal dot on the “i”).  
- Place the full logo in the top-left header on every page  
- Use as favicon  
- Use the icon-only version in tight spaces

### Color System (strict – extracted & confirmed from logo)
| Role                | Color Name         | Hex Code | Purpose                                            |
|---------------------|--------------------|----------|----------------------------------------------------|
| Primary             | Deep Ocean Indigo  | #3B82F6  | Main brand, primary buttons, active UI elements    |
| Secondary / Accent  | Accessibility Teal | #0D9488  | Active hand-tracking indicators, practice progress |
| Background (Light)  | Crisp Slate White  | #F8FAFC  | Main app background                                |
| Surface / Card      | Soft White         | #FFFFFF  | Video panels, chat containers, cards               |
| Text (Primary)      | Midnight Slate     | #0F172A  | Primary typography, headers, dialogue text         |
| Text (Muted)        | Muted Slate        | #64748B  | Timestamps, inactive labels, subheadings           |
| Success / Validated | Emerald Green      | #10B981  | High-confidence sign match, correct practice       |
| Warning / Fallback  | Amber Orange       | #F59E0B  | Low-confidence detection, Gemini fallback active   |

Theme must feel warm, vibrant, and approachable while remaining highly accessible (WCAG 2.1 AA). Support a high-contrast mode toggle.

### Tech Stack (strict)
- React 18 + Vite + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Zustand
- React Router v6
- MediaPipe Tasks Vision (Hand Landmarker) – fully client-side
- Web Speech API
- Native WebRTC (or lightweight PeerJS) for video + data channel
- Optional: @google/generative-ai (Gemini fallback only)

### Supported Signs (configurable in constants.ts)
Hello, Thank You, Yes, No, Help, Good, Sorry, Please

### Page Structure & User Flows

1. **Landing (`/`)**  
   Full logo + tagline “Talk with signs. Understand with text.”  
   Problem → Solution  
   Feature cards  
   How it works  
   Primary CTA → “Start a Call”  
   Secondary CTA → “Try Practice Mode”  
   Footer links

2. **Create / Join Room (`/room`)**  
   Two large cards (Create + Join)  
   Guest mode + light auth placeholders (email/password + Google ready for future)  
   On success → `/call/:roomId`

3. **Video Call Room (`/call/:roomId`)** — Core experience  
   - Top bar: logo, connection status, room ID, Leave  
   - Side-by-side Local Video | Remote Video  
   - Dialogue-style text panels (see below)  
   - Controls: Mute, Camera, Speech toggle, Practice  
   Handle all states: connecting, connected, no-hand, low-confidence, speech unsupported, etc.

4. **Practice Mode (`/practice`)** — full separate page  
   Target sign selector  
   Live camera using the exact same recognition pipeline  
   Real-time Correct / Try again + confidence  
   Session score  
   “Save Progress” stub for future backend

5. **Extra pages**  
   - `/leaderboard` (stub with local data + “Coming soon with backend”)  
   - `/settings` (theme, high-contrast toggle, camera/mic permissions)  
   - `/about`, `/privacy`, `/accessibility`

### Dialogue-Style Text Display (critical)
All recognized signs and speech transcripts must appear as named dialogues, not plain text bubbles.

Example format inside the text panels:

**You**  
hi, how are you?

**Alex**  
hi, im fine.

**You**  
thankyou

**Alex**  
i miss you

**You**  
byee

- Show participant names (or “You” / “Partner”)  
- Support optional translation toggle (English ↔ simple gloss)  
- Timestamps on hover  
- Clear visual distinction between local and remote messages  
- Smooth auto-scroll

### Recognition Pipeline (implement exactly)
Webcam → MediaPipe Hand Landmarker (15–20 FPS) → 21 landmarks → Local Classifier → Confidence ≥ 0.65 → Temporal smoothing (majority vote over 5–8 frames) → Emit to local dialogue panel + send over data channel.

Optional Gemini only when confidence < 0.65 AND throttle (≥ 1.5 s) AND no cache hit. Never required.

### Data Channel Message Format
```ts
type DataMessage = {
  type: "sign" | "speech" | "control";
  text: string;
  confidence?: number;
  isFinal?: boolean;
  timestamp: number;
  senderName?: string;
};
```

### Critical Hooks
- `useMediaPipe.ts`
- `useLocalClassifier.ts`
- `useSpeechRecognition.ts` (with feature detection)
- `useWebRTC.ts`

### Privacy & Error Handling (non-negotiable)
- Raw video frames and landmarks never leave the browser on the primary path
- Only recognized text crosses the data channel
- Camera/mic denied → clear full-screen message + retry
- No hand detected → “Show a supported sign”
- Low confidence → keep last stable prediction or show “…”
- Speech unsupported → disable controls + “Chrome recommended” banner
- Gemini or future backend down → core features continue working

### Folder Structure
```
src/
  components/
    VideoCall/
    DialoguePanel/
    Practice/
  hooks/
    useMediaPipe.ts
    useLocalClassifier.ts
    useSpeechRecognition.ts
    useWebRTC.ts
  lib/
    classifier/
    gemini/
    constants.ts
  pages/
  stores/
  App.tsx
  main.tsx
```

### Output Requirements
Generate a complete, immediately runnable Vite + React + TypeScript project that includes:
- All pages and routes listed above
- Working MediaPipe + local classifier + temporal smoothing
- Working WebRTC video + typed data channel
- Working speech recognition with graceful fallback
- Dialogue-style text panels with names
- Practice mode as a separate page
- Logo and exact color system integrated
- Light auth placeholders
- Leaderboard and Settings stubs
- Full loading, empty, and error states
- .env.example
- Clean README with two-browser demo instructions

### Explicit Restrictions
- Do NOT implement continuous signing or full ISL translation
- Do NOT send raw video or landmarks to any server by default
- Do NOT make Gemini or backend required
- Do NOT add multi-party video or unrelated features
- Keep the architecture clean so Express + MongoDB (rooms, progress, badges, leaderboard) can be plugged in later without rewriting the core loop

Start by scaffolding the full project, integrating the exact logo and color system, then implement the critical hooks and the Video Call Room with dialogue-style panels first. Code must be clean, fully typed, modular, accessible, and runnable with `npm install && npm run dev`.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8afee27-d310-42e9-8802-4d8490551566).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
