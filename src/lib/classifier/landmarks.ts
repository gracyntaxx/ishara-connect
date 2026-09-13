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
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // index
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // middle
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // ring
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // pinky
  [5, 9],
  [9, 13],
  [13, 17], // palm
];

export const HAND_PALETTES = [
  {
    name: "H1",
    jointColor: "#22d3ee", // Slim Cyan
    glowColor: "rgba(34, 211, 238, 0.35)",
    connectionColor: "rgba(6, 182, 212, 0.75)",
    badgeBg: "rgba(15, 23, 42, 0.72)",
    badgeBorder: "rgba(34, 211, 238, 0.45)",
    textColor: "#cffafe",
  },
  {
    name: "H2",
    jointColor: "#c084fc", // Slim Purple
    glowColor: "rgba(192, 132, 252, 0.35)",
    connectionColor: "rgba(168, 85, 247, 0.75)",
    badgeBg: "rgba(24, 15, 40, 0.72)",
    badgeBorder: "rgba(192, 132, 252, 0.45)",
    textColor: "#f3e8ff",
  },
];

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly Landmark[],
  options: {
    color?: string;
    connectionColor?: string;
    radius?: number;
    lineWidth?: number;
    showCoordinates?: boolean;
    label?: string;
  } = {},
) {
  drawMultiHandLandmarks(ctx, [landmarks], {
    showCoordinates: options.showCoordinates ?? true,
    ...(options.radius !== undefined ? { radius: options.radius } : {}),
    ...(options.lineWidth !== undefined ? { lineWidth: options.lineWidth } : {}),
  });
}

export function drawMultiHandLandmarks(
  ctx: CanvasRenderingContext2D,
  multiLandmarks: readonly (readonly Landmark[])[],
  options: {
    radius?: number;
    lineWidth?: number;
    showCoordinates?: boolean;
    mirrorX?: boolean;
  } = {},
) {
  if (!multiLandmarks || multiLandmarks.length === 0) return;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  // Narrow, refined markers instead of clunky oversized lines
  const { radius = 2.2, lineWidth = 1.3, showCoordinates = true } = options;

  multiLandmarks.forEach((landmarks, handIdx) => {
    if (!landmarks || landmarks.length < LANDMARK_COUNT) return;

    const palette = (HAND_PALETTES[handIdx % HAND_PALETTES.length] ?? HAND_PALETTES[0])!;

    // 1. Draw slim, high-precision joint connections (bones)
    ctx.strokeStyle = palette.connectionColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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

    // 2. Draw refined micro landmark nodes with subtle aura
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p) continue;
      const px = p.x * width;
      const py = p.y * height;

      // Subtle outer glow halo
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.4, 0, 2 * Math.PI);
      ctx.fillStyle = palette.glowColor;
      ctx.fill();

      // Pinpoint inner joint node
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, 2 * Math.PI);
      ctx.fillStyle = palette.jointColor;
      ctx.fill();
    }

    // 3. Render Narrowed-Down Precision Coordinate Markers (Wrist & Index Tip)
    if (showCoordinates) {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];

      // Wrist: micro-crosshair and narrow telemetry tag
      if (wrist) {
        const wx = wrist.x * width;
        const wy = wrist.y * height;

        // Narrow micro-crosshair reticle
        ctx.strokeStyle = palette.jointColor;
        ctx.lineWidth = 0.75;
        const tick = 3.5;
        ctx.beginPath();
        ctx.moveTo(wx - tick, wy);
        ctx.lineTo(wx + tick, wy);
        ctx.moveTo(wx, wy - tick);
        ctx.lineTo(wx, wy + tick);
        ctx.stroke();

        // Ultra-narrow coordinate badge
        const badgeX = Math.min(Math.max(wx - 24, 4), width - 56);
        const badgeY = Math.min(Math.max(wy + 8, 12), height - 12);
        const coordText = `${palette.name} (${Math.round(wrist.x * 100)}, ${Math.round(wrist.y * 100)})`;

        ctx.font = "500 8px -apple-system, BlinkMacSystemFont, monospace";
        const metrics = ctx.measureText(coordText);
        const pillW = metrics.width + 6;
        const pillH = 11;

        ctx.fillStyle = palette.badgeBg;
        ctx.strokeStyle = palette.badgeBorder;
        ctx.lineWidth = 0.6;

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(badgeX, badgeY - 8, pillW, pillH, 3);
        } else {
          ctx.rect(badgeX, badgeY - 8, pillW, pillH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = palette.textColor;
        ctx.fillText(coordText, badgeX + 3, badgeY);
      }

      // Index tip: pinpoint reticle and compact mini tag
      if (indexTip) {
        const ix = indexTip.x * width;
        const iy = indexTip.y * height;

        // Precision tip ring
        ctx.strokeStyle = palette.jointColor;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(ix, iy, radius * 1.5, 0, 2 * Math.PI);
        ctx.stroke();

        const tipTagX = Math.min(Math.max(ix - 16, 4), width - 42);
        const tipTagY = Math.min(Math.max(iy - 6, 10), height - 8);
        const tipText = `${Math.round(indexTip.x * 100)}, ${Math.round(indexTip.y * 100)}`;

        ctx.font = "500 7.5px monospace";
        const tipMetrics = ctx.measureText(tipText);
        const tipW = tipMetrics.width + 5;
        const tipH = 10;

        ctx.fillStyle = palette.badgeBg;
        ctx.strokeStyle = palette.badgeBorder;
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(tipTagX, tipTagY - 7, tipW, tipH, 2.5);
        } else {
          ctx.rect(tipTagX, tipTagY - 7, tipW, tipH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = palette.textColor;
        ctx.fillText(tipText, tipTagX + 2.5, tipTagY);
      }
    }
  });
}
