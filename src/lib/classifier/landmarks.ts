/**
 * Pure geometry helpers over the 21 MediaPipe hand landmarks.
 * Everything here runs in the browser and never leaves it.
 */

export type Landmark = { x: number; y: number; z: number };

const ORIGIN: Landmark = { x: 0, y: 0, z: 0 };

export const LANDMARK_COUNT = 21;

const TIPS = [4, 8, 12, 16, 20] as const;
const PIPS = [2, 6, 10, 14, 18] as const;

export type HandFeatures = {
  /** 0..1 extension confidence per finger: thumb, index, middle, ring, pinky. */
  extension: [number, number, number, number, number];
  /** 0..1 — how far apart the extended fingertips are. */
  spread: number;
  /** Thumb tip to index tip distance, normalised by hand size. */
  thumbIndexGap: number;
  /** Index tip to middle tip distance, normalised by hand size. */
  indexMiddleGap: number;
};

export function at(landmarks: readonly Landmark[], index: number): Landmark {
  return landmarks[index] ?? ORIGIN;
}

export function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Distance from wrist to middle-finger knuckle — a stable scale reference. */
export function handSize(landmarks: readonly Landmark[]): number {
  return Math.max(distance(at(landmarks, 0), at(landmarks, 9)), 1e-4);
}

export function extractFeatures(landmarks: readonly Landmark[]): HandFeatures | null {
  if (landmarks.length < LANDMARK_COUNT) return null;

  const wrist = at(landmarks, 0);
  const size = handSize(landmarks);

  const extension = TIPS.map((tip, i) => {
    const pip = at(landmarks, PIPS[i] ?? 0);
    const tipDist = distance(at(landmarks, tip), wrist);
    const pipDist = distance(pip, wrist);
    const delta = (tipDist - pipDist) / size;
    // Thumb sits sideways, so it needs a lower bar than the other fingers.
    const bias = i === 0 ? 0.12 : 0.02;
    return clamp01((delta + bias) / 0.45);
  }) as [number, number, number, number, number];

  const tipPoints = TIPS.map((tip) => at(landmarks, tip));
  let gapSum = 0;
  for (let i = 1; i < tipPoints.length - 1; i += 1) {
    gapSum += distance(tipPoints[i] ?? ORIGIN, tipPoints[i + 1] ?? ORIGIN) / size;
  }
  const spread = clamp01((gapSum / 3 - 0.15) / 0.4);

  return {
    extension,
    spread,
    thumbIndexGap: distance(tipPoints[0] ?? ORIGIN, tipPoints[1] ?? ORIGIN) / size,
    indexMiddleGap: distance(tipPoints[1] ?? ORIGIN, tipPoints[2] ?? ORIGIN) / size,
  };
}

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [0, 9], [9, 10], [10, 11], [11, 12], // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17], // palm
];

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly Landmark[],
  options: { color?: string; connectionColor?: string; radius?: number; lineWidth?: number } = {}
) {
  if (!landmarks || landmarks.length === 0) return;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const {
    color = "#1a73e8",
    connectionColor = "rgba(26, 115, 232, 0.5)",
    radius = 3,
    lineWidth = 2,
  } = options;

  // Draw joint connections
  ctx.strokeStyle = connectionColor;
  ctx.lineWidth = lineWidth;
  for (const [start, end] of HAND_CONNECTIONS) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
  }

  // Draw landmark points
  ctx.fillStyle = color;
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}
