/**
 * OPTIONAL Gemini fallback.
 *
 * Disabled by default and never required. It only runs when the local
 * classifier is unsure (confidence < threshold), at most once every
 * GEMINI_THROTTLE_MS, and only when the feature vector is not already cached.
 *
 * Only derived numeric features are ever considered for upload — never raw
 * video frames. With no API key configured this resolves to null and the app
 * continues on the local path.
 */

import { GEMINI_THROTTLE_MS, type SignLabel } from "@/lib/constants";
import type { HandFeatures } from "@/lib/classifier/landmarks";

const cache = new Map<string, SignLabel | null>();
let lastCallAt = 0;

function cacheKey(features: HandFeatures): string {
  return [
    ...features.extension.map((v) => v.toFixed(1)),
    features.spread.toFixed(1),
    features.thumbIndexGap.toFixed(1),
  ].join("|");
}

export function isGeminiConfigured(): boolean {
  return Boolean(import.meta.env["VITE_GEMINI_API_KEY"]);
}

export async function maybeResolveWithGemini(
  features: HandFeatures,
  enabled: boolean,
): Promise<SignLabel | null> {
  if (!enabled || !isGeminiConfigured()) return null;

  const key = cacheKey(features);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const now = Date.now();
  if (now - lastCallAt < GEMINI_THROTTLE_MS) return null;
  lastCallAt = now;

  try {
    // Placeholder: wire @google/generative-ai here when a key is configured.
    // Kept as a no-op so a missing/failing service can never break the call.
    cache.set(key, null);
    return null;
  } catch {
    return null;
  }
}
