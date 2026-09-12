# Ishara – Implementation Plan

## 1. Goal

Implement the core MVP of Ishara as a working 24-hour hackathon prototype.

The MVP must provide:

- 1:1 video calling
- Side-by-side local and remote text panels
- Recognition of 5–8 isolated static hand signs
- Speech-to-text using the Web Speech API
- A practice module that reuses the same recognition pipeline
- Optional throttled Gemini fallback
- Basic progress, badges, and leaderboard functionality through an optional backend

The implementation must remain within the approved client-first architecture and must prioritize a reliable working demo over feature expansion.

---

# 2. Inputs

The implementation is based on the following inputs:

### Architecture

`architecture.md`

The architecture defines:

- Client-side MediaPipe processing
- Local landmark classifier as the primary recognition mechanism
- WebRTC-based communication
- Web Speech API for speech recognition
- Gemini as an optional fallback
- Optional Express backend
- Optional MongoDB persistence

### Project Context

The implementation must respect:

- Limited sign vocabulary
- Isolated static signs only
- 1:1 communication
- Graceful degradation
- 24-hour hackathon constraints

### Technology Sources

Potential implementation references include:

- MediaPipe Hand Landmarker examples
- TensorFlow.js landmark classification examples
- Browser Web Speech API
- WebRTC / Stream / PeerJS documentation

### Infrastructure Constraints

The implementation should remain compatible with free or low-cost services where possible:

- Gemini free tier
- Stream / PeerJS
- Vercel
- MongoDB Atlas

---

# 3. Current Context

| Item               | Status                                                       |
| ------------------ | ------------------------------------------------------------ |
| Current Milestone  | MVP Core                                                     |
| Sprint Window      | Hours 0–18 of 24                                             |
| Current Task       | Scaffold + Video Call + Gesture Pipeline + Speech + Practice |
| Project State      | Greenfield                                                   |
| Completed Work     | None                                                         |
| Primary Components | All core client components                                   |

The remaining hours are reserved for optional backend functionality, polish, testing, deployment, and demo preparation.

---

# 4. Requirements

## 4.1 Functional Requirements

The implementation must support:

1. Two browsers joining the same room.
2. Participants seeing each other's video.
3. Holding a supported static sign producing recognized text.
4. Recognized sign text appearing in the remote participant's text panel.
5. Speaking producing a speech transcript.
6. Speech transcript appearing in the remote participant's text panel.
7. Practice mode accepting a target sign.
8. Practice mode scoring the local classifier result.
9. Optional badge and progress updates.
10. Optional leaderboard updates.
11. Continued operation when Gemini is unavailable.

---

## 4.2 Technical Requirements

The implementation must satisfy the following:

- MediaPipe Hand Landmarker runs entirely inside the browser.
- The local classifier operates on the extracted 21 hand landmarks.
- The local classifier is the primary recognition mechanism.
- Gemini is used only when local confidence is low and the throttle permits a request.
- Recognized text travels through the WebRTC data channel or selected equivalent messaging mechanism.
- Raw video frames do not leave the client on the primary recognition path.
- Practice mode reuses the same classifier used by the communication mode.
- Optional backend functionality remains outside the core media and recognition path.

---

# 5. Constraints

The following constraints are mandatory.

### Scope

- No continuous signing.
- No full ISL sentence translation.
- Vocabulary limited to 8 validated static signs or fewer.
- No major architecture changes.
- No unnecessary heavy dependencies.

### Infrastructure

- The application should remain deployable on Vercel free tier.
- Gemini must remain optional.
- The backend must remain optional.
- The core communication experience must not depend on Gemini or database availability.

### Reliability

The system must continue operating when optional services fail.

---

# 6. Implementation Strategy

The implementation follows this order:

```text
Scaffold
   ↓
Video Communication
   ↓
WebRTC Data Channel
   ↓
MediaPipe
   ↓
Landmark Extraction
   ↓
Local Classifier
   ↓
Text Panels
   ↓
Speech Recognition
   ↓
Practice Mode
   ↓
Gemini Fallback
   ↓
Optional Backend
   ↓
Polish
   ↓
Testing
   ↓
Deployment
```

The order prioritizes the core demo path first.

---

# 7. Phase 1 – Project Scaffold

## Objective

Create the initial React application and establish the basic application structure.

## Tasks

1. Initialize the React + Vite project.
2. Configure the package manager.
3. Create the basic application entry point.
4. Add routing where required.
5. Create the initial room page.
6. Establish the component and hook directory structure.
7. Add `.env.example`.
8. Confirm the application runs locally.

## Deliverable

A working React application with:

```text
Home / Landing
      ↓
Room
      ↓
Video Call Interface
```

No recognition functionality is required at this stage.

---

# 8. Phase 2 – Video Communication Foundation

## Objective

Establish reliable 1:1 video communication between two browsers.

## Tasks

1. Request camera and microphone permissions.
2. Initialize the selected video communication technology.
3. Create or join a room.
4. Display the local video.
5. Display the remote video.
6. Establish peer connectivity.
7. Establish the text/data communication mechanism.
8. Add basic connection state handling.

The preferred implementation may use Stream Video SDK for speed or PeerJS/WebRTC where appropriate.

## Deliverable

Two browsers can:

```text
Browser A
    ↕
1:1 Video Connection
    ↕
Browser B
```

Both participants can see each other's video.

---

# 9. Phase 3 – MediaPipe Hand Pipeline

## Objective

Run hand landmark detection completely inside the browser.

## Tasks

1. Load MediaPipe Hand Landmarker.
2. Request webcam access.
3. Process webcam frames.
4. Detect the hand.
5. Extract the 21 landmarks.
6. Display a landmark overlay for debugging.
7. Process frames at approximately 15–20 FPS.
8. Expose landmark data to the classifier.

## Expected Flow

```text
Webcam
   ↓
Video Frame
   ↓
MediaPipe Hand Landmarker
   ↓
21 Hand Landmarks
   ↓
Classifier Input
```

## Deliverable

A visible hand in front of the camera produces a stable landmark representation.

---

# 10. Phase 4 – Local Sign Classifier

## Objective

Convert hand landmarks into one of the supported static signs.

## Initial Approach

Start with a simple rule-based or distance-based classifier.

The classifier should:

1. Receive the 21 landmarks.
2. Normalize the landmark coordinates where required.
3. Compare the input against the supported sign patterns.
4. Produce a predicted sign.
5. Produce a confidence score.
6. Reject uncertain predictions.

## Example

```text
Landmarks
    ↓
Normalization
    ↓
Feature Vector
    ↓
Distance / Rule Comparison
    ↓
Predicted Sign
    ↓
Confidence Score
```

## Confidence Threshold

The initial low-confidence threshold is:

```text
confidence < 0.65
```

Predictions above the configured threshold can be emitted directly.

Low-confidence predictions may enter the optional Gemini fallback path.

## Temporal Smoothing

To reduce landmark jitter:

- Maintain a short prediction history.
- Use a majority vote over approximately 5–8 frames.
- Emit only a stable prediction.

## Deliverable

Holding one of the supported signs in front of the camera produces stable local text.

---

# 11. Phase 5 – Text Panels

## Objective

Display recognized information locally and remotely.

## Tasks

1. Create the local text panel.
2. Display local sign predictions immediately.
3. Create the remote text panel.
4. Serialize recognized sign messages as JSON.
5. Send them through the WebRTC data channel.
6. Deserialize incoming messages.
7. Display remote recognized text.

## Sign Message

```json
{
  "type": "sign",
  "text": "Hello",
  "confidence": 0.87,
  "timestamp": 1726000000000
}
```

## Expected Flow

```text
Local Classifier
      ↓
Recognized Sign
      ↓
Local Text Panel
      ↓
WebRTC Data Channel
      ↓
Remote Text Panel
```

## Deliverable

A participant holding a supported sign causes the corresponding text to appear on the other participant's screen.

---

# 12. Phase 6 – Speech Recognition

## Objective

Add browser-based speech-to-text.

## Tasks

1. Detect Web Speech API availability.
2. Request microphone access.
3. Initialize speech recognition.
4. Capture interim transcripts.
5. Capture final transcripts.
6. Display the local transcript.
7. Send transcript messages through the data channel.
8. Display the remote transcript.
9. Handle unsupported browsers.

## Speech Message

```json
{
  "type": "speech",
  "text": "How are you?",
  "isFinal": true,
  "timestamp": 1726000000000
}
```

## Expected Flow

```text
Microphone
    ↓
Web Speech API
    ↓
Transcript
    ↓
Local Text Panel
    ↓
WebRTC Data Channel
    ↓
Remote Text Panel
```

## Browser Handling

If the browser does not support the Web Speech API:

```text
Speech Recognition
        ↓
Unsupported
        ↓
Disable Speech UI
        ↓
Display Clear Explanation
```

The remaining Ishara functionality must continue operating.

---

# 13. Phase 7 – Practice Module

## Objective

Create a learning mode using the same recognition pipeline as communication mode.

## Tasks

1. Display a target sign.
2. Start the webcam recognition pipeline.
3. Detect the participant's hand.
4. Classify the sign.
5. Compare the prediction with the target.
6. Calculate a score.
7. Display success or retry feedback.
8. Track practice progress locally.
9. Optionally send the result to the backend.

## Expected Flow

```text
Target Sign
     ↓
User Performs Sign
     ↓
MediaPipe
     ↓
Local Classifier
     ↓
Prediction
     ↓
Compare With Target
     ↓
Score
     ↓
Success / Retry
```

## Important Constraint

Practice mode must not create a separate recognition implementation.

It must reuse the same:

```text
MediaPipe
    ↓
Landmarks
    ↓
Classifier
```

pipeline used by the communication feature.

---

# 14. Phase 8 – Gemini Fallback

## Objective

Add Gemini only as an optional refinement mechanism for uncertain local predictions.

## Invocation Conditions

Gemini may be called only when:

```text
Local Confidence < 0.65
        AND
Throttle Window Available
        AND
No Cached Result
```

The initial throttle target is:

```text
At least 1.5 seconds between Gemini calls
```

## Cache

Rounded landmark information can be used to create a short-term cache key.

```text
Landmarks
    ↓
Rounding / Normalization
    ↓
Cache Key
    ↓
Cache Lookup
```

If a suitable cached result exists, no new Gemini request should be made.

## Failure Handling

If Gemini:

- Times out
- Returns an error
- Returns HTTP 429
- Is unavailable
- Exceeds the throttle

the application must fall back to the local classifier.

## Expected Architecture

```text
                Local Classifier
                       ↓
                Confidence Check
                       ↓
             ┌─────────┴─────────┐
             │                   │
        High Confidence      Low Confidence
             │                   │
             ↓                   ↓
       Local Result        Throttle Check
                                 ↓
                           Optional Gemini
                                 ↓
                              Result
```

Gemini must never become a required dependency.

---

# 15. Phase 9 – Optional Backend

## Objective

Add persistence for progress, badges, rooms, and leaderboard functionality.

This phase should only be implemented after the core communication experience is stable.

## Backend Responsibilities

- Room management
- Progress storage
- Badge storage
- Leaderboard data

## Suggested Endpoints

| Method | Endpoint            | Purpose              |
| ------ | ------------------- | -------------------- |
| POST   | `/rooms`            | Create room          |
| POST   | `/rooms/:id/join`   | Join room            |
| GET    | `/progress/:userId` | Fetch progress       |
| POST   | `/progress`         | Save practice result |
| GET    | `/leaderboard`      | Fetch ranked results |

## Backend Boundary

The backend must not process:

- Webcam frames
- Video
- Audio
- Hand landmarks

## Expected Flow

```text
Practice Result
      ↓
POST /progress
      ↓
Express
      ↓
MongoDB
```

If the backend is unavailable, the core video, sign recognition, and speech functionality must continue working.

---

# 16. Phase 10 – UI and Accessibility Polish

## Objective

Make the application suitable for a live hackathon demonstration.

## Tasks

### UI

- Clear video layout
- Clear local and remote text panels
- Recognition status
- Confidence indication
- Connection status
- Practice feedback
- Error states
- Loading states

### Accessibility

- High-contrast interface
- Clear labels
- Keyboard-friendly controls where practical
- Screen-reader labels where practical
- Avoid relying only on color to communicate state

### User Guidance

Include:

```text
Chrome recommended for best speech recognition support.
```

Provide clear instructions for:

- Camera permissions
- Microphone permissions
- Hand positioning
- Supported signs
- Practice mode

---

# 17. Error and Edge Case Handling

The implementation must explicitly handle the following cases.

## Camera or Microphone Permission Denied

Display:

```text
Camera or microphone permission is required.
Please allow access and try again.
```

Provide a retry action.

---

## No Hand Detected

Display:

```text
Show a supported sign
```

The application should not continuously emit invalid predictions.

---

## Low Confidence

Possible behavior:

```text
Low confidence
      ↓
Keep last stable prediction
OR
Display "..."
```

The exact UI behavior may depend on the final classifier implementation.

---

## Gemini Failure

Gemini Error
↓
Ignore Fallback Failure
↓
Continue With Local Classifier

The user should not lose the core recognition functionality.

---

## Data Channel Not Ready

If the data channel is not open:

Recognized Text
↓
Data Channel Unavailable
↓
Queue Message / Show Connecting State

The implementation should prevent crashes caused by attempting to send through an unavailable channel.

---

## Web Speech API Unsupported

Feature Detection
↓
Unsupported
↓
Disable Speech Controls
↓
Show Explanation

Other Ishara functionality continues normally.

# 18. File Structure

## Core Files

src/
├── hooks/
│ ├── useMediaPipe.js
│ ├── useLocalClassifier.js
│ ├── useSpeechRecognition.js
│ └── useWebRTC.js
│
├── lib/
│ ├── classifier/
│ │ └── index.js
│ │
│ ├── gemini/
│ │ ├── client.js
│ │ ├── throttle.js
│ │ └── cache.js
│ │
│ └── constants.js
│
├── components/
│ ├── VideoCall/
│ │ ├── VideoCall.jsx
│ │ ├── LocalVideo.jsx
│ │ ├── RemoteVideo.jsx
│ │ └── TextPanel.jsx
│ │
│ └── Practice/
│ ├── Practice.jsx
│ └── SignTarget.jsx

## Application Files

src/
├── App.jsx
└── main.jsx

## Optional Backend

server/
├── routes/
├── models/
└── index.js

# 19. Files to Create or Modify

| File / Folder                       | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `src/hooks/useMediaPipe.js`         | Initialize MediaPipe and process frames |
| `src/hooks/useLocalClassifier.js`   | Connect classifier logic to React       |
| `src/hooks/useSpeechRecognition.js` | Web Speech API wrapper                  |
| `src/hooks/useWebRTC.js`            | Video and data-channel communication    |
| `src/lib/classifier/index.js`       | Landmark-to-sign mapping and confidence |
| `src/lib/gemini/client.js`          | Gemini communication                    |
| `src/lib/gemini/throttle.js`        | Gemini rate limiting                    |
| `src/lib/gemini/cache.js`           | Short-term result caching               |
| `src/lib/constants.js`              | Supported sign vocabulary               |
| `src/components/VideoCall/`         | Main communication interface            |
| `src/components/Practice/`          | Practice interface                      |
| `src/App.jsx`                       | Routing and application structure       |
| `package.json`                      | Project dependencies                    |
| `.env.example`                      | Environment configuration               |
| `server/`                           | Optional persistence and leaderboard    |

---

# 20. Suggested Commit Strategy

Use small feature-based commits.

```text
feat: scaffold React + Vite app with basic room routing

feat: add MediaPipe Hand Landmarker and landmark overlay

feat: implement local landmark classifier for 6 static signs

feat: integrate WebRTC video call and data channel text exchange

feat: add Web Speech API and remote transcript display

feat: add optional throttled Gemini fallback with cache

feat: build practice module reusing classifier and basic scoring

feat: add optional Express + MongoDB progress and leaderboard
```

Each commit should represent a reasonably isolated feature that can be tested independently.

---

# 21. Implementation Risks

## Landmark Jitter

### Problem

Small changes in hand position can produce unstable predictions.

### Mitigation

Use:

- Landmark normalization
- Temporal smoothing
- Majority voting
- Confidence thresholds

---

## Gemini Rate Limits

### Problem

Frequent API calls can exhaust the available quota.

### Mitigation

Use:

- Local classifier as primary
- Confidence gating
- Minimum 1.5-second interval
- Short-term caching

---

## WebRTC Connectivity

### Problem

Some network configurations may prevent direct peer connectivity.

### Mitigation

Prepare TURN credentials if required.

The core implementation should keep the signaling and media layer isolated so connectivity issues can be diagnosed independently.

---

## Classifier Tuning

### Problem

Classifier tuning can consume excessive hackathon time.

### Mitigation

Freeze the vocabulary early.

Prioritize:

```text
6 reliable signs
```

over:

```text
8 unreliable signs
```

If required, reduce the supported vocabulary rather than compromising the complete application.

---

# 22. Alternative Approaches

## Full Continuous Recognition

**Rejected.**

Continuous signing requires significantly more:

- Training data
- Temporal modeling
- Model development
- Testing
- Validation

It is outside the 24-hour MVP scope.

---

## Server-side MediaPipe / TensorFlow Processing

**Rejected.**

Reasons:

- Increased latency
- Infrastructure requirements
- Higher cost
- Privacy concerns

---

## Always-on Gemini Recognition

**Rejected.**

Reasons:

- Rate limits
- External dependency
- Latency
- Cost
- Reduced demo reliability

Gemini remains a fallback rather than the primary recognition mechanism.

---

# 23. 24-Hour Implementation Schedule

The implementation should follow the following schedule.

| Time    | Focus                                     | Deliverable                                       |
| ------- | ----------------------------------------- | ------------------------------------------------- |
| 0–3 h   | Scaffold + Video Call + Data Channel      | Two browsers can see each other and exchange text |
| 3–8 h   | MediaPipe + Landmark Overlay + Classifier | Holding a supported sign produces local text      |
| 8–11 h  | Data-channel text exchange + UI panels    | Remote participant sees recognized signs          |
| 11–13 h | Web Speech API                            | Speech produces remote transcript                 |
| 13–16 h | Practice module + scoring                 | Working practice flow                             |
| 16–18 h | Gemini throttle + cache                   | Optional AI fallback                              |
| 18–20 h | Optional backend + leaderboard            | Progress persistence                              |
| 20–22 h | Polish + accessibility + error states     | Demo-ready interface                              |
| 22–24 h | End-to-end testing + deployment + README  | Live demo and pitch materials                     |

---

# 24. MVP Priority Rules

If the project falls behind schedule, implementation priority must be:

Priority 1
1:1 Video Call
↓
Priority 2
WebRTC Data Channel
↓
Priority 3
MediaPipe
↓
Priority 4
Local Sign Classifier
↓
Priority 5
Remote Text
↓
Priority 6
Speech-to-Text
↓
Priority 7
Practice Mode
↓
Priority 8
Gemini Fallback
↓
Priority 9
Backend / Leaderboard
↓
Priority 10
Polish

The optional backend should be dropped before compromising the core communication experience.

Gemini should also be dropped before compromising the local recognition pipeline.

# 25. Definition of Done

The core MVP is considered implemented when:

- Two browsers can establish a 1:1 video call.
- Both participants can see the remote video.
- The data channel can transmit JSON messages.
- MediaPipe detects hand landmarks locally.
- The local classifier recognizes the supported vocabulary.
- Stable predictions are generated with confidence values.
- Sign text appears locally.
- Sign text reaches the remote participant.
- Speech recognition produces transcripts where supported.
- Speech transcripts reach the remote participant.
- Practice mode uses the same classifier.
- Practice results can be scored.
- Gemini can be disabled without breaking the application.
- Backend functionality can be disabled without breaking the core application.
- Camera and microphone permission errors are handled.
- No-hand and low-confidence states are handled.
- The application can be demonstrated under controlled conditions.

# 26. Final Implementation Principle

The implementation must preserve the central architectural rule:
CORE
│
┌──────────┴──────────┐
│ │
Client-side Peer-to-peer
Recognition Communication
│ │
└──────────┬──────────┘
│
Working MVP
│
┌──────────┴──────────┐
│ │
Gemini Backend
Optional Optional

The primary system must remain functional without Gemini, without the backend, and without server-side recognition.

The implementation is therefore optimized for **reliability, simplicity, privacy, and demonstrability within a 24-hour hackathon**.
