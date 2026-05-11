import { Link } from "react-router-dom";
import { Zap, Camera, Volume2, Globe, Shield, ChevronRight, Hand, Cpu, Activity } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import handGesture from "@/assets/hand-gesture.jpg";

const features = [
  {
    icon: Camera,
    title: "Real-Time Detection",
    desc: "MediaPipe + TensorFlow process hand landmarks at 30 FPS with sub-100ms latency.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/20",
  },
  {
    icon: Volume2,
    title: "Voice Output",
    desc: "Instantly converts translated text to natural speech using Web Speech API.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    desc: "Translate recognized signs into English, Tamil, Hindi, and French instantly.",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  {
    icon: Cpu,
    title: "AI Sentence Builder",
    desc: "Combine individual signs into complete, natural sentences automatically.",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  {
    icon: Activity,
    title: "Confidence Scoring",
    desc: "Each gesture shows accuracy percentage, ensuring reliable translations.",
    color: "text-rose-400",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "All processing runs locally. No video data leaves your device.",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
];

const stats = [
  { label: "Supported Signs", value: "500+" },
  { label: "Languages", value: "4" },
  { label: "Detection FPS", value: "30" },
  { label: "Accuracy Rate", value: "96%" },
];

const useCases = [
  {
    title: "Healthcare",
    desc: "Hospitals and clinics can serve deaf patients without an interpreter.",
    img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop&q=80",
  },
  {
    title: "Education",
    desc: "Schools include deaf students in real-time classroom communication.",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop&q=80",
  },
  {
    title: "Public Services",
    desc: "Government offices and airports provide accessible communication.",
    img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&h=250&fit=crop&q=80",
  },
];

export default function Home() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBanner})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Animated scan line */}
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent scan-line pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 mb-6 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-primary pulse-dot" />
              <span className="text-xs text-primary font-medium tracking-wide uppercase">
                AI-Powered · Real-Time · Accessible
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Sign Language{" "}
              <span className="shimmer-text">Understood</span>
              <br />
              <span className="text-foreground/70">Instantly</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              VisionSign uses deep learning to detect hand gestures in real time and converts
              them into text, speech, and multiple languages — bridging communication between
              deaf and hearing communities.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Link
                to="/translator"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all neon-glow"
              >
                <Zap className="w-4 h-4" />
                Launch Translator
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-primary/30 text-foreground font-semibold text-sm hover:border-primary/60 transition-all"
              >
                <Activity className="w-4 h-4 text-primary" />
                View Analytics
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-12 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-2xl font-bold neon-text">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating hand card */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block float-animation">
          <div className="glass-strong rounded-2xl overflow-hidden w-64 neon-border border">
            <img src={handGesture} alt="Hand gesture detection" className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Detected</span>
                <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="font-display text-xl font-bold text-primary mb-1">I LOVE YOU 🤟</div>
              <div className="text-sm text-muted-foreground">Confidence: <span className="text-emerald-400 font-semibold">98%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Built for <span className="shimmer-text">Real Communication</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every feature is designed to make sign language accessible to everyone, everywhere.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`glass rounded-xl p-6 border ${f.bg} hover:scale-[1.02] transition-all duration-200 cursor-default`}
              >
                <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4 border`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass rounded-2xl p-8 lg:p-12 border border-primary/10">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-3">
              How <span className="shimmer-text">VisionSign</span> Works
            </h2>
            <p className="text-muted-foreground">Six steps from gesture to voice in under 100ms</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Open Camera", desc: "Browser requests webcam permission and starts live feed.", icon: Camera },
              { step: "02", title: "Hand Detection", desc: "MediaPipe identifies 21 hand landmarks in each frame.", icon: Hand },
              { step: "03", title: "AI Recognition", desc: "TensorFlow model classifies gesture with confidence score.", icon: Cpu },
              { step: "04", title: "Text Output", desc: "Recognized gesture converts to readable text instantly.", icon: Zap },
              { step: "05", title: "Translation", desc: "Text translates to your selected language automatically.", icon: Globe },
              { step: "06", title: "Voice Playback", desc: "Web Speech API speaks the translated result aloud.", icon: Volume2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-primary font-mono mb-0.5">{item.step}</div>
                    <div className="font-semibold text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-3">
            Making an <span className="shimmer-text">Impact</span>
          </h2>
          <p className="text-muted-foreground">Real-world applications across vital sectors</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((u) => (
            <div key={u.title} className="glass rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-200">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={u.img}
                  alt={u.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="font-display font-semibold text-base mb-2">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="glass rounded-2xl p-12 neon-border border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <Hand className="w-12 h-12 text-primary mx-auto mb-5 float-animation" />
          <h2 className="font-display text-4xl font-bold mb-4">
            Start Communicating <span className="shimmer-text">Today</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            No downloads. No installs. Open your camera and start translating sign language
            in seconds.
          </p>
          <Link
            to="/translator"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all neon-glow"
          >
            <Zap className="w-5 h-5" />
            Open Live Translator
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Hand className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold">
            <span className="shimmer-text">Vision</span>Sign
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-powered sign language translation · Built for accessibility · 2026
        </p>
      </footer>
    </div>
  );
}
