import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Globe,
  Zap,
  Activity,
  PlayCircle,
  Hand,
  Cpu,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  GESTURE_DATABASE,
  LANGUAGES,
  generateId,
  getTranslation,
  saveTranslation,
  speakText,
  type GestureResult,
  type TranslationRecord,
} from "@/lib/gestureData";
import {
  classifyGesture,
  buildGestureMeta,
  type NormalizedLandmark,
  type DetectedGesture,
} from "@/lib/handGestureDetector";

// ── Types ────────────────────────────────────────────────────────────────────

interface DetectionState {
  currentGesture: GestureResult | null;
  sentence: string[];
  fps: number;
  handVisible: boolean;
  landmarks: NormalizedLandmark[] | null;
}

// ── MediaPipe dynamic loader ─────────────────────────────────────────────────

async function loadMediaPipe() {
  // Dynamically load Hands from CDN via the npm package (locateFile → CDN)
  const { Hands } = await import("@mediapipe/hands");
  const hands = new Hands({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
  });
  return hands;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Translator() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const fpsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGestureRef = useRef<string | null>(null);
  const speakCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());

  const [cameraActive, setCameraActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [detection, setDetection] = useState<DetectionState>({
    currentGesture: null,
    sentence: [],
    fps: 0,
    handVisible: false,
    landmarks: null,
  });
  const [recentGestures, setRecentGestures] = useState<GestureResult[]>([]);
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  // ── MediaPipe results handler ──────────────────────────────────────────────

  const onHandResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw video frame onto canvas
      const video = videoRef.current;
      if (!video) return;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const hasHand =
        results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

      if (hasHand) {
        const lm: NormalizedLandmark[] = results.multiHandLandmarks[0];

        // Draw skeleton
        drawHandSkeleton(ctx, lm, canvas.width, canvas.height);

        // Classify gesture
        const detected: DetectedGesture = classifyGesture(lm);

        if (detected) {
          const meta = buildGestureMeta(detected);

          // Map to GestureResult shape (compatible with gestureData types)
          const gestureResult: GestureResult = {
            gesture: meta.gesture as string,
            emoji: meta.emoji,
            text: meta.text,
            confidence: meta.confidence,
          };

          // Only fire events when gesture changes (debounced)
          if (detected !== lastGestureRef.current) {
            lastGestureRef.current = detected;

            setDetection((prev) => ({
              ...prev,
              currentGesture: gestureResult,
              sentence: [...prev.sentence, detected].slice(-8),
              handVisible: true,
              landmarks: lm,
            }));

            setRecentGestures((prev) => [gestureResult, ...prev].slice(0, 6));

            // Save to history
            const translated = getTranslation(meta.text, selectedLang);
            const record: TranslationRecord = {
              id: generateId(),
              gesture: detected,
              text: meta.text,
              translatedText: translated,
              language: selectedLang,
              confidence: meta.confidence,
              emoji: meta.emoji,
              timestamp: new Date(),
              audioPlayed: voiceEnabled,
            };
            saveTranslation(record);

            // Speak with cooldown (don't spam)
            if (voiceEnabled) {
              if (speakCooldownRef.current)
                clearTimeout(speakCooldownRef.current);
              speakCooldownRef.current = setTimeout(() => {
                speakText(translated);
              }, 300);
            }
          } else {
            setDetection((prev) => ({
              ...prev,
              handVisible: true,
              landmarks: lm,
            }));
          }
        } else {
          // Hand visible but no confident gesture
          lastGestureRef.current = null;
          setDetection((prev) => ({
            ...prev,
            handVisible: true,
            landmarks: lm,
          }));
        }
      } else {
        // No hand
        lastGestureRef.current = null;
        setDetection((prev) => ({
          ...prev,
          handVisible: false,
          landmarks: null,
        }));
      }

      ctx.restore();

      // FPS counter
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        const fps = frameCountRef.current;
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
        setDetection((prev) => ({ ...prev, fps }));
      }
    },
    [selectedLang, voiceEnabled]
  );

  // ── Draw hand skeleton on canvas ──────────────────────────────────────────

  function drawHandSkeleton(
    ctx: CanvasRenderingContext2D,
    lm: NormalizedLandmark[],
    w: number,
    h: number
  ) {
    const px = (l: NormalizedLandmark) => ({ x: l.x * w, y: l.y * h });

    // Connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],        // thumb
      [0, 5], [5, 6], [6, 7], [7, 8],         // index
      [0, 9], [9, 10], [10, 11], [11, 12],    // middle
      [0, 13], [13, 14], [14, 15], [15, 16],  // ring
      [0, 17], [17, 18], [18, 19], [19, 20],  // pinky
      [5, 9], [9, 13], [13, 17],              // palm
    ];

    ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(0,255,255,0.5)";
    ctx.shadowBlur = 6;

    for (const [a, b] of connections) {
      const pa = px(lm[a]);
      const pb = px(lm[b]);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Dots
    for (let i = 0; i < lm.length; i++) {
      const p = px(lm[i]);
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, isTip ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? "rgba(0,255,255,1)" : "rgba(0,200,255,0.8)";
      ctx.shadowBlur = isTip ? 14 : 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // ── Processing loop ───────────────────────────────────────────────────────

  const processLoop = useCallback(async () => {
    const hands = handsRef.current;
    const video = videoRef.current;
    if (!hands || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processLoop);
      return;
    }
    try {
      await hands.send({ image: video });
    } catch (e) {
      console.warn("Hands send error:", e);
    }
    rafRef.current = requestAnimationFrame(processLoop);
  }, []);

  // ── Camera start ──────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await new Promise<void>((res) => {
        video.onloadedmetadata = () => {
          video.play();
          res();
        };
      });

      // Resize canvas to match
      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Load MediaPipe
      toast.info("Loading AI hand detector…");
      const hands = await loadMediaPipe();
      hands.onResults(onHandResults);
      handsRef.current = hands;
      setAiReady(true);

      setCameraActive(true);
      setLoading(false);
      toast.success("VisionSign AI ready — show your hand to the camera!");

      rafRef.current = requestAnimationFrame(processLoop);
    } catch (err: any) {
      console.error("Camera/AI error:", err);
      setLoading(false);
      if (err?.name === "NotAllowedError") {
        setPermissionDenied(true);
        toast.error("Camera permission denied.");
      } else {
        toast.error("Failed to start: " + (err?.message || "Unknown error"));
      }
    }
  }, [onHandResults, processLoop]);

  // ── Camera stop ───────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (fpsRef.current) clearInterval(fpsRef.current);
    if (speakCooldownRef.current) clearTimeout(speakCooldownRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    handsRef.current = null;
    setCameraActive(false);
    setAiReady(false);
    setDetection({ currentGesture: null, sentence: [], fps: 0, handVisible: false, landmarks: null });
    setRecentGestures([]);
    lastGestureRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Re-attach onResults when lang/voice changes
  useEffect(() => {
    if (handsRef.current) {
      handsRef.current.onResults(onHandResults);
    }
  }, [onHandResults]);

  // ── Manual gesture trigger (fallback mode) ────────────────────────────────

  const triggerManual = useCallback(
    (g: GestureResult) => {
      if (!cameraActive) {
        toast.error("Start the camera first.");
        return;
      }
      const translated = getTranslation(g.text, selectedLang);
      setDetection((prev) => ({
        ...prev,
        currentGesture: g,
        sentence: [...prev.sentence, g.gesture].slice(-8),
      }));
      setRecentGestures((prev) => [g, ...prev].slice(0, 6));
      const record: TranslationRecord = {
        id: generateId(),
        gesture: g.gesture,
        text: g.text,
        translatedText: translated,
        language: selectedLang,
        confidence: g.confidence,
        emoji: g.emoji,
        timestamp: new Date(),
        audioPlayed: voiceEnabled,
      };
      saveTranslation(record);
      if (voiceEnabled) speakText(translated);
    },
    [cameraActive, selectedLang, voiceEnabled]
  );

  const clearSentence = () => {
    setDetection((d) => ({ ...d, sentence: [], currentGesture: null }));
    setRecentGestures([]);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang)!;
  const translatedCurrent = detection.currentGesture
    ? getTranslation(detection.currentGesture.text, selectedLang)
    : null;

  const fullSentence = detection.sentence
    .map((g) => {
      const found = GESTURE_DATABASE.find((x) => x.gesture === g);
      return found
        ? getTranslation(found.text, selectedLang)
        : buildGestureMeta(g as any)?.text ?? g;
    })
    .join(" ");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Live Translator</h1>
              {cameraActive && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                  LIVE · {detection.fps} FPS
                </span>
              )}
              {aiReady && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs text-primary font-medium">
                  <Cpu className="w-3 h-3" />
                  AI Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Show your hand to the camera — MediaPipe AI detects gestures in real time.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 glass border border-border rounded-xl p-1 self-start">
            <button
              onClick={() => setMode("auto")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "auto"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              AI Mode
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manual
            </button>
          </div>
        </div>

        {/* AI Mode info banner */}
        {mode === "auto" && !cameraActive && (
          <div className="glass rounded-xl p-4 border border-primary/20 mb-6 bg-primary/3">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm mb-1">Real AI Hand Detection</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  MediaPipe Hands analyses 21 landmarks on your hand 30× per second. 
                  No button clicks needed — just show your hand sign to the camera and VisionSign will detect it automatically.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["👋 Open Palm = HELLO", "👍 Thumb Up = GOOD", "🤟 ILY Shape = I LOVE YOU", "✌️ Two Fingers = PEACE"].map((h) => (
                    <span key={h} className="text-xs px-2 py-1 rounded-lg glass border border-border text-muted-foreground">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual gesture buttons */}
        {mode === "manual" && (
          <div className="glass rounded-2xl p-5 border border-primary/15 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Manual Sign Buttons</span>
              <span className="text-xs text-muted-foreground">— tap any sign to trigger it</span>
              {!cameraActive && (
                <span className="ml-auto text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  ⚠ Start camera first
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GESTURE_DATABASE.map((g) => (
                <button
                  key={g.gesture}
                  onClick={() => triggerManual(g)}
                  disabled={!cameraActive}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                    cameraActive
                      ? "glass border-border text-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary active:scale-95 cursor-pointer"
                      : "glass border-border/30 text-muted-foreground/40 cursor-not-allowed"
                  }`}
                >
                  <span className="text-base leading-none">{g.emoji}</span>
                  <span>{g.gesture}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera + Canvas Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video / Canvas */}
            <div className="glass rounded-2xl overflow-hidden border border-primary/20 relative aspect-video bg-black/80">
              {/* Hidden video element — used as MediaPipe input source */}
              <video
                ref={videoRef}
                className="hidden"
                muted
                playsInline
              />

              {/* Canvas shows annotated output */}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
                style={{ display: cameraActive ? "block" : "none" }}
              />

              {/* Off state */}
              {!cameraActive && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center float-animation">
                    <Camera className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold mb-1">Camera Off</p>
                    <p className="text-sm text-muted-foreground">
                      {permissionDenied
                        ? "Permission denied — check browser settings"
                        : "Click Start Camera to activate AI detection"}
                    </p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/60">
                  <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-primary font-medium">Loading MediaPipe AI…</p>
                  <p className="text-xs text-muted-foreground">First load may take a few seconds</p>
                </div>
              )}

              {/* Live overlays */}
              {cameraActive && (
                <>
                  {/* Corner brackets */}
                  <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-primary/60 rounded-tl-lg pointer-events-none" />
                  <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-primary/60 rounded-tr-lg pointer-events-none" />
                  <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-primary/60 rounded-bl-lg pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-primary/60 rounded-br-lg pointer-events-none" />

                  {/* Hand status */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    {detection.handVisible && detection.currentGesture ? (
                      <div className="glass border border-primary/50 rounded-xl px-4 py-2 text-center">
                        <div className="text-2xl leading-none mb-0.5">{detection.currentGesture.emoji}</div>
                        <div className="text-xs text-primary font-bold tracking-wide">{detection.currentGesture.gesture}</div>
                        <div className="text-xs text-emerald-400">{detection.currentGesture.confidence}%</div>
                      </div>
                    ) : detection.handVisible ? (
                      <div className="glass border border-amber-400/30 rounded-xl px-4 py-2">
                        <div className="text-xs text-amber-400 font-medium">Hand detected — hold sign steady</div>
                      </div>
                    ) : (
                      <div className="glass border border-border/40 rounded-xl px-4 py-2">
                        <div className="text-xs text-muted-foreground/70">👐 Show your hand to camera</div>
                      </div>
                    )}
                  </div>

                  {/* Scan line */}
                  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent scan-line pointer-events-none" />
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                  cameraActive
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                }`}
              >
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Loading AI…</>
                ) : cameraActive ? (
                  <><CameraOff className="w-4 h-4" /> Stop Camera</>
                ) : (
                  <><Camera className="w-4 h-4" /> Start Camera</>
                )}
              </button>

              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  voiceEnabled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "glass border-border text-muted-foreground"
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Voice {voiceEnabled ? "On" : "Off"}
              </button>

              <div className="relative">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="glass border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-foreground appearance-none pr-8 cursor-pointer focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-card">
                      {l.flag} {l.label}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>

              {detection.sentence.length > 0 && (
                <button
                  onClick={clearSentence}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Sentence Builder */}
            {detection.sentence.length > 0 && (
              <div className="glass rounded-xl p-4 border border-primary/15">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Sentence Builder
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {detection.sentence.map((g, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        i === detection.sentence.length - 1
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "bg-white/5 border-border text-muted-foreground"
                      }`}
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <div className="font-display text-lg font-semibold text-foreground mb-3">
                  {fullSentence}
                </div>
                <button
                  onClick={() => speakText(fullSentence)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/25 transition-all active:scale-95"
                >
                  <PlayCircle className="w-4 h-4" />
                  Speak Full Sentence
                </button>
              </div>
            )}

            {/* Supported Gestures Cheat-sheet */}
            {mode === "auto" && cameraActive && (
              <div className="glass rounded-xl p-4 border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Hand className="w-3.5 h-3.5 text-primary" />
                  Detectable Signs
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    ["👋", "Open Palm", "HELLO"],
                    ["👍", "Thumb Up", "GOOD"],
                    ["✋", "4 Fingers Up", "STOP"],
                    ["🤟", "Thumb+Idx+Pinky", "I LOVE YOU"],
                    ["🤙", "Thumb+Pinky", "CALL ME"],
                    ["✌️", "Idx+Mid", "PEACE"],
                    ["☝️", "Index Only", "POINTING"],
                    ["🤘", "Idx+Pinky", "ROCK"],
                    ["👌", "Tip circle", "OK"],
                    ["🙏", "All closed", "SORRY"],
                  ].map(([emoji, hint, label]) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-white/3 border border-border">
                      <span className="text-base">{emoji}</span>
                      <div>
                        <div className="font-semibold text-foreground">{label}</div>
                        <div className="text-muted-foreground/70">{hint}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Current Detection */}
            <div className="glass-strong rounded-2xl p-5 border border-primary/20">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                AI Detection
              </div>

              {detection.currentGesture ? (
                <div className="text-center">
                  <div className="text-5xl mb-3">{detection.currentGesture.emoji}</div>
                  <div className="font-display text-2xl font-bold text-primary mb-1">
                    {translatedCurrent}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {currentLang.flag} {currentLang.label}
                  </div>

                  {/* Confidence */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="text-emerald-400 font-semibold">
                        {detection.currentGesture.confidence}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                        style={{ width: `${detection.currentGesture.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono">
                    SIGN: {detection.currentGesture.gesture}
                  </div>

                  {detection.handVisible && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                      Hand Tracked
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Hand className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  {cameraActive ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">
                        {detection.handVisible
                          ? "Hold your sign steady…"
                          : "Waiting for hand…"}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Show a clear hand sign to the camera
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Start camera first</p>
                  )}
                </div>
              )}
            </div>

            {/* Recent */}
            <div className="glass rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Recent Signs
              </div>
              {recentGestures.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No signs detected yet
                </p>
              ) : (
                <div className="space-y-2">
                  {recentGestures.map((g, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                        i === 0
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-white/3"
                      }`}
                    >
                      <span className="text-lg">{g.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{g.gesture}</div>
                        <div className="text-xs text-muted-foreground">
                          {getTranslation(g.text, selectedLang)}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono">
                        {g.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How to Use */}
            <div className="glass rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                How to Use
              </div>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">1.</span>
                  Click <strong className="text-foreground">Start Camera</strong>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">2.</span>
                  Wait for AI model to load (~3 sec first time)
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">3.</span>
                  Hold a hand sign in front of camera
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">4.</span>
                  See cyan skeleton + gesture label instantly
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">5.</span>
                  Voice output plays automatically
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">6.</span>
                  Change signs to build sentences
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
