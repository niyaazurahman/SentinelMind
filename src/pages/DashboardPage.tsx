import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Download,
  Filter,
  Heart,
  Layers,
  Moon,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 1. Longitudinal Stress Trends (7 Days + 48h Predictive Forecast)
const STRESS_TREND_DATA = [
  { time: "Day 1", stress: 24.5, amberThreshold: 30, redThreshold: 60, projected: 24.5 },
  { time: "Day 2", stress: 28.2, amberThreshold: 30, redThreshold: 60, projected: 28.2 },
  { time: "Day 3 (Shift)", stress: 36.4, amberThreshold: 30, redThreshold: 60, projected: 36.4 },
  { time: "Day 4", stress: 44.8, amberThreshold: 30, redThreshold: 60, projected: 44.8 },
  { time: "Day 5 (High Duty)", stress: 58.1, amberThreshold: 30, redThreshold: 60, projected: 58.1 },
  { time: "Day 6", stress: 52.3, amberThreshold: 30, redThreshold: 60, projected: 52.3 },
  { time: "Day 7 (Today)", stress: 41.5, amberThreshold: 30, redThreshold: 60, projected: 41.5 },
  { time: "+12h (Forecast)", stress: null, amberThreshold: 30, redThreshold: 60, projected: 38.2 },
  { time: "+24h (Forecast)", stress: null, amberThreshold: 30, redThreshold: 60, projected: 33.0 },
  { time: "+48h (Forecast)", stress: null, amberThreshold: 30, redThreshold: 60, projected: 28.5 },
];

// 2. Sleep Trends (Hours logged vs 7.5h Target)
const SLEEP_TREND_DATA = [
  { day: "Mon", recorded: 7.2, target: 7.5 },
  { day: "Tue", recorded: 6.8, target: 7.5 },
  { day: "Wed", recorded: 5.1, target: 7.5 },
  { day: "Thu", recorded: 4.4, target: 7.5 },
  { day: "Fri", recorded: 3.8, target: 7.5 },
  { day: "Sat", recorded: 5.6, target: 7.5 },
  { day: "Sun", recorded: 6.9, target: 7.5 },
];

// 3. HRV Vagal Trends (RMSSD in ms)
const HRV_TREND_DATA = [
  { time: "0000", hrv: 62, optimalFloor: 50 },
  { time: "0400", hrv: 58, optimalFloor: 50 },
  { time: "0800", hrv: 46, optimalFloor: 50 },
  { time: "1200", hrv: 34, optimalFloor: 50 },
  { time: "1600", hrv: 26, optimalFloor: 50 },
  { time: "2000", hrv: 38, optimalFloor: 50 },
  { time: "2359", hrv: 49, optimalFloor: 50 },
];

// 4. SHAP Feature Attributions
const PREDICTION_SHAP_DATA = [
  { factor: "Poor Sleep", impact: 32, fill: "#06b6d4" },
  { factor: "High Duty Hours", impact: 24, fill: "#14b8a6" },
  { factor: "Low HRV", impact: 18, fill: "#3b82f6" },
  { factor: "Incident Exposure", impact: 14, fill: "#2dd4bf" },
  { factor: "Depressed Mood", impact: 12, fill: "#60a5fa" },
];

// 5. Squad Echelon Stress Heatmap (7 Squads across 7 days)
const SQUAD_NAMES = [
  "Alpha 1 (Forward Recon)",
  "Alpha 2 (Assault Platoon)",
  "Bravo 1 (Air Support)",
  "Bravo 2 (Heavy Weapon)",
  "Charlie 1 (Drone Recon)",
  "Charlie 2 (Communications)",
  "HQ Support Section",
];

const DAYS_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SQUAD_HEATMAP_GRID = [
  [22, 28, 64, 82, 88, 71, 48],
  [18, 25, 52, 74, 79, 65, 38],
  [15, 18, 32, 48, 55, 42, 24],
  [19, 22, 44, 62, 68, 51, 29],
  [24, 29, 38, 51, 58, 44, 27],
  [14, 16, 22, 31, 35, 28, 19],
  [12, 14, 18, 24, 26, 20, 15],
];

const getHeatmapColor = (score: number) => {
  if (score <= 30) return "bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  if (score <= 60) return "bg-amber-950/60 text-amber-300 border-amber-500/30 hover:bg-amber-900/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
  return "bg-rose-950/70 text-rose-300 border-rose-500/40 hover:bg-rose-900/70 font-bold shadow-[0_0_15px_rgba(244,63,94,0.25)]";
};

// 6. Personnel Roster
const PERSONNEL_ROSTER = [
  {
    id: "p1",
    militaryId: "MIL-84910",
    name: "Marcus Brody",
    rank: "CAPTAIN",
    unit: "7-CAV-A",
    role: "Company Commander",
    sleep: 3.5,
    hrv: 18.2,
    rhr: 86,
    duty: 15.5,
    score: 84.2,
    tier: "RED",
  },
  {
    id: "p2",
    militaryId: "MIL-77219",
    name: "Elena Rostova",
    rank: "SERGEANT",
    unit: "7-CAV-B",
    role: "Combat Medic",
    sleep: 4.2,
    hrv: 24.0,
    rhr: 82,
    duty: 14.0,
    score: 76.5,
    tier: "RED",
  },
  {
    id: "p3",
    militaryId: "MIL-90311",
    name: "David Sterling",
    rank: "LIEUTENANT",
    unit: "7-CAV-A",
    role: "Platoon Leader",
    sleep: 5.8,
    hrv: 42.5,
    rhr: 68,
    duty: 10.5,
    score: 54.0,
    tier: "AMBER",
  },
  {
    id: "p4",
    militaryId: "MIL-62104",
    name: "James Morales",
    rank: "SPECIALIST",
    unit: "7-CAV-C",
    role: "Drone Operator",
    sleep: 6.1,
    hrv: 49.0,
    rhr: 64,
    duty: 9.0,
    score: 42.1,
    tier: "AMBER",
  },
  {
    id: "p5",
    militaryId: "MIL-54129",
    name: "Sarah Chen",
    rank: "MAJOR",
    unit: "HQ-TAC",
    role: "Intelligence Officer",
    sleep: 7.8,
    hrv: 68.0,
    rhr: 56,
    duty: 7.5,
    score: 18.5,
    tier: "GREEN",
  },
  {
    id: "p6",
    militaryId: "MIL-33821",
    name: "Thomas Wright",
    rank: "CORPORAL",
    unit: "7-CAV-B",
    role: "Signal Specialist",
    sleep: 7.4,
    hrv: 65.5,
    rhr: 59,
    duty: 8.0,
    score: 22.0,
    tier: "GREEN",
  },
];

export const DashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [selectedCell, setSelectedCell] = useState<{ squad: string; day: string; score: number } | null>(null);

  const filteredRoster = PERSONNEL_ROSTER.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.militaryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rank.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "ALL" || p.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. FUTURISTIC HEALTHTECH BANNER & READINESS HUD
      ===================================================================== */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium glass-panel-subtle text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                NATO CLINICAL TELEMETRY STREAM // 7TH AIR CAVALRY
              </span>
              <span className="text-xs font-mono text-teal-300 glass-panel-subtle px-3 py-0.5 rounded-full border border-teal-500/30">
                AES-256 ENCRYPTED EHR
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              SentinelMind Medical AI & Force Readiness Command
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
              Multi-variate predictive stress analytics integrating real-time facial biometrics, continuous wearable telemetry, and automated clinical stand-down triage.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl glass-panel-subtle border border-cyan-500/20 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-sans">
                Force Combat Readiness
              </div>
              <div className="text-2xl font-extrabold text-cyan-300 font-mono tracking-tight flex items-center justify-end gap-1">
                92.4%
                <span className="text-xs font-normal text-slate-400 font-sans">OPTIMAL</span>
              </div>
            </div>

            <div className="px-5 py-3 rounded-2xl glass-panel-subtle border border-cyan-500/20 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-sans">
                Active Telemetry Feeds
              </div>
              <div className="text-2xl font-extrabold text-teal-300 font-mono tracking-tight">
                148 <span className="text-sm text-slate-500 font-normal">/ 150</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. REAL-TIME FACIAL ANALYSIS LIVE FEED PANEL (EXACT USER REQUIREMENT)
      ===================================================================== */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cyan-900/30 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider font-sans">
              Real-Time Facial Analysis Live Feed (MediaPipe & DeepFace)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-700/60 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              Emotion: Neutral (82%) | Fatigue: Medium | Stress: 67% | Attention: High
            </span>
          </div>
        </div>

        {/* 5 Core Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3.5 glass-panel-subtle rounded-xl border border-cyan-500/20">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Current Emotion</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5">Neutral</div>
            <div className="text-[10px] text-slate-500 mt-1">DeepFace Confidence: 82%</div>
          </div>

          <div className="p-3.5 glass-panel-subtle rounded-xl border border-cyan-500/20">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Confidence Score</div>
            <div className="text-base font-bold text-white mt-0.5">82.0%</div>
            <div className="text-[10px] text-emerald-400 mt-1">High Model Certainty</div>
          </div>

          <div className="p-3.5 glass-panel-subtle rounded-xl border border-cyan-500/20">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Fatigue Level</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">Medium</div>
            <div className="text-[10px] text-slate-500 mt-1">EAR Eye Closure: 18.5%</div>
          </div>

          <div className="p-3.5 glass-panel-subtle rounded-xl border border-cyan-500/20">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Stress Level</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">67% <span className="text-xs font-normal">(High)</span></div>
            <div className="text-[10px] text-rose-400/80 mt-1">Brow Tension: 74/100</div>
          </div>

          <div className="p-3.5 glass-panel-subtle rounded-xl border border-cyan-500/20">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Attention Level</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">High</div>
            <div className="text-[10px] text-slate-500 mt-1">Gaze Stability: 94%</div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. FUTURISTIC CARDS: STRESS SCORE, FATIGUE, WELLNESS, RISK FORECAST
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stress Score */}
        <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-cyan-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono">
            <span className="text-xs uppercase tracking-wider font-sans font-semibold text-cyan-400">Stress Score</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1.5">
            41.5 <span className="text-xs font-normal text-slate-400 font-sans">/ 100</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span className="text-cyan-300 font-bold">Moderate Load</span>
            <span className="text-slate-500">Amber Ceiling: 60</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full rounded-full" style={{ width: "41.5%" }} />
          </div>
        </div>

        {/* Card 2: Fatigue Score */}
        <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-teal-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono">
            <span className="text-xs uppercase tracking-wider font-sans font-semibold text-teal-400">Fatigue Score</span>
            <Moon className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1.5">
            48.0 <span className="text-xs font-normal text-slate-400 font-sans">/ 100</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span className="text-teal-300 font-bold">Medium Fatigue</span>
            <span className="text-slate-500">Blinks: 18 BPM</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full" style={{ width: "48%" }} />
          </div>
        </div>

        {/* Card 3: Wellness Index */}
        <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono">
            <span className="text-xs uppercase tracking-wider font-sans font-semibold text-emerald-400">Wellness Index</span>
            <Heart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono flex items-baseline gap-1.5">
            86.2 <span className="text-xs font-normal text-slate-400 font-sans">/ 100</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span className="text-emerald-300 font-bold">Homeostasis Stable</span>
            <span className="text-slate-500">124 Operators Green</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full" style={{ width: "86.2%" }} />
          </div>
        </div>

        {/* Card 4: Risk Forecast */}
        <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-blue-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2 font-mono">
            <span className="text-xs uppercase tracking-wider font-sans font-semibold text-blue-400">Risk Forecast (48h)</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-300 font-mono flex items-baseline gap-1.5">
            28.5 <span className="text-xs font-normal text-slate-400 font-sans">(-13.0 pts)</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span className="text-blue-300 font-bold">XGBoost Trajectory</span>
            <span className="text-emerald-400">De-escalation Expected</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full" style={{ width: "28.5%" }} />
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. MODERN HEALTHCARE CHARTS: STRESS TRAJECTORY & SHAP EXPLAINABILITY
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stress Trends AreaChart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white font-sans">
                  Battalion Stress Trajectory & 48h Predictive Forecast
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Observed mean stress index with clinical triage zones (Green ≤30, Amber ≤60, Red &gt;60)
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 glass-panel-subtle border border-cyan-500/30 px-3 py-1 rounded-full">
              RECHARTS PRO
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={STRESS_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.6)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 20, 36, 0.9)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(34, 211, 238, 0.3)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "#f8fafc",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" label={{ value: "GREEN CEILING (30)", fill: "#10b981", fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "RED THRESHOLD (60)", fill: "#f43f5e", fontSize: 10 }} />
                <Area type="monotone" dataKey="stress" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#stressGrad)" name="Recorded Stress" />
                <Area type="monotone" dataKey="projected" stroke="#2dd4bf" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#projectedGrad)" name="XGBoost Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SHAP Feature Decomposition */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-sans">
                SHAP Risk Factor Decomposition
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Top predictive drivers for elevated stress across monitored battalion
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={PREDICTION_SHAP_DATA} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.6)" horizontal={false} />
                <XAxis type="number" domain={[0, 40]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                <YAxis dataKey="factor" type="category" stroke="#64748b" tick={{ fill: "#cbd5e1", fontSize: 11, fontFamily: "monospace" }} width={95} />
                <Tooltip
                  formatter={(val: any) => [`+${val}% Contribution`, "SHAP Impact"]}
                  contentStyle={{
                    backgroundColor: "rgba(10, 20, 36, 0.9)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(34, 211, 238, 0.3)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                  {PREDICTION_SHAP_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. SLEEP DEFICIT & HRV AUTONOMIC RECOVERY CHARTS
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Deficit Tracking */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-base font-bold text-white font-sans">Battalion Sleep Deficit Tracking</h3>
                <p className="text-xs text-slate-400 font-mono">Logged sleep hours vs 7.5h restorative benchmark</p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-300 glass-panel-subtle px-3 py-1 rounded-full border border-cyan-500/30">
              MEAN: 5.7h
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SLEEP_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.6)" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[0, 10]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 20, 36, 0.9)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(34, 211, 238, 0.3)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine y={7.5} stroke="#2dd4bf" strokeDasharray="4 4" label={{ value: "TARGET (7.5h)", fill: "#2dd4bf", fontSize: 10 }} />
                <Bar dataKey="recorded" fill="#0891b2" radius={[6, 6, 0, 0]} name="Logged Sleep (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HRV Autonomic Recovery */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-base font-bold text-white font-sans">HRV Autonomic Recovery (24h RMSSD)</h3>
                <p className="text-xs text-slate-400 font-mono">Parasympathetic vagal tone dynamics & combat suppression</p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 glass-panel-subtle px-3 py-1 rounded-full border border-emerald-500/30">
              BASE: 58ms
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HRV_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.6)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[10, 80]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 20, 36, 0.9)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(34, 211, 238, 0.3)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine y={50} stroke="#10b981" strokeDasharray="4 4" label={{ value: "NORMAL FLOOR (50ms)", fill: "#10b981", fontSize: 10 }} />
                <ReferenceLine y={25} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "CRITICAL VAGAL COLLAPSE (25ms)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="hrv" stroke="#22d3ee" strokeWidth={3} dot={{ fill: "#22d3ee", r: 4 }} name="RMSSD (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =====================================================================
          6. SQUAD FATIGUE HEATMAP (7 SQUADS × 7 DAYS)
      ===================================================================== */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-sans">
                Operational Echelon Fatigue Heatmap (7 Squads × 7 Days)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              NATO stress classification: Green (≤30), Amber (31-60), Red (&gt;60). Click any cell to inspect squad vitals.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> 0-30 Green
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 31-60 Amber
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> 61-100 Red
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-cyan-900/30 text-xs font-mono text-slate-400">
                <th className="py-2.5 px-3 text-left font-sans font-semibold">Squad / Echelon Unit</th>
                {DAYS_HEADER.map((day) => (
                  <th key={day} className="py-2.5 px-3 font-semibold uppercase">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {SQUAD_NAMES.map((squadName, sIdx) => (
                <tr key={squadName} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-left font-sans font-medium text-slate-200 text-xs">
                    {squadName}
                  </td>
                  {SQUAD_HEATMAP_GRID[sIdx].map((score, dIdx) => (
                    <td key={dIdx} className="p-1">
                      <button
                        onClick={() => setSelectedCell({ squad: squadName, day: DAYS_HEADER[dIdx], score })}
                        className={`w-full py-2 px-1 rounded-lg border transition-all text-xs ${getHeatmapColor(score)}`}
                        title={`${squadName} on ${DAYS_HEADER[dIdx]}: Score ${score}`}
                      >
                        {score}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCell && (
          <div className="p-3.5 glass-panel-subtle rounded-xl border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Selected Echelon: </span>
              <strong className="text-white font-sans">{selectedCell.squad}</strong> ({selectedCell.day})
              <span className="mx-2 text-slate-600">|</span>
              <span>Stress Index: </span>
              <strong className={selectedCell.score > 60 ? "text-rose-400" : selectedCell.score > 30 ? "text-amber-400" : "text-emerald-400"}>
                {selectedCell.score} / 100 ({selectedCell.score > 60 ? "RED" : selectedCell.score > 30 ? "AMBER" : "GREEN"})
              </strong>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          7. PERSONNEL TABLE & REAL-TIME INCIDENT ALERT PANEL
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personnel Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                <Users className="w-5 h-5 text-cyan-400" />
                Active Monitored Personnel Table
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Current physiological telemetry and assigned stress triage tier
              </p>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              {(["ALL", "RED", "AMBER", "GREEN"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    tierFilter === t
                      ? t === "RED"
                        ? "bg-rose-950 text-rose-300 border border-rose-600 font-bold"
                        : t === "AMBER"
                        ? "bg-amber-950 text-amber-300 border border-amber-600 font-bold"
                        : t === "GREEN"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold"
                        : "bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold"
                      : "glass-panel-subtle text-slate-400 hover:text-slate-200 border-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="glass-panel-subtle border-b border-cyan-900/30 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Sleep</th>
                  <th className="py-2.5 px-3">HRV</th>
                  <th className="py-2.5 px-3">RHR</th>
                  <th className="py-2.5 px-3">Duty</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRoster.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{p.rank} // {p.militaryId}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{p.unit}</td>
                    <td className="py-3 px-3">
                      <span className={p.sleep < 5.0 ? "text-rose-400 font-bold" : "text-slate-300"}>
                        {p.sleep}h
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={p.hrv < 30 ? "text-rose-400 font-bold" : "text-slate-300"}>
                        {p.hrv}ms
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.rhr} bpm</td>
                    <td className="py-3 px-3">
                      <span className={p.duty >= 14 ? "text-amber-400 font-bold" : "text-slate-300"}>
                        {p.duty}h
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          p.tier === "RED"
                            ? "bg-rose-950 text-rose-300 border-rose-800"
                            : p.tier === "AMBER"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-emerald-950 text-emerald-300 border-emerald-800"
                        }`}
                      >
                        {p.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="px-3 py-1 text-[11px] glass-panel-subtle hover:bg-slate-800 text-cyan-300 rounded-lg border border-cyan-500/30 transition-colors">
                        Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Alert Incident Queue */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-900/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white font-sans">Active Clinical Triage</h2>
            </div>
            <span className="text-xs font-mono text-rose-300 bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-700/60 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]">
              3 ESCALATED
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {/* Critical Alert 1 */}
            <div className="p-4 rounded-xl glass-panel-subtle border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold">RED TIER // SCORE: 84.2</span>
                <span className="text-slate-500 text-[10px]">12m ago</span>
              </div>
              <div className="text-sm font-semibold text-white font-sans">CPT Marcus Brody</div>
              <div className="text-xs text-slate-300 leading-snug font-sans">
                HRV collapse (18.2ms) with 15.5h duty shift logged. Critical autonomic strain.
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  Acknowledge
                </button>
                <button className="px-3 py-1 glass-panel-subtle text-slate-300 text-[11px] rounded-lg border border-slate-700">
                  Stand-Down Order
                </button>
              </div>
            </div>

            {/* Critical Alert 2 */}
            <div className="p-4 rounded-xl glass-panel-subtle border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold">RED TIER // SCORE: 76.5</span>
                <span className="text-slate-500 text-[10px]">38m ago</span>
              </div>
              <div className="text-sm font-semibold text-white font-sans">SGT Elena Rostova</div>
              <div className="text-xs text-slate-300 leading-snug font-sans">
                Acute sleep drop (4.2h) with low mood rating (3/10). Medical check advised.
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  Acknowledge
                </button>
                <button className="px-3 py-1 glass-panel-subtle text-slate-300 text-[11px] rounded-lg border border-slate-700">
                  Welfare Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
