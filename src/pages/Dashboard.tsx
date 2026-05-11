import { useEffect, useState } from "react";
import { Activity, TrendingUp, Hand, Globe, Zap, Award, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { getHistory, GESTURE_DATABASE, LANGUAGES } from "@/lib/gestureData";

const COLORS = ["#00ffff", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490"];

interface Stats {
  total: number;
  todayCount: number;
  avgConfidence: number;
  topGesture: string;
  topLang: string;
  languageDist: { name: string; value: number; flag: string }[];
  gestureDist: { name: string; count: number }[];
  hourlyData: { hour: string; count: number }[];
  confidenceTrend: { index: number; confidence: number }[];
}

function buildStats(): Stats {
  const history = getHistory();
  const today = new Date().toDateString();
  const todayRecords = history.filter((r) => new Date(r.timestamp).toDateString() === today);

  const gestureCounts: Record<string, number> = {};
  const langCounts: Record<string, number> = {};
  const hourCounts: Record<string, number> = {};

  history.forEach((r) => {
    gestureCounts[r.gesture] = (gestureCounts[r.gesture] ?? 0) + 1;
    langCounts[r.language] = (langCounts[r.language] ?? 0) + 1;
    const hour = new Date(r.timestamp).getHours();
    const label = `${hour}:00`;
    hourCounts[label] = (hourCounts[label] ?? 0) + 1;
  });

  const topGesture =
    Object.entries(gestureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topLang =
    Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "en";

  const avgConfidence =
    history.length > 0
      ? Math.round(history.reduce((s, r) => s + r.confidence, 0) / history.length)
      : 0;

  const LANG_LABELS: Record<string, string> = { en: "English", ta: "Tamil", hi: "Hindi", fr: "French" };
  const LANG_FLAGS: Record<string, string> = { en: "🇬🇧", ta: "🇮🇳", hi: "🇮🇳", fr: "🇫🇷" };

  const languageDist = Object.entries(langCounts).map(([code, value]) => ({
    name: LANG_LABELS[code] ?? code,
    value,
    flag: LANG_FLAGS[code] ?? "🌐",
  }));

  const gestureDist = Object.entries(gestureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const hourlyData = Array.from({ length: 8 }, (_, i) => {
    const h = (i * 3).toString().padStart(2, "0") + ":00";
    return { hour: h, count: hourCounts[h] ?? 0 };
  });

  const confidenceTrend = history
    .slice(0, 15)
    .reverse()
    .map((r, i) => ({ index: i + 1, confidence: r.confidence }));

  return {
    total: history.length,
    todayCount: todayRecords.length,
    avgConfidence,
    topGesture,
    topLang: LANG_LABELS[topLang] ?? topLang,
    languageDist,
    gestureDist,
    hourlyData,
    confidenceTrend,
  };
}

const MOCK_STATS: Stats = {
  total: 284,
  todayCount: 47,
  avgConfidence: 95,
  topGesture: "HELLO",
  topLang: "English",
  languageDist: [
    { name: "English", value: 140, flag: "🇬🇧" },
    { name: "Tamil", value: 72, flag: "🇮🇳" },
    { name: "Hindi", value: 52, flag: "🇮🇳" },
    { name: "French", value: 20, flag: "🇫🇷" },
  ],
  gestureDist: [
    { name: "HELLO", count: 58 },
    { name: "THANK YOU", count: 42 },
    { name: "I LOVE YOU", count: 35 },
    { name: "YES", count: 28 },
    { name: "GOOD", count: 24 },
    { name: "NO", count: 19 },
    { name: "HELP", count: 15 },
    { name: "SORRY", count: 12 },
  ],
  hourlyData: [
    { hour: "00:00", count: 2 },
    { hour: "03:00", count: 5 },
    { hour: "06:00", count: 18 },
    { hour: "09:00", count: 42 },
    { hour: "12:00", count: 38 },
    { hour: "15:00", count: 55 },
    { hour: "18:00", count: 67 },
    { hour: "21:00", count: 31 },
  ],
  confidenceTrend: Array.from({ length: 12 }, (_, i) => ({
    index: i + 1,
    confidence: 90 + Math.floor(Math.random() * 9),
  })),
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass border border-primary/20 rounded-lg px-3 py-2 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">{payload[0].value}{payload[0].name === "confidence" ? "%" : " signs"}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>(MOCK_STATS);

  useEffect(() => {
    const real = buildStats();
    if (real.total > 0) setStats(real);
  }, []);

  const metricCards = [
    { label: "Total Translations", value: stats.total.toString(), icon: Hand, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { label: "Today's Signs", value: stats.todayCount.toString(), icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
    { label: "Avg Confidence", value: stats.avgConfidence + "%", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
    { label: "Top Sign", value: stats.topGesture, icon: Award, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
    { label: "Top Language", value: stats.topLang, icon: Globe, color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/20" },
    { label: "Supported Signs", value: GESTURE_DATABASE.length.toString(), icon: Zap, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  ];

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">AI Analytics Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time insights into gesture recognition performance and usage patterns.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {metricCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className={`glass rounded-xl p-4 border ${m.bg} flex flex-col gap-2`}>
                <div className={`w-7 h-7 rounded-lg ${m.bg} border flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
                <div className={`font-display text-xl font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Gesture Usage */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="font-display font-semibold mb-1">Top Gestures Detected</h3>
            <p className="text-xs text-muted-foreground mb-5">Most frequently recognized signs</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.gestureDist} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  angle={-35}
                  textAnchor="end"
                  height={48}
                  interval={0}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.gestureDist.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Confidence Trend */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="font-display font-semibold mb-1">AI Confidence Trend</h3>
            <p className="text-xs text-muted-foreground mb-5">Recognition accuracy over last 12 detections</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.confidenceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="index" tick={{ fill: "#64748b", fontSize: 10 }} label={{ value: "Detection #", position: "insideBottom", fill: "#64748b", fontSize: 10, dy: 8 }} />
                <YAxis domain={[80, 100]} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#00ffff"
                  strokeWidth={2}
                  dot={{ fill: "#00ffff", r: 3 }}
                  activeDot={{ r: 5, fill: "#00ffff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hourly Usage */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-border">
            <h3 className="font-display font-semibold mb-1">Hourly Activity</h3>
            <p className="text-xs text-muted-foreground mb-5">Signs translated throughout the day</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.hourlyData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#00ffff" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Language Distribution */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="font-display font-semibold mb-1">Language Usage</h3>
            <p className="text-xs text-muted-foreground mb-4">Translation language distribution</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={stats.languageDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.languageDist.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {stats.languageDist.map((l, i) => (
                <div key={l.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{l.flag} {l.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
