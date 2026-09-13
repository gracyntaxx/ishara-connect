/**
 * Gemini AI Sign Recognition Engine.
 *
 * Uses Google's Gemini Flash AI model to classify sign language gestures
 * when local heuristics need confirmation, during practice/learning tests,
 * or when the user requests AI analysis.
 */

import { GEMINI_THROTTLE_MS, SUPPORTED_SIGNS, type SignLabel } from "@/lib/constants";
import type { HandFeatures, Landmark } from "@/lib/classifier/landmarks";

const cache = new Map<string, { label: SignLabel; confidence: number } | null>();
let lastCallAt = 0;

export function getGeminiApiKey(customKey?: string | null): string | null {
  if (customKey && customKey.trim().length > 0) return customKey.trim();
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY.trim();
  }
  return null;
}

export function isGeminiConfigured(customKey?: string | null): boolean {
  return Boolean(getGeminiApiKey(customKey));
}

function cacheKey(features: HandFeatures, targetSign?: string): string {
  return [
    targetSign || "any",
    ...features.extension.map((v) => v.toFixed(2)),
    features.spread.toFixed(2),
    features.thumbIndexGap.toFixed(2),
    features.indexMiddleGap.toFixed(2),
  ].join("|");
}

export interface GeminiClassificationResult {
  label: SignLabel;
  confidence: number;
  explanation?: string;
  isTarget?: boolean;
}

/**
 * Classify a hand gesture using Google Gemini Flash API.
 */
export async function classifyWithGemini(options: {
  features?: HandFeatures | null;
  landmarks?: Landmark[] | Landmark[][] | null;
  imageDataUrl?: string | null;
  targetSign?: string | null;
  apiKey?: string | null;
}): Promise<GeminiClassificationResult | null> {
  const key = getGeminiApiKey(options.apiKey);
  if (!key) return null;

  const vocabularyList = SUPPORTED_SIGNS.join(", ");
  const targetNote = options.targetSign
    ? `The user is specifically attempting the sign: "${options.targetSign}". Evaluate if their gesture matches or comes close to "${options.targetSign}".`
    : "";

  let handDesc = "";
  if (options.features) {
    const f = options.features;
    const ext = f.extension.map((e, idx) => {
      const names = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
      return `${names[idx]}: ${(e * 100).toFixed(0)}% extended (${e > 0.6 ? "straight" : e < 0.35 ? "curled" : "partially bent"})`;
    }).join(", ");
    handDesc = `
Hand Landmark Geometric Analysis:
- Fingers: ${ext}
- Spread between fingers: ${(f.spread * 100).toFixed(0)}% (${f.spread > 0.45 ? "fanned wide open" : f.spread < 0.28 ? "held close together" : "moderate"})
- Thumb-to-Index Gap: ${(f.thumbIndexGap * 100).toFixed(0)}%
- Index-to-Middle Gap: ${(f.indexMiddleGap * 100).toFixed(0)}%
`;
  }

  const systemInstruction = `You are an expert American Sign Language (ASL) and hand gesture classifier for Ishara Connect.
Your task is to identify which sign from our supported vocabulary is being performed.

Supported vocabulary: ${vocabularyList}
Sign characteristics:
- Hello: Open hand with 5 fingers extended and spread wide, palm outward or waving from temple.
- Thank You: Flat B-hand (4 fingers straight up and held pressed together, thumb relaxed), touching chin/lips then moving forward.
- Sorry: Closed fist (A-hand, all fingers curled tightly) placed or rubbing chest.
- Bye: Open hand (all fingers extended) waving side to side.
- Help: Thumbs-up fist (A-hand with thumb extended) resting on top of a flat palm base, lifting together.
- Yes: Closed fist (S-hand) nodding.
- No: Index and middle fingers extended straight together, tapping thumb.
- Good: Flat hand moving from chin forward into palm, or thumbs up / V shape.
- Please: Open flat hand rubbing circular motion over chest.
- I Love You: Thumb, index finger, and pinky extended; middle and ring curled tightly (classic ASL ILY sign).
- Understand: Pointing index finger straight up from a fist (1-finger shape).
- Peace: Index and middle fingers extended in a wide V shape, others curled.
- Stop: Open flat hand held upright facing outward toward camera, fingers together.
- Friend: Index and middle fingers crossed, or two index fingers hooking together.
- How Are You: Both open hands or open flat hand held forward facing the camera.
- Welcome: Flat open hand sweeping inward toward chest.

${targetNote}
${handDesc}

You must return ONLY a JSON object in this format:
{
  "sign": "Hello", // One of: ${vocabularyList}
  "confidence": 0.95, // Float between 0.0 and 1.0
  "explanation": "Brief explanation of the recognized hand pose"
}`;

  const contentsParts: any[] = [];

  if (options.imageDataUrl && options.imageDataUrl.startsWith("data:image/")) {
    const base64Data = options.imageDataUrl.split(",")[1];
    const mimeMatch = options.imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    contentsParts.push({
      inlineData: {
        data: base64Data,
        mimeType,
      },
    });
  }

  contentsParts.push({
    text: `${systemInstruction}\nClassify this hand sign now. Respond with valid JSON only.`,
  });

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      // Extract JSON if model wrapped it
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleaned);
      const recognizedSign = parsed.sign as SignLabel;

      if (recognizedSign && (SUPPORTED_SIGNS as readonly string[]).includes(recognizedSign)) {
        const conf = typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.85;
        return {
          label: recognizedSign,
          confidence: conf,
          explanation: parsed.explanation || "",
          isTarget: options.targetSign ? recognizedSign.toLowerCase() === options.targetSign.toLowerCase() : undefined,
        };
      }
    } catch {
      // Continue to next model on failure
    }
  }

  return null;
}

/**
 * Optional throttle-wrapped Gemini fallback function for live classifier streams.
 */
export async function maybeResolveWithGemini(
  features: HandFeatures,
  enabled: boolean,
  options?: {
    apiKey?: string | null;
    targetSign?: string | null;
    imageDataUrl?: string | null;
  },
): Promise<{ label: SignLabel; confidence: number } | null> {
  if (!enabled || !isGeminiConfigured(options?.apiKey)) return null;

  const key = cacheKey(features, options?.targetSign || undefined);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const now = Date.now();
  if (now - lastCallAt < GEMINI_THROTTLE_MS) return null;
  lastCallAt = now;

  try {
    const result = await classifyWithGemini({
      features,
      targetSign: options?.targetSign,
      apiKey: options?.apiKey,
      imageDataUrl: options?.imageDataUrl,
    });

    if (result && result.confidence >= 0.6) {
      const output = { label: result.label, confidence: result.confidence };
      cache.set(key, output);
      return output;
    }

    cache.set(key, null);
    return null;
  } catch {
    return null;
  }
}
