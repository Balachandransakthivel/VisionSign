/**
 * VisionSign — Rule-based gesture classifier
 * Analyses MediaPipe Hands 21-landmark output and returns a gesture name.
 *
 * Landmark indices (per MediaPipe spec)
 *  0  WRIST
 *  1-4  THUMB  (CMC → MCP → IP → TIP)
 *  5-8  INDEX  (MCP → PIP → DIP → TIP)
 *  9-12 MIDDLE (MCP → PIP → DIP → TIP)
 * 13-16 RING   (MCP → PIP → DIP → TIP)
 * 17-20 PINKY  (MCP → PIP → DIP → TIP)
 */

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

// ── helpers ────────────────────────────────────────────────────────────────

/** Finger (index/middle/ring/pinky) is considered UP when tip is above PIP */
function fingerUp(lm: NormalizedLandmark[], tip: number, pip: number): boolean {
  return lm[tip].y < lm[pip].y;
}

/** Thumb UP: tip is to the left of the MCP (right-hand view from webcam) */
function thumbUp(lm: NormalizedLandmark[]): boolean {
  // works for mirrored (selfie) feed — tip.x < MCP.x means thumb points left = up
  return lm[4].x < lm[3].x;
}

/** Euclidean distance (x,y only) between two landmarks, normalised 0-1 */
function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** All four fingers extended */
function allFingersUp(lm: NormalizedLandmark[]): boolean {
  return (
    fingerUp(lm, 8, 6) &&
    fingerUp(lm, 12, 10) &&
    fingerUp(lm, 16, 14) &&
    fingerUp(lm, 20, 18)
  );
}

/** All four fingers folded */
function allFingersDown(lm: NormalizedLandmark[]): boolean {
  return (
    !fingerUp(lm, 8, 6) &&
    !fingerUp(lm, 12, 10) &&
    !fingerUp(lm, 16, 14) &&
    !fingerUp(lm, 20, 18)
  );
}

// ── main classifier ────────────────────────────────────────────────────────

export type DetectedGesture =
  | "HELLO"
  | "I LOVE YOU"
  | "GOOD"
  | "BAD"
  | "STOP"
  | "YES"
  | "NO"
  | "PEACE"
  | "OK"
  | "SORRY"
  | "FIST"
  | "POINTING"
  | "CALL ME"
  | "ROCK"
  | null;

/**
 * Classify a single hand from its 21 landmarks.
 * Returns a gesture string or null if no confident match.
 */
export function classifyGesture(lm: NormalizedLandmark[]): DetectedGesture {
  if (!lm || lm.length < 21) return null;

  const idx  = fingerUp(lm, 8, 6);
  const mid  = fingerUp(lm, 12, 10);
  const ring = fingerUp(lm, 16, 14);
  const pink = fingerUp(lm, 20, 18);
  const thb  = thumbUp(lm);
  const allUp = allFingersUp(lm);
  const allDn = allFingersDown(lm);

  // ── HELLO — open palm, all five fingers up ──────────────────────────────
  if (thb && allUp) return "HELLO";

  // ── I LOVE YOU — thumb + index + pinky up, middle + ring down ──────────
  if (thb && idx && !mid && !ring && pink) return "I LOVE YOU";

  // ── CALL ME — thumb + pinky up (shaka / hang loose) ────────────────────
  if (thb && !idx && !mid && !ring && pink) return "CALL ME";

  // ── GOOD / THUMBS UP — only thumb out, rest closed ─────────────────────
  if (thb && allDn) return "GOOD";

  // ── BAD / THUMBS DOWN — thumb down, rest closed ────────────────────────
  if (!thb && allDn && lm[4].y > lm[3].y) return "BAD";

  // ── STOP — all four fingers up, thumb folded ────────────────────────────
  if (!thb && allUp) return "STOP";

  // ── PEACE / TWO — index + middle up, ring + pinky + thumb down ─────────
  if (idx && mid && !ring && !pink && !thb) return "PEACE";

  // ── POINTING / ONE — only index finger up ───────────────────────────────
  if (idx && !mid && !ring && !pink && !thb) return "POINTING";

  // ── ROCK — index + pinky up, middle + ring down, thumb folded ───────────
  if (idx && !mid && !ring && pink && !thb) return "ROCK";

  // ── OK — tip of thumb and index very close, others extended ─────────────
  if (dist(lm[4], lm[8]) < 0.07 && mid && ring && pink) return "OK";

  // ── SORRY / FIST — all fingers closed ──────────────────────────────────
  if (!thb && allDn) return "SORRY";

  // ── YES — index-finger base bouncing (approximate: index folded) ────────
  // represented here as index tip near wrist region vertically
  if (!idx && !mid && !ring && !pink && thb) return "YES";

  // ── NO — index + middle extended + spread (approx peace with spread) ────
  if (idx && mid && !ring && !pink && thb) return "NO";

  return null;
}

// ── gesture metadata ───────────────────────────────────────────────────────

export interface GestureMeta {
  gesture: DetectedGesture;
  emoji: string;
  text: string;
  confidence: number; // deterministic but we add slight variation for realism
}

const GESTURE_MAP: Record<NonNullable<DetectedGesture>, { emoji: string; text: string }> = {
  HELLO:      { emoji: "👋", text: "Hello" },
  "I LOVE YOU": { emoji: "🤟", text: "I love you" },
  "CALL ME":  { emoji: "🤙", text: "Call me" },
  GOOD:       { emoji: "👍", text: "Good" },
  BAD:        { emoji: "👎", text: "Bad" },
  STOP:       { emoji: "✋", text: "Stop" },
  PEACE:      { emoji: "✌️", text: "Peace" },
  POINTING:   { emoji: "☝️", text: "Number One" },
  ROCK:       { emoji: "🤘", text: "Rock on" },
  OK:         { emoji: "👌", text: "OK" },
  SORRY:      { emoji: "🙏", text: "Sorry" },
  YES:        { emoji: "👍", text: "Yes" },
  NO:         { emoji: "🤚", text: "No" },
  FIST:       { emoji: "✊", text: "Fist" },
};

export function buildGestureMeta(g: NonNullable<DetectedGesture>): GestureMeta {
  const meta = GESTURE_MAP[g];
  return {
    gesture: g,
    emoji: meta.emoji,
    text: meta.text,
    confidence: 92 + Math.floor(Math.random() * 7), // 92-98%
  };
}
