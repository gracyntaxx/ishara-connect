/**
 * Ishara — central configuration.
 * Change the supported sign vocabulary, thresholds and model sources here.
 */

export const APP_NAME = "Ishara";
export const APP_TAGLINE = "Talk with signs. Understand with text.";

/** Signs the local classifier can recognise. Order drives the UI. */
export const SUPPORTED_SIGNS = [
  "Hello",
  "Thank You",
  "Sorry",
  "Bye",
  "Help",
  "Yes",
  "No",
  "Good",
  "Please",
  "I Love You",
  "Understand",
  "Peace",
  "Stop",
  "Friend",
  "How Are You",
  "Welcome",
] as const;

export type SignLabel = (typeof SUPPORTED_SIGNS)[number];

/** Short human hint shown in Practice mode so users know how to form the sign. */
export const SIGN_HINTS: Record<SignLabel, string> = {
  Hello: "Open palm facing the camera, fingers spread apart.",
  "Thank You": "Flat hand, all four fingers straight and held together.",
  Sorry: "Closed fist (A-hand) placed on chest.",
  Bye: "Open palm facing the camera, waving side to side.",
  Help: "Thumbs up — thumb out, all other fingers curled.",
  Good: "Thumbs up, or index and middle finger up in a V shape.",
  Yes: "Closed fist, thumb resting against the side.",
  No: "Index and middle finger straight and pressed together.",
  Please: "Thumb and index tips touching in a ring, other fingers up.",
  "I Love You": "Thumb, index finger, and pinky extended; middle and ring fingers curled.",
  Understand: "Index finger pointing straight up from a closed fist.",
  Peace: "Index and middle fingers extended in a wide V sign.",
  Stop: "Open flat hand facing outward toward camera, fingers held upright.",
  Friend: "Index and middle fingers crossed, or both index fingers hooking together.",
  "How Are You": "Both open hands held forward facing the camera.",
  Welcome: "Flat open hand sweeping inward toward your chest.",
};

/** Simple gloss used by the optional translation toggle in the dialogue panel. */
export const SIGN_GLOSS: Record<SignLabel, string> = {
  Hello: "HELLO",
  "Thank You": "THANK-YOU",
  Sorry: "SORRY",
  Bye: "BYE",
  Help: "HELP",
  Good: "GOOD",
  Yes: "YES",
  No: "NO",
  Please: "PLEASE",
  "I Love You": "I-LOVE-YOU",
  Understand: "UNDERSTAND",
  Peace: "PEACE",
  Stop: "STOP",
  Friend: "FRIEND",
  "How Are You": "HOW-ARE-YOU",
  Welcome: "WELCOME",
};

/** Minimum classifier confidence before a prediction is shown or sent. */
export const CONFIDENCE_THRESHOLD = 0.52;

/** Frames kept for majority-vote temporal smoothing (ensures stable, accurate pose). */
export const SMOOTHING_WINDOW = 9;

/** Votes required inside the window before a sign is considered stable. */
export const SMOOTHING_MIN_VOTES = 6;

/** Detection loop target frame rate (frames per second). */
export const TARGET_FPS = 18;

/** Minimum gap between two identical emitted signs. */
export const SIGN_EMIT_COOLDOWN_MS = 1400;

/** Optional Gemini fallback — never required for the core experience. */
export const GEMINI_THROTTLE_MS = 1500;
export const GEMINI_ENABLED_BY_DEFAULT = false;

/** MediaPipe Tasks Vision sources (loaded in the browser only). */
export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
export const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
