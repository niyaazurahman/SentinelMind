import React, { useState } from "react";
import {
  Activity,
  Heart,
  Moon,
  Clock,
  Smile,
  Compass,
  Zap,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { FacialStressWebcam, LiveFacialMetrics } from "../components/webcam/FacialStressWebcam";

export const PersonnelDashboardPage: React.FC = () => {
  // Self Assessment form state
  const [moodScore, setMoodScore] = useState<number>(7);
  const [sleepQuality, setSleepQuality] = useState<number>(6);
  const [stressRating, setStressRating] = useState<number>(4);
  const [wellnessNotes, setWellnessNotes] = useState<string>("Mild fatigue following continuous 10h tactical watch.");

  // Duty Monitoring form state
  const [dutyHours, setDutyHours] = useState<number>(8.5);
  const [shiftType, setShiftType] = useState<string>("DAY");
  const [consecutiveDays, setConsecutiveDays] = useState<number>(4);
  const [daysSinceLeave, setDaysSinceLeave] = useState<number>(18);

  // Latest combined assessment state
  const [latestAssessment, setLatestAssessment] = useState({
    currentStress: 34.2,
    forecast7d: 38.0,
    forecast30d: 42.5,
    category: "AMBER",
    baseline7dDelta: +4.2,
    baseline30dDelta: +6.5,
    anomalies: [
      { type: "FATIGUE_SPIKE", desc: "Elevated eye closure ratio detected during evening shift." },
    ],
    shap: [
      { name: "Poor Sleep", pct: 35 },
      { name: "Low Mood", pct: 25 },
      { name: "Facial Fatigue", pct: 20 },
      { name: "High Duty Hours", pct: 15 },
    ],
  });

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleAssessmentComplete = (metrics: LiveFacialMetrics) => {
    const combinedStress = Math.min(
      100,
      metrics.currentStressScore * 0.4 +
        (11 - moodScore) * 3.5 +
        (11 - sleepQuality) * 3.0 +
        (dutyHours / 16) * 15
    );
    const cat = combinedStress <= 30 ? "GREEN" : combinedStress <= 60 ? "AMBER" : "RED";

    setLatestAssessment((prev) => ({
      ...prev,
      currentStress: parseFloat(combinedStress.toFixed(1)),
      forecast7d: parseFloat((combinedStress * 1.08).toFixed(1)),
      forecast30d: parseFloat((combinedStress * 1.15).toFixed(1)),
      category: cat,
      baseline7dDelta: parseFloat((combinedStress - 28.0).toFixed(1)),
      baseline30dDelta: parseFloat((combinedStress - 26.5).toFixed(1)),
    }));
    setSubmittedMessage("Vision assessment and clinical logs synchronized successfully.");
    setTimeout(() => setSubmittedMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono px-3 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                ACTIVE OPERATOR // BIOMETRIC VERIFIED
              </span>
              <span className="text-xs font-mono text-slate-300">MIL-84910 // CPT MARCUS BRODY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              Personnel Wellness & Facial Stress Portal
            </h1>
            <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-2xl">
              Personalized health analytics, real-time webcam facial scans, and self-assessment logging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl glass-panel-subtle border border-cyan-500/20 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase font-sans">Current Stress Score</div>
              <div
                className={`text-2xl font-extrabold ${
                  latestAssessment.category === "RED"
                    ? "text-rose-400"
                    : latestAssessment.category === "AMBER"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {latestAssessment.currentStress} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-4 h-4" /> {submittedMessage}
        </div>
      )}

      {/* 1. WEBCAM FACIAL ANALYSIS COMPONENT */}
      <FacialStressWebcam onAssessmentComplete={handleAssessmentComplete} />

      {/* 2. FORECASTS & PERSONALIZED BASELINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 glass-panel glass-card-hover rounded-2xl border border-cyan-500/20">
          <div className="text-xs text-slate-400 uppercase font-sans font-semibold text-cyan-400">7-Day Risk Forecast</div>
          <div className="text-2xl font-extrabold text-white mt-1">{latestAssessment.forecast7d} / 100</div>
          <div className="text-[11px] text-cyan-300 mt-1 flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" /> Slight compounding fatigue expected
          </div>
        </div>

        <div className="p-5 glass-panel glass-card-hover rounded-2xl border border-teal-500/20">
          <div className="text-xs text-slate-400 uppercase font-sans font-semibold text-teal-400">30-Day Risk Forecast</div>
          <div className="text-2xl font-extrabold text-white mt-1">{latestAssessment.forecast30d} / 100</div>
          <div className="text-[11px] text-slate-300 mt-1 font-sans">
            Longitudinal burnout projection
          </div>
        </div>

        <div className="p-5 glass-panel glass-card-hover rounded-2xl border border-emerald-500/20">
          <div className="text-xs text-slate-400 uppercase font-sans font-semibold text-emerald-400">vs 7-Day Baseline</div>
          <div className={`text-2xl font-extrabold mt-1 ${latestAssessment.baseline7dDelta > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {latestAssessment.baseline7dDelta > 0 ? `+${latestAssessment.baseline7dDelta}` : latestAssessment.baseline7dDelta} pts
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-sans">
            Personal norm: 28.0
          </div>
        </div>

        <div className="p-5 glass-panel glass-card-hover rounded-2xl border border-blue-500/20">
          <div className="text-xs text-slate-400 uppercase font-sans font-semibold text-blue-400">vs 30-Day Baseline</div>
          <div className={`text-2xl font-extrabold mt-1 ${latestAssessment.baseline30dDelta > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {latestAssessment.baseline30dDelta > 0 ? `+${latestAssessment.baseline30dDelta}` : latestAssessment.baseline30dDelta} pts
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-sans">
            Personal norm: 26.5
          </div>
        </div>
      </div>

      {/* 3. DUAL FORMS: SELF-ASSESSMENT & DUTY MONITORING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Self-Assessment Module */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-cyan-500/25 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-cyan-900/30">
            <Smile className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider font-sans">
              Self-Assessment Module
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-sans">
                <span>Subjective Mood Score (1-10)</span>
                <span className="text-cyan-300 font-bold font-mono">{moodScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={moodScore}
                onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-sans">
                <span>Sleep Quality Rating (1-10)</span>
                <span className="text-teal-300 font-bold font-mono">{sleepQuality} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-sans">
                <span>Self-Perceived Stress Rating (1-10)</span>
                <span className="text-amber-300 font-bold font-mono">{stressRating} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressRating}
                onChange={(e) => setStressRating(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-sans">Confidential Wellness Notes</label>
              <textarea
                value={wellnessNotes}
                onChange={(e) => setWellnessNotes(e.target.value)}
                rows={2}
                className="w-full glass-panel-subtle border border-cyan-500/20 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-400 font-sans text-xs transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Duty Monitoring Module */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-cyan-500/25 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-cyan-900/30">
            <Clock className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider font-sans">
              Duty Monitoring Module
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-sans">
                <span>Logged Duty Hours</span>
                <span className="text-teal-300 font-bold font-mono">{dutyHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="4"
                max="18"
                step="0.5"
                value={dutyHours}
                onChange={(e) => setDutyHours(parseFloat(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1.5 font-sans">Shift Type</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full glass-panel-subtle border border-cyan-500/20 rounded-xl px-3 py-2 text-slate-200 font-sans text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="DAY">DAY WATCH</option>
                  <option value="NIGHT">NIGHT PATROL</option>
                  <option value="EXTENDED_RECON">EXTENDED RECON</option>
                  <option value="24H_GUARD">24H COMMAND GUARD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-sans">Consecutive Days</label>
                <input
                  type="number"
                  value={consecutiveDays}
                  onChange={(e) => setConsecutiveDays(parseInt(e.target.value, 10))}
                  className="w-full glass-panel-subtle border border-cyan-500/20 rounded-xl px-3 py-2 text-slate-200 font-sans text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-sans">Days Since Last Approved Leave</label>
              <input
                type="number"
                value={daysSinceLeave}
                onChange={(e) => setDaysSinceLeave(parseInt(e.target.value, 10))}
                className="w-full glass-panel-subtle border border-cyan-500/20 rounded-xl px-3 py-2 text-slate-200 font-sans text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
