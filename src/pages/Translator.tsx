import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, CameraOff, Volume2, VolumeX, RotateCcw, Globe, Zap, Activity, MousePointerClick } from "lucide-react";
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

interface DetectionState {
  isDetecting: boolean;
  currentGesture: GestureResult | null;
  sentence: string[];
  fps: number;
}

export default function Translator() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fpsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState("en");
  const [detection, setDetection] = useState<DetectionState>({
    isDetecting: false,
    currentGesture: null,
    sentence: [],
    fps: 0,
  });
  const [recentGestures, setRecentGestures] = useState<GestureResult[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [flashingGesture, setFlashingGesture] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (fpsRef.current) clearInterval(fpsRef.current);
    if (flashRef.current) clearTimeout(flashRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setDetection({ isDetecting: false, currentGesture: null, sentence: [], fps: 0 });
    setRecentGestures([]);
  }, []);

  const startCamera = useCallback(async () => {
    setPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      toast.success("Camera started — tap a sign button below to detect it!");

      // FPS counter simulation
      fpsRef.current = setInterval(() => {
        setDetection((d) => ({ ...d, fps: 26 + Math.floor(Math.random() * 5) }));
      }, 1000);
    } catch (err) {
      console.error("Camera error:", err);
      setPermissionDenied(true);
      toast.error("Camera access denied. Please allow camera permission.");
    }
  }, []);

  // User manually triggers a specific gesture by tapping a button
  const triggerGesture = useCallback(
    (gesture: GestureResult) => {
      if (!cameraActive) {
        toast.error("Start the camera first, then tap a sign.");
        return;
      }
      const translated = getTranslation(gesture.text, selectedLang);
      console.log("Gesture triggered:", gesture.gesture, "→", translated);

      // Flash highlight on the tapped button
      setFlashingGesture(gesture.gesture);
      if (flashRef.current) clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setFlashingGesture(null), 800);

      setDetection((prev) => {
        const newSentence = [...prev.sentence, gesture.gesture].slice(-6);
        return { isDetecting: true, currentGesture: gesture, sentence: newSentence, fps: prev.fps };
      });

      setRecentGestures((prev) => [gesture, ...prev].slice(0, 5));

      const record: TranslationRecord = {
        id: generateId(),
        gesture: gesture.gesture,
        text: gesture.text,
        translatedText: translated,
        language: selectedLang,
        confidence: gesture.confidence,
        emoji: gesture.emoji,
        timestamp: new Date(),
        audioPlayed: voiceEnabled,
      };
      saveTranslation(record);

      if (voiceEnabled) speakText(translated);
    },
    [cameraActive, selectedLang, voiceEnabled]
  );

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const clearSentence = () => {
    setDetection((d) => ({ ...d, sentence: [], currentGesture: null }));
    setRecentGestures([]);
  };

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang)!;
  const translatedCurrent = detection.currentGesture
    ? getTranslation(detection.currentGesture.text, selectedLang)
    : null;

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
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
          </div>
          <p className="text-sm text-muted-foreground">
            Start your camera, then tap any sign button below — VisionSign AI will detect and translate it instantly.
          </p>
        </div>

        {/* ── Gesture Trigger Panel ── */}
        <div className="glass rounded-2xl p-5 border border-primary/15 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Sign Buttons</span>
            <span className="text-xs text-muted-foreground">— tap any sign to trigger detection</span>
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
                onClick={() => triggerGesture(g)}
                disabled={!cameraActive}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 select-none ${
                  flashingGesture === g.gesture
                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg shadow-primary/30"
                    : cameraActive
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Webcam */}
            <div className="glass rounded-2xl overflow-hidden border border-primary/20 relative aspect-video bg-black/60">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                style={{ display: cameraActive ? "block" : "none" }}
              />

              {/* Overlay when camera off */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold mb-1">Camera Off</p>
                    <p className="text-sm text-muted-foreground">
                      {permissionDenied
                        ? "Permission denied — check browser settings"
                        : "Click Start Camera, then tap a sign button"}
                    </p>
                  </div>
                  {permissionDenied && (
                    <p className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                      Allow camera access in your browser settings
                    </p>
                  )}
                </div>
              )}

              {/* Detection overlay */}
              {cameraActive && detection.currentGesture && (
                <>
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/70 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/70 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary/70 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/70 rounded-br-lg" />

                  {/* Gesture badge */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 glass border border-primary/40 rounded-lg px-3 py-1.5 text-center">
                    <div className="text-2xl">{detection.currentGesture.emoji}</div>
                    <div className="text-xs text-primary font-bold tracking-wide">
                      {detection.currentGesture.gesture}
                    </div>
                    <div className="text-xs text-emerald-400">
                      {detection.currentGesture.confidence}% confidence
                    </div>
                  </div>

                  {/* Hand landmark simulation */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 480">
                    <circle cx="320" cy="370" r="5" fill="#00ffff" opacity="0.8" className="pulse-dot" />
                    {([[295, 330], [320, 310], [345, 330]] as [number, number][]).map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="4" fill="#00ffff" opacity="0.7" />
                    ))}
                    {([[270, 240], [295, 210], [320, 200], [348, 215], [375, 235]] as [number, number][]).map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill="#00ffff" opacity="0.9" className="pulse-dot" />
                        <line
                          x1={x} y1={y}
                          x2={([270, 295, 320, 348, 375] as number[])[i]}
                          y2={([290, 270, 260, 270, 285] as number[])[i]}
                          stroke="#00ffff" strokeWidth="1.5" opacity="0.4"
                        />
                      </g>
                    ))}
                    {([[270, 240, 295, 330], [295, 210, 295, 330], [320, 200, 320, 310], [348, 215, 345, 330], [375, 235, 345, 330]] as [number, number, number, number][]).map(([x1, y1, x2, y2], i) => (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ffff" strokeWidth="1" opacity="0.3" />
                    ))}
                  </svg>
                </>
              )}

              {/* Waiting state */}
              {cameraActive && !detection.currentGesture && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass border border-primary/20 rounded-lg px-4 py-2">
                  <p className="text-xs text-primary/70 text-center">👆 Tap a sign button above to detect</p>
                </div>
              )}

              {/* Scan line */}
              {cameraActive && (
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent scan-line pointer-events-none" />
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  cameraActive
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                }`}
              >
                {cameraActive ? (
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

              {/* Language Selector */}
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
                  Clear All
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
                <div className="font-display text-lg font-semibold text-foreground">
                  {detection.sentence
                    .slice(-5)
                    .map((g) => {
                      const found = GESTURE_DATABASE.find((x) => x.gesture === g);
                      return found ? getTranslation(found.text, selectedLang) : g;
                    })
                    .join(" ")}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Current Detection */}
            <div className="glass-strong rounded-2xl p-5 border border-primary/20">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Current Detection</div>

              {detection.currentGesture ? (
                <div className="text-center">
                  <div className="text-5xl mb-3">{detection.currentGesture.emoji}</div>
                  <div className="font-display text-2xl font-bold text-primary mb-1">
                    {translatedCurrent}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {currentLang.flag} {currentLang.label}
                  </div>

                  {/* Confidence bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">AI Confidence</span>
                      <span className="text-emerald-400 font-semibold">{detection.currentGesture.confidence}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700"
                        style={{ width: `${detection.currentGesture.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono">
                    SIGN: {detection.currentGesture.gesture}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {cameraActive ? "Tap a sign button to detect" : "Start camera first"}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Gestures */}
            <div className="glass rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Recent Signs</div>
              {recentGestures.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No signs detected yet</p>
              ) : (
                <div className="space-y-2">
                  {recentGestures.map((g, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                        i === 0 ? "bg-primary/10 border border-primary/20" : "bg-white/3"
                      }`}
                    >
                      <span className="text-lg">{g.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{g.gesture}</div>
                        <div className="text-xs text-muted-foreground">
                          {getTranslation(g.text, selectedLang)}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono">{g.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How to Use */}
            <div className="glass rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">How to Use</div>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">1.</span>
                  Click <strong className="text-foreground">Start Camera</strong>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">2.</span>
                  Tap any sign button at the top
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">3.</span>
                  See it detected on the video overlay
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">4.</span>
                  Hear the voice output play
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">5.</span>
                  Build sentences sign by sign
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
