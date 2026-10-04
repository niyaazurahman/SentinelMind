import React, { useState, useEffect } from "react";
import {
  History,
  Calendar,
  Filter,
  Download,
  Search,
  Smile,
  Eye,
  Activity,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
} from "lucide-react";
import { api, HistoryItem } from "../services/api";

const SAMPLE_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    recorded_at: "2026-10-02T23:45:00Z",
    personnel_name: "Marcus Brody",
    rank: "CAPTAIN",
    emotion: "Neutral",
    emotion_confidence: 82.0,
    stress_score: 67.0,
    stress_level: "High",
    fatigue_score: 52.0,
    fatigue_level: "Medium",
    attention_level: "High",
    eye_closure_percentage: 18.5,
    blink_rate: 22.0,
    is_yawning: false,
    head_pitch: -2.4,
    head_yaw: 1.1,
    head_roll: 0.5,
    risk_category: "AMBER",
  },
  {
    id: "h2",
    recorded_at: "2026-10-02T22:30:00Z",
    personnel_name: "Elena Rostova",
    rank: "SERGEANT",
    emotion: "Sad",
    emotion_confidence: 78.0,
    stress_score: 76.5,
    stress_level: "High",
    fatigue_score: 72.0,
    fatigue_level: "High",
    attention_level: "Medium",
    eye_closure_percentage: 42.0,
    blink_rate: 34.0,
    is_yawning: true,
    head_pitch: 12.0,
    head_yaw: 4.5,
    head_roll: 2.1,
    risk_category: "RED",
  },
  {
    id: "h3",
    recorded_at: "2026-10-02T20:15:00Z",
    personnel_name: "David Sterling",
    rank: "LIEUTENANT",
    emotion: "Neutral",
    emotion_confidence: 85.0,
    stress_score: 54.0,
    stress_level: "Medium",
    fatigue_score: 44.0,
    fatigue_level: "Medium",
    attention_level: "High",
    eye_closure_percentage: 14.0,
    blink_rate: 19.5,
    is_yawning: false,
    head_pitch: -1.2,
    head_yaw: 0.8,
    head_roll: 0.0,
    risk_category: "AMBER",
  },
  {
    id: "h4",
    recorded_at: "2026-10-02T18:00:00Z",
    personnel_name: "Sarah Chen",
    rank: "MAJOR",
    emotion: "Happy",
    emotion_confidence: 88.0,
    stress_score: 18.5,
    stress_level: "Low",
    fatigue_score: 22.0,
    fatigue_level: "Low",
    attention_level: "High",
    eye_closure_percentage: 6.0,
    blink_rate: 16.0,
    is_yawning: false,
    head_pitch: 0.0,
    head_yaw: 0.5,
    head_roll: 0.2,
    risk_category: "GREEN",
  },
  {
    id: "h5",
    recorded_at: "2026-10-02T16:20:00Z",
    personnel_name: "Marcus Brody",
    rank: "CAPTAIN",
    emotion: "Angry",
    emotion_confidence: 79.0,
    stress_score: 84.2,
    stress_level: "Critical",
    fatigue_score: 78.0,
    fatigue_level: "High",
    attention_level: "Low",
    eye_closure_percentage: 45.0,
    blink_rate: 38.0,
    is_yawning: true,
    head_pitch: 14.5,
    head_yaw: 5.2,
    head_roll: 3.0,
    risk_category: "RED",
  },
];

export const HistoryPage: React.FC = () => {
  const [historyRecords, setHistoryRecords] = useState<HistoryItem[]>(SAMPLE_HISTORY);
  const [selectedEmotion, setSelectedEmotion] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const records = await api.getAnalysisHistory(undefined, 100);
      if (records && records.length > 0) {
        setHistoryRecords(records);
      }
    } catch (e) {
      console.warn("Using sample historical records (fallback):", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredRecords = historyRecords.filter((rec) => {
    const matchesEmotion = selectedEmotion === "ALL" || rec.emotion.toLowerCase() === selectedEmotion.toLowerCase();
    const matchesTier = selectedTier === "ALL" || rec.risk_category === selectedTier;
    const matchesSearch =
      rec.personnel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rank.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEmotion && matchesTier && matchesSearch;
  });

  const exportCSV = () => {
    const headers = [
      "ID",
      "Timestamp",
      "Personnel",
      "Rank",
      "Emotion",
      "Emotion Confidence",
      "Stress Score",
      "Stress Level",
      "Fatigue Score",
      "Fatigue Level",
      "Attention Level",
      "Eye Closure %",
      "Blink Rate",
      "Yawn Detected",
      "Head Pitch",
      "Head Yaw",
      "Head Roll",
      "Risk Category",
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.recorded_at,
      r.personnel_name,
      r.rank,
      r.emotion,
      r.emotion_confidence,
      r.stress_score,
      r.stress_level,
      r.fatigue_score,
      r.fatigue_level,
      r.attention_level,
      r.eye_closure_percentage,
      r.blink_rate,
      r.is_yawning ? "YES" : "NO",
      r.head_pitch,
      r.head_yaw,
      r.head_roll,
      r.risk_category,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentinelmind_facial_analysis_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                AUDIT ARCHIVE // POSTGRESQL PERSISTENCE
              </span>
              <span className="text-xs font-mono text-slate-400">TABLE: FACIAL_ANALYSIS_RECORDS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2.5">
              <History className="w-6 h-6 text-cyan-400" />
              Facial Analysis History & Emotion Archive
            </h1>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Chronological log of computer vision analysis scans, DeepFace emotion classifications, and fatigue metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV Log
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by operator name or rank..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Emotion Filter */}
          <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
            <span>Emotion:</span>
            <select
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">ALL EMOTIONS</option>
              <option value="Neutral">Neutral</option>
              <option value="Happy">Happy</option>
              <option value="Sad">Sad</option>
              <option value="Angry">Angry</option>
              <option value="Fear">Fear</option>
              <option value="Surprise">Surprise</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
            <span>Tier:</span>
            {(["ALL", "GREEN", "AMBER", "RED"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedTier === t
                    ? t === "RED"
                      ? "bg-rose-950 text-rose-300 border border-rose-600 font-bold"
                      : t === "AMBER"
                      ? "bg-amber-950 text-amber-300 border border-amber-600 font-bold"
                      : t === "GREEN"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold"
                      : "bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Emotion (Confidence)</th>
                <th className="py-3 px-4">Stress (Level)</th>
                <th className="py-3 px-4">Fatigue (Level)</th>
                <th className="py-3 px-4">Attention</th>
                <th className="py-3 px-4">Eye Closure / Blinks</th>
                <th className="py-3 px-4">Head Tilt / Yawn</th>
                <th className="py-3 px-4 text-right">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(rec.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    <div className="text-[10px] text-slate-500">
                      {new Date(rec.recorded_at).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-white">{rec.personnel_name}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{rec.rank}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-white">{rec.emotion}</span>
                    <span className="text-slate-400 text-[11px] ml-1">({rec.emotion_confidence}%)</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`font-bold ${rec.stress_score > 60 ? "text-rose-400" : rec.stress_score > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                      {Math.round(rec.stress_score)}%
                    </span>
                    <span className="text-slate-400 text-[11px] ml-1">({rec.stress_level})</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`font-semibold ${rec.fatigue_level === "High" ? "text-rose-400" : rec.fatigue_level === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>
                      {rec.fatigue_level}
                    </span>
                    <div className="text-[10px] text-slate-500">{rec.fatigue_score}/100</div>
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    <span className="text-emerald-400 font-semibold">{rec.attention_level}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    <div>EAR: {rec.eye_closure_percentage}%</div>
                    <div className="text-[10px] text-slate-500">{rec.blink_rate} BPM</div>
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    <div>P:{rec.head_pitch}° Y:{rec.head_yaw}°</div>
                    <div className={rec.is_yawning ? "text-rose-400 font-bold" : "text-slate-500"}>
                      {rec.is_yawning ? "YAWN DETECTED" : "No yawn"}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        rec.risk_category === "RED"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : rec.risk_category === "AMBER"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {rec.risk_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
