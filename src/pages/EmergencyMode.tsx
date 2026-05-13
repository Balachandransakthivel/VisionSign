import { useState } from "react";
import { AlertTriangle, Volume2, Phone, Zap, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { speakText } from "@/lib/gestureData";

interface EmergencyPhrase {
  id: string;
  label: string;
  emoji: string;
  speech: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  size: "large" | "medium";
}

const EMERGENCY_PHRASES: EmergencyPhrase[] = [
  {
    id: "help",
    label: "HELP!",
    emoji: "🆘",
    speech: "Help! I need help immediately!",
    color: "text-red-400",
    glow: "shadow-red-500/40",
    bg: "bg-red-500/15 hover:bg-red-500/25",
    border: "border-red-500/40 hover:border-red-500/70",
    size: "large",
  },
  {
    id: "call",
    label: "CALL DOCTOR",
    emoji: "🩺",
    speech: "Please call a doctor immediately!",
    color: "text-amber-400",
    glow: "shadow-amber-500/30",
    bg: "bg-amber-500/15 hover:bg-amber-500/25",
    border: "border-amber-500/40 hover:border-amber-500/70",
    size: "large",
  },
  {
    id: "pain",
    label: "I AM IN PAIN",
    emoji: "😣",
    speech: "I am in pain. Please help me.",
    color: "text-orange-400",
    glow: "shadow-orange-500/30",
    bg: "bg-orange-500/15 hover:bg-orange-500/25",
    border: "border-orange-500/40 hover:border-orange-500/70",
    size: "large",
  },
  {
    id: "sos",
    label: "SOS",
    emoji: "🚨",
    speech: "SOS! Emergency! Please help!",
    color: "text-red-300",
    glow: "shadow-red-400/40",
    bg: "bg-red-400/15 hover:bg-red-400/25",
    border: "border-red-400/50 hover:border-red-400/80",
    size: "large",
  },
  {
    id: "water",
    label: "WATER PLEASE",
    emoji: "💧",
    speech: "I need water please.",
    color: "text-cyan-400",
    glow: "shadow-cyan-500/25",
    bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
    border: "border-cyan-500/30 hover:border-cyan-500/60",
    size: "medium",
  },
  {
    id: "food",
    label: "I NEED FOOD",
    emoji: "🍽️",
    speech: "I need food. I am hungry.",
    color: "text-emerald-400",
    glow: "shadow-emerald-500/25",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    size: "medium",
  },
  {
    id: "bathroom",
    label: "BATHROOM",
    emoji: "🚽",
    speech: "I need to use the bathroom.",
    color: "text-blue-400",
    glow: "shadow-blue-500/25",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    border: "border-blue-500/30 hover:border-blue-500/60",
    size: "medium",
  },
  {
    id: "quiet",
    label: "QUIET PLEASE",
    emoji: "🤫",
    speech: "Please be quiet.",
    color: "text-violet-400",
    glow: "shadow-violet-500/25",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
    border: "border-violet-500/30 hover:border-violet-500/60",
    size: "medium",
  },
];

export default function EmergencyMode() {
  const [active, setActive] = useState<string | null>(null);
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);

  const handlePress = (phrase: EmergencyPhrase) => {
    setActive(phrase.id);
    setLastSpoken(phrase.speech);
    speakText(phrase.speech);
    setTimeout(() => setActive(null), 1200);
  };

  const largeCards = EMERGENCY_PHRASES.filter((p) => p.size === "large");
  const mediumCards = EMERGENCY_PHRASES.filter((p) => p.size === "medium");

  return (
    <div className="pt-16 min-h-screen">
      {/* Red top accent bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/60 to-transparent z-40" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Emergency Mode</h1>
              <p className="text-xs text-red-400/80 font-medium">High-priority communication panel</p>
            </div>
          </div>

          <div className="glass rounded-xl px-4 py-3 border border-amber-500/25 bg-amber-500/5">
            <p className="text-sm text-amber-300/90 flex items-start gap-2">
              <Volume2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <span>
                <strong>Tap any button</strong> to instantly speak that phrase aloud at full volume. Designed for urgent communication in hospitals, emergencies, or public spaces.
              </span>
            </p>
          </div>
        </div>

        {/* Last Spoken Banner */}
        {lastSpoken && (
          <div className="glass rounded-xl p-4 border border-primary/25 bg-primary/5 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Last Spoken</div>
                <div className="font-display font-semibold text-foreground">{lastSpoken}</div>
              </div>
            </div>
          </div>
        )}

        {/* Large Emergency Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {largeCards.map((phrase) => (
            <button
              key={phrase.id}
              onClick={() => handlePress(phrase)}
              className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 select-none cursor-pointer ${phrase.bg} ${phrase.border} ${
                active === phrase.id
                  ? `scale-95 shadow-2xl ${phrase.glow}`
                  : `hover:scale-[1.02] shadow-lg ${phrase.glow}`
              }`}
              style={{ minHeight: "140px" }}
            >
              {active === phrase.id && (
                <div className="absolute inset-0 rounded-2xl border-2 border-current animate-ping opacity-30" />
              )}
              <span className="text-5xl leading-none">{phrase.emoji}</span>
              <span className={`font-display text-lg font-bold tracking-wide ${phrase.color}`}>
                {phrase.label}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                <Volume2 className="w-3 h-3" />
                <span>Tap to speak</span>
              </div>
            </button>
          ))}
        </div>

        {/* Medium Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {mediumCards.map((phrase) => (
            <button
              key={phrase.id}
              onClick={() => handlePress(phrase)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95 select-none cursor-pointer ${phrase.bg} ${phrase.border} ${
                active === phrase.id ? "scale-95" : "hover:scale-[1.03]"
              }`}
              style={{ minHeight: "100px" }}
            >
              <span className="text-3xl leading-none">{phrase.emoji}</span>
              <span className={`font-display text-xs font-bold text-center leading-tight ${phrase.color}`}>
                {phrase.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tips */}
        <div className="glass rounded-2xl p-5 border border-border">
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Usage Tips
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">•</span>
              Keep this page open in hospitals or care facilities for quick access
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">•</span>
              Ensure device volume is at maximum before using Emergency Mode
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">•</span>
              Tap any button multiple times to repeat the spoken phrase
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">•</span>
              Use the Full Translator for more complex communication needs
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
            <Link
              to="/translator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Full Translator
            </Link>
            <Link
              to="/guide"
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-border text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Gesture Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
