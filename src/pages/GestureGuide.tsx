import { useState, useMemo } from "react";
import { Search, BookOpen, Star, Zap, Heart, AlertTriangle, Hand } from "lucide-react";
import { GESTURE_DATABASE, speakText, getTranslation, LANGUAGES } from "@/lib/gestureData";
import { Link } from "react-router-dom";

interface GuideEntry {
  gesture: string;
  emoji: string;
  text: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  howTo: string;
}

const GUIDE_DATA: GuideEntry[] = [
  { gesture: "HELLO", emoji: "👋", text: "Hello", category: "Greetings", difficulty: "Easy", description: "A warm greeting to start a conversation", howTo: "Raise your open hand and wave gently side to side" },
  { gesture: "THANK YOU", emoji: "🙏", text: "Thank you", category: "Greetings", difficulty: "Easy", description: "Express gratitude to someone", howTo: "Place fingertips to chin, then bring hand forward and down" },
  { gesture: "HOW ARE YOU", emoji: "🤔", text: "How are you?", category: "Greetings", difficulty: "Medium", description: "Ask someone about their wellbeing", howTo: "Point index fingers, bend and straighten multiple times" },
  { gesture: "SORRY", emoji: "😔", text: "I'm sorry", category: "Greetings", difficulty: "Easy", description: "Apologize or express regret", howTo: "Make a fist, rub it in a circular motion on your chest" },
  { gesture: "I LOVE YOU", emoji: "🤟", text: "I love you", category: "Emotions", difficulty: "Easy", description: "Express deep affection and love", howTo: "Extend thumb, index finger, and pinky; fold down middle and ring fingers" },
  { gesture: "GOOD", emoji: "👌", text: "Good", category: "Emotions", difficulty: "Easy", description: "Indicate something is positive or acceptable", howTo: "Touch thumb and index finger together, other fingers spread" },
  { gesture: "BAD", emoji: "👎", text: "Bad", category: "Emotions", difficulty: "Easy", description: "Indicate something is negative", howTo: "Point thumb downward with confidence" },
  { gesture: "YES", emoji: "👍", text: "Yes", category: "Basic Words", difficulty: "Easy", description: "Confirm or agree with something", howTo: "Make a fist and bob it up and down like a nod" },
  { gesture: "NO", emoji: "✋", text: "No", category: "Basic Words", difficulty: "Easy", description: "Deny or disagree with something", howTo: "Bring index and middle finger down to meet the thumb repeatedly" },
  { gesture: "PLEASE", emoji: "🙏", text: "Please", category: "Basic Words", difficulty: "Easy", description: "Make a polite request", howTo: "Place flat hand on chest and rub in circular motion" },
  { gesture: "HELP", emoji: "🆘", text: "Help me", category: "Emergency", difficulty: "Easy", description: "Request immediate assistance", howTo: "Place closed fist (thumb up) on flat palm, lift both upward together" },
  { gesture: "WATER", emoji: "💧", text: "Water", category: "Needs", difficulty: "Medium", description: "Request water or indicate thirst", howTo: "Make a W with three fingers, tap chin twice" },
  { gesture: "FOOD", emoji: "🍽️", text: "Food", category: "Needs", difficulty: "Medium", description: "Indicate hunger or request food", howTo: "Bring grouped fingertips to lips repeatedly as if eating" },
  { gesture: "HOME", emoji: "🏠", text: "Home", category: "Needs", difficulty: "Medium", description: "Indicate your home or desire to go home", howTo: "Touch fingertips to chin, then to cheek" },
  { gesture: "FRIEND", emoji: "🤝", text: "Friend", category: "Social", difficulty: "Medium", description: "Refer to a friend or companion", howTo: "Hook index fingers together, then swap positions" },
];

const CATEGORIES = [
  { id: "All", label: "All Signs", icon: BookOpen, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { id: "Greetings", label: "Greetings", icon: Star, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  { id: "Emotions", label: "Emotions", icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/20" },
  { id: "Basic Words", label: "Basic Words", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  { id: "Emergency", label: "Emergency", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  { id: "Needs", label: "Needs", icon: Hand, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { id: "Social", label: "Social", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  Hard: "text-rose-400 bg-rose-400/10 border-rose-400/25",
};

export default function GestureGuide() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedLang, setSelectedLang] = useState("en");
  const [flipped, setFlipped] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return GUIDE_DATA.filter((g) => {
      const matchCat = activeCategory === "All" || g.category === activeCategory;
      const matchSearch =
        g.gesture.toLowerCase().includes(search.toLowerCase()) ||
        g.text.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const translated = getTranslation(text, selectedLang);
    speakText(translated);
  };

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Gesture Reference Guide</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Learn all {GUIDE_DATA.length} supported signs. Click any card to see how to perform it — tap the speaker to hear the translation.
          </p>
        </div>

        {/* Search + Language */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search signs, meanings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="glass border border-border rounded-xl px-3 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-card">
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? `${cat.bg} ${cat.color} border-current/40`
                    : "glass border-border text-muted-foreground hover:text-foreground hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                {cat.id !== "All" && (
                  <span className="text-xs opacity-60">
                    ({GUIDE_DATA.filter((g) => g.category === cat.id).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <div className="text-xs text-muted-foreground mb-4">
          Showing {filtered.length} of {GUIDE_DATA.length} signs
        </div>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center border border-border">
            <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No signs match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((g) => {
              const isFlipped = flipped === g.gesture;
              const translated = getTranslation(g.text, selectedLang);

              return (
                <div
                  key={g.gesture}
                  onClick={() => setFlipped(isFlipped ? null : g.gesture)}
                  className="glass rounded-2xl border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer group overflow-hidden"
                >
                  {!isFlipped ? (
                    /* Front */
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{g.emoji}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLORS[g.difficulty]}`}>
                          {g.difficulty}
                        </span>
                      </div>

                      <div className="mb-1">
                        <span className="font-display text-base font-bold text-foreground block">{g.gesture}</span>
                        <span className="text-primary font-semibold text-sm block">{translated}</span>
                        {translated !== g.text && (
                          <span className="text-xs text-muted-foreground">{g.text}</span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{g.description}</p>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-border">
                          {g.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleSpeak(g.text, e)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Hear pronunciation"
                          >
                            🔊
                          </button>
                          <span className="text-xs text-muted-foreground/60 group-hover:text-primary/60 transition-colors">Tap for how-to →</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Back - How To */
                    <div className="p-5 bg-primary/5 min-h-full">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          How to Sign
                        </span>
                      </div>
                      <div className="font-display font-bold text-primary mb-1">{g.gesture}</div>
                      <div className="w-full h-px bg-primary/20 mb-3" />
                      <p className="text-sm text-foreground leading-relaxed">{g.howTo}</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => handleSpeak(g.text, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-colors"
                        >
                          🔊 Hear It
                        </button>
                        <Link
                          to="/translator"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Zap className="w-3 h-3" /> Try It
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-3 text-right">Tap to flip back</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 glass rounded-2xl p-6 border border-primary/20 text-center">
          <div className="text-2xl mb-2">🤟</div>
          <h3 className="font-display font-bold text-lg mb-2">Ready to Practice?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Open the Live Translator and tap sign buttons to see them detected instantly.
          </p>
          <Link
            to="/translator"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all neon-glow"
          >
            <Zap className="w-4 h-4" />
            Open Translator
          </Link>
        </div>
      </div>
    </div>
  );
}
