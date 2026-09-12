# Ishara Connect

> **Accessible sign language video calls powered by real-time AI recognition.**

Ishara Connect is a browser-based accessibility platform that enables **two-way communication between signing and non-signing users** through 1:1 video calling, real-time hand-sign recognition, speech-to-text, and interactive practice mode.

Built with **privacy-first architecture**: all AI processing happens locally in your browser. No video or audio leaves your device. No account required.

---

## ✨ Key Features

| Feature                     | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| 🎥 **1:1 Video Calls**      | Peer-to-peer WebRTC with manual connection codes (no server needed)               |
| 🤟 **Sign Recognition**     | 8 signs recognized locally at 18 FPS via MediaPipe + rule-based classifier        |
| 💬 **Live Dialogue Panel**  | Speaker-labeled transcript with sign/speech tags, confidence scores, gloss toggle |
| 🎙️ **Speech-to-Text**       | Web Speech API with interim + final transcripts                                   |
| 🎯 **Practice Mode**        | Interactive lessons with real-time feedback, streaks, accuracy tracking           |
| 🏆 **Progress Tracking**    | Local stats, best streaks, exportable progress data                               |
| 🤖 **Optional AI Fallback** | Gemini API for low-confidence cases (opt-in, disabled by default)                 |
| ♿ **Accessibility**        | High contrast, reduced motion, keyboard nav, screen reader support                |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Modern browser with webcam/microphone (Chrome/Edge/Safari/Firefox)
- HTTPS or localhost (required for camera/mic permissions)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ishara-connect

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the URL shown in terminal (typically `http://localhost:5173`).

---

## 🧪 Two-Browser Testing Guide

This is the **primary way to test** the video call functionality locally.

### Method 1: Two Browser Windows (Same Machine)

1. **Start the dev server:**

   ```bash
   npm run dev
   ```

2. **Open Browser A (Initiator):**
   - Go to `http://localhost:5173/room`
   - Enter your name (e.g., "Alice")
   - Click **"Create Room"**
   - Copy the **Connection Code** that appears
   - Click **"Start Call"**

3. **Open Browser B (Joiner):**
   - Open a **different browser** (e.g., Firefox if A is Chrome, or Incognito/Private window)
   - Go to `http://localhost:5173/room`
   - Enter your name (e.g., "Bob")
   - Click **"Join Room"** tab
   - Paste the **Connection Code** from Browser A
   - Click **"Join Room"**
   - Click **"Start Call"**

4. **Test the call:**
   - Both browsers should show each other's video
   - In Browser A: Make a sign (e.g., open palm for "Hello")
   - Browser B should see "Hello" appear in the dialogue panel
   - In Browser B: Speak into microphone
   - Browser A should see speech transcript appear

### Method 2: Two Devices on Same Network

1. **Find your machine's local IP:**

   ```bash
   # Windows
   ipconfig | findstr IPv4

   # macOS/Linux
   ifconfig | grep inet
   ```

2. **Start dev server with network access:**

   ```bash
   npm run dev -- --host
   ```

3. **On Device A:** Open `http://YOUR_LOCAL_IP:5173/room` and create a room
4. **On Device B:** Open `http://YOUR_LOCAL_IP:5173/room` and join with the code

> ⚠️ **Important:** Both devices must be on the same network. Firewall may need to allow port 5173.

### Method 3: Production Deploy + Two Devices

1. Deploy to Vercel/Netlify (or any static host)
2. Open the deployed URL on two different devices/networks
3. Follow the same Create/Join flow

---

## 📋 Supported Signs

| Sign          | Hint                                    | Gloss     |
| ------------- | --------------------------------------- | --------- |
| **Hello**     | Open palm facing camera, fingers spread | HELLO     |
| **Thank You** | Flat hand, fingers straight together    | THANK-YOU |
| **Yes**       | Closed fist, thumb against side         | YES       |
| **No**        | Index + middle finger straight together | NO        |
| **Help**      | Thumbs up                               | HELP      |
| **Good**      | Index + middle finger in wide V         | GOOD      |
| **Sorry**     | Thumb + pinky out, middle three curled  | SORRY     |
| **Please**    | Thumb + index tips touching (ring)      | PLEASE    |

---

## ⌨️ Keyboard Shortcuts

| Keys                | Action                          |
| ------------------- | ------------------------------- |
| `Tab` / `Shift+Tab` | Navigate forward/backward       |
| `Enter` / `Space`   | Activate buttons                |
| `Escape`            | Close modals/dropdowns          |
| `H`                 | Toggle high contrast (in call)  |
| `M`                 | Toggle microphone (in call)     |
| `V`                 | Toggle camera (in call)         |
| `D`                 | Toggle dialogue panel (in call) |

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Optional: Gemini API Key for AI fallback
# Get from https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=your_key_here

# Optional: Custom STUN servers
VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Optional: Debug logging
VITE_DEBUG=false
```

### Settings Panel

Access via `/settings` or the gear icon in-call to configure:

- Theme (Light/Dark/System)
- High Contrast Mode
- Reduced Motion
- Camera/Microphone/Speaker device selection
- Speech recognition language
- Recognition sensitivity (confidence threshold, cooldown, FPS)
- Gemini fallback toggle + API key

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Participant A)                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Camera  │→ │MediaPipe │→ │Landmarks   │→ │Classifier │  │
│  └─────────┘  └──────────┘  └────────────┘  └─────┬─────┘  │
│                                                    │         │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐       │         │
│  │ Micro-  │→ │Web Speech│→ │ Transcript │       │         │
│  │ phone   │  │   API    │  │            │       │         │
│  └─────────┘  └──────────┘  └────────────┘       │         │
│                                                   ▼         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              WebRTC Data Channel                      │  │
│  │  {type: "sign", text: "Hello", confidence: 0.92}     │  │
│  │  {type: "speech", text: "hi there", isFinal: true}   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Dialogue Panel (Local)                   │  │
│  │  You: HELLO (92%)     Bob: "hi there"                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    WebRTC P2P
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Participant B)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Dialogue Panel (Remote)                  │  │
│  │  Alice: HELLO (92%)     You: "hi there"              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Modules

| Module      | Path                                | Purpose                                 |
| ----------- | ----------------------------------- | --------------------------------------- |
| Constants   | `src/lib/constants.ts`              | Sign vocabulary, thresholds, config     |
| Landmarks   | `src/lib/classifier/landmarks.ts`   | 3D geometry feature extraction          |
| Rules       | `src/lib/classifier/rules.ts`       | Deterministic sign classification       |
| Smoothing   | `src/lib/classifier/smoothing.ts`   | Temporal majority-vote filter           |
| MediaPipe   | `src/hooks/useMediaPipe.ts`         | Hand landmark tracking loop             |
| Classifier  | `src/hooks/useLocalClassifier.ts`   | Pipeline: landmarks → rules → smoothing |
| MediaStream | `src/hooks/useMediaStream.ts`       | Camera/mic permissions & tracks         |
| Speech      | `src/hooks/useSpeechRecognition.ts` | Web Speech API wrapper                  |
| WebRTC      | `src/hooks/useWebRTC.ts`            | Peer connection + data channel          |
| Signaling   | `src/lib/signaling.ts`              | Base64 connection code codec            |

---

## 🎨 Customization

### Adding New Signs

1. Add to `SUPPORTED_SIGNS` in `src/lib/constants.ts`
2. Add hint to `SIGN_HINTS`
3. Add gloss to `SIGN_GLOSS`
4. Add classification rules in `src/lib/classifier/rules.ts`
5. Add visual hint card in `src/components/Practice.tsx`

### Theming

Colors defined in `src/styles.css` using CSS custom properties:

```css
:root {
  --primary: #3b82f6; /* Blue */
  --secondary: #0d9488; /* Teal */
  --success: #10b981; /* Emerald */
  --warning: #f59e0b; /* Amber */
  --destructive: #ef4444; /* Red */
}
```

High contrast mode applies `.high-contrast` class to `<html>`.

---

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Vercel

```bash
npx vercel
```

### Deploy to Netlify

```bash
npx netlify deploy --prod --dir=dist
```

> **Note:** For production, ensure HTTPS is enabled (required for camera/mic permissions).

---

## 🧰 Development Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

---

## 🐛 Troubleshooting

| Issue                     | Solution                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| Camera/mic not working    | Ensure HTTPS or localhost; check browser permissions                      |
| "Connection code invalid" | Code must be copied exactly; no extra spaces/lines                        |
| No remote video           | Check firewall/NAT; try different network; STUN may fail on symmetric NAT |
| Signs not recognized      | Ensure good lighting; hand clearly visible; try Practice mode first       |
| Speech not working        | Use Chrome/Edge; check microphone permission; try different language      |
| High CPU usage            | Lower `targetFps` in Settings (default 18)                                |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **MediaPipe** by Google for hand landmark detection
- **TanStack** for Router, Query, and Start
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for styling
- **Zustand** for state management

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint && npm run typecheck`
5. Submit a PR

---

## ⚠️ Disclaimer

Ishara Connect is a **prototype** demonstrating technical feasibility of accessible communication. It is **not a replacement for professional sign language interpreters**. Recognition accuracy varies with lighting, camera, signing style, and individual differences. The supported vocabulary is intentionally limited to 8 validated signs.
