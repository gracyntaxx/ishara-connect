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
    name: "Hand 1",
    jointColor: "#00f0ff", // Vibrant Cyan
    glowColor: "rgba(0, 240, 255, 0.5)",
    connectionColor: "rgba(14, 165, 233, 0.85)",
    badgeBg: "rgba(8, 20, 35, 0.88)",
    badgeBorder: "rgba(0, 240, 255, 0.6)",
    textColor: "#e0f2fe",
  },
  {
    name: "Hand 2",
    jointColor: "#c084fc", // Neon Purple
    glowColor: "rgba(192, 132, 252, 0.5)",
    connectionColor: "rgba(168, 85, 247, 0.85)",
    badgeBg: "rgba(30, 10, 45, 0.88)",
    badgeBorder: "rgba(192, 132, 252, 0.6)",
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
  const { radius = 3.5, lineWidth = 2.2, showCoordinates = true } = options;

  multiLandmarks.forEach((landmarks, handIdx) => {
    if (!landmarks || landmarks.length < LANDMARK_COUNT) return;

    const palette = (HAND_PALETTES[handIdx % HAND_PALETTES.length] ?? HAND_PALETTES[0])!;

    // 1. Draw glowing joint connections (bones)
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

    // 2. Draw 21 landmark nodes with outer glowing halos
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p) continue;
      const px = p.x * width;
      const py = p.y * height;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.8, 0, 2 * Math.PI);
      ctx.fillStyle = palette.glowColor;
      ctx.fill();

      // Inner solid node
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, 2 * Math.PI);
      ctx.fillStyle = palette.jointColor;
      ctx.fill();
    }

    // 3. Render Real-Time Coordinates Badges (Wrist + Index Tip)
    if (showCoordinates) {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];

      // Wrist coordinate telemetry pill
      if (wrist) {
        const wx = Math.min(Math.max(wrist.x * width, 10), width - 110);
        const wy = Math.min(Math.max(wrist.y * height + 16, 20), height - 12);

        const xCoord = wrist.x.toFixed(2);
        const yCoord = wrist.y.toFixed(2);
        const zCoord = (wrist.z ?? 0).toFixed(2);
        const text = `${palette.name} [X:${xCoord} Y:${yCoord} Z:${zCoord}]`;

        ctx.font = "bold 9px monospace";
        const metrics = ctx.measureText(text);
        const pillWidth = metrics.width + 12;
        const pillHeight = 16;

        ctx.fillStyle = palette.badgeBg;
        ctx.strokeStyle = palette.badgeBorder;
        ctx.lineWidth = 1;

        // Rounded pill
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(wx - 4, wy - 11, pillWidth, pillHeight, 4);
        } else {
          ctx.rect(wx - 4, wy - 11, pillWidth, pillHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = palette.textColor;
        ctx.fillText(text, wx + 2, wy + 1);
      }

      // Index tip coordinate pill
      if (indexTip) {
        const ix = Math.min(Math.max(indexTip.x * width, 10), width - 80);
        const iy = Math.min(Math.max(indexTip.y * height - 12, 14), height - 10);
        const tipText = `Tip: (${indexTip.x.toFixed(2)}, ${indexTip.y.toFixed(2)})`;

        ctx.font = "8px monospace";
        const tipMetrics = ctx.measureText(tipText);
        const pillWidth = tipMetrics.width + 8;
        const pillHeight = 13;

        ctx.fillStyle = palette.badgeBg;
        ctx.strokeStyle = palette.badgeBorder;
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(ix - 3, iy - 9, pillWidth, pillHeight, 3);
        } else {
          ctx.rect(ix - 3, iy - 9, pillWidth, pillHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = palette.jointColor;
        ctx.fillText(tipText, ix + 1, iy);
      }
    }
  });
}
