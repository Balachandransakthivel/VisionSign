import { useState, useEffect } from "react";
import { Clock, Trash2, Download, Search, Volume2, Globe, Filter } from "lucide-react";
import { toast } from "sonner";
import { getHistory, clearHistory, speakText, LANGUAGES, type TranslationRecord } from "@/lib/gestureData";

const LANG_MAP: Record<string, string> = { en: "English", ta: "Tamil", hi: "Hindi", fr: "French" };
const LANG_FLAGS: Record<string, string> = { en: "🇬🇧", ta: "🇮🇳", hi: "🇮🇳", fr: "🇫🇷" };

export default function History() {
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("all");

  useEffect(() => {
    setRecords(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setRecords([]);
    toast.success("History cleared.");
  };

  const handleSpeak = (text: string) => {
    speakText(text);
    toast.info(`Speaking: "${text}"`);
  };

  const handleExport = () => {
    const csv = [
      ["Time", "Sign", "Text", "Translation", "Language", "Confidence"].join(","),
      ...records.map((r) =>
        [
          new Date(r.timestamp).toLocaleString(),
          r.gesture,
          r.text,
          r.translatedText,
          LANG_MAP[r.language] ?? r.language,
          r.confidence + "%",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visionsign_history.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("History exported as CSV.");
  };

  const filtered = records.filter((r) => {
    const matchSearch =
      r.gesture.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase()) ||
      r.translatedText.toLowerCase().includes(search.toLowerCase());
    const matchLang = filterLang === "all" || r.language === filterLang;
    return matchSearch && matchLang;
  });

  const groupByDate = (records: TranslationRecord[]) => {
    const groups: Record<string, TranslationRecord[]> = {};
    records.forEach((r) => {
      const key = new Date(r.timestamp).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Translation History</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {records.length} translation{records.length !== 1 ? "s" : ""} recorded
            </p>
          </div>

          <div className="flex gap-2">
            {records.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm hover:bg-rose-500/25 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search signs or translations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="glass border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="all" className="bg-card">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-card">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Records */}
        {records.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center border border-border">
            <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No History Yet</h3>
            <p className="text-sm text-muted-foreground">
              Start translating signs on the Translator page — your history will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border">
            <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No results match your search.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayRecords]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-xs text-muted-foreground font-medium">{date}</div>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground">{dayRecords.length} signs</span>
                </div>
                <div className="space-y-2">
                  {dayRecords.map((record) => (
                    <div
                      key={record.id}
                      className="glass rounded-xl p-4 border border-border hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl flex-shrink-0">{record.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-display font-semibold text-sm">{record.gesture}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono">
                              {record.confidence}%
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-border text-muted-foreground">
                              {LANG_FLAGS[record.language]} {LANG_MAP[record.language]}
                            </span>
                          </div>
                          <div className="font-display text-base font-bold text-foreground mb-0.5">
                            {record.translatedText}
                          </div>
                          {record.translatedText !== record.text && (
                            <div className="text-xs text-muted-foreground">{record.text}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            onClick={() => handleSpeak(record.translatedText)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Speak translation"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
