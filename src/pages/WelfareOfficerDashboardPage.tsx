import React, { useState } from "react";
import {
  ShieldAlert,
  Users,
  Brain,
  Activity,
  UserCheck,
  CheckCircle,
  Clock,
  HeartHandshake,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  FileCheck,
} from "lucide-react";

interface HighRiskMember {
  id: string;
  name: string;
  rank: string;
  militaryId: string;
  unit: string;
  currentStress: number;
  forecast7d: number;
  category: "RED" | "AMBER";
  facialFatigue: number;
  sleepDeficit: number;
  dutyHours: number;
  shap: { factor: string; pct: number }[];
  recommendedIntervention: string;
}

const HIGH_RISK_PERSONNEL: HighRiskMember[] = [
  {
    id: "hr1",
    name: "Marcus Brody",
    rank: "CAPTAIN",
    militaryId: "MIL-84910",
    unit: "7-CAV-A",
    currentStress: 84.2,
    forecast7d: 89.0,
    category: "RED",
    facialFatigue: 78.5,
    sleepDeficit: 3.7,
    dutyHours: 15.5,
    shap: [
      { factor: "Poor Sleep", pct: 35 },
      { factor: "Low Mood", pct: 25 },
      { factor: "Facial Fatigue", pct: 20 },
      { factor: "High Duty Hours", pct: 15 },
    ],
    recommendedIntervention: "MANDATORY_STAND_DOWN",
  },
  {
    id: "hr2",
    name: "Elena Rostova",
    rank: "SERGEANT",
    militaryId: "MIL-77219",
    unit: "7-CAV-B",
    currentStress: 76.5,
    forecast7d: 81.2,
    category: "RED",
    facialFatigue: 72.0,
    sleepDeficit: 3.2,
    dutyHours: 14.0,
    shap: [
      { factor: "Poor Sleep", pct: 32 },
      { factor: "Facial Fatigue", pct: 28 },
      { factor: "Low Mood", pct: 24 },
      { factor: "High Duty Hours", pct: 16 },
    ],
    recommendedIntervention: "COUNSELLING",
  },
  {
    id: "hr3",
    name: "David Sterling",
    rank: "LIEUTENANT",
    militaryId: "MIL-90311",
    unit: "7-CAV-A",
    currentStress: 54.0,
    forecast7d: 58.5,
    category: "AMBER",
    facialFatigue: 51.0,
    sleepDeficit: 2.1,
    dutyHours: 10.5,
    shap: [
      { factor: "High Duty Hours", pct: 34 },
      { factor: "Poor Sleep", pct: 29 },
      { factor: "Facial Fatigue", pct: 21 },
      { factor: "Low Mood", pct: 16 },
    ],
    recommendedIntervention: "WELLNESS_PROGRAM",
  },
];

export const WelfareOfficerDashboardPage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<HighRiskMember>(HIGH_RISK_PERSONNEL[0]);
  const [issuedStatus, setIssuedStatus] = useState<string | null>(null);

  const handleIssueIntervention = (type: string) => {
    setIssuedStatus(`Official ${type.replace("_", " ")} issued for ${selectedMember.rank} ${selectedMember.name}. Recorded in PostgreSQL & Command Log.`);
    setTimeout(() => setIssuedStatus(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-900/40 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                WELFARE & MEDICAL ESCALATION PORTAL
              </span>
              <span className="text-xs font-mono text-slate-400">THEATER 4-NORTH // UNIT 7-CAV</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Welfare Officer Intervention & Triage Command
            </h1>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Review computer vision fatigue indicators, SHAP risk attributions, and issue clinical stand-down orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Critical Flagged</div>
              <div className="text-2xl font-extrabold text-rose-400">
                5 <span className="text-xs font-normal text-slate-400">OPERATORS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {issuedStatus && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-mono">
          <CheckCircle className="w-4 h-4" /> {issuedStatus}
        </div>
      )}

      {/* Grid: High Risk Personnel Selector + SHAP Deep Dive & Intervention Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: High Risk Force Queue */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-3">
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              High-Risk Personnel Triage
            </h2>

            <div className="space-y-2.5 font-mono text-xs">
              {HIGH_RISK_PERSONNEL.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                    selectedMember.id === m.id
                      ? "bg-rose-950/40 border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                      : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-sans">{m.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        m.category === "RED"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {m.category} // {m.currentStress}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {m.rank} // {m.militaryId} ({m.unit})
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span>Duty: {m.dutyHours}h</span>
                    <span>Sleep Deficit: {m.sleepDeficit}h</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Member SHAP Breakdown & Intervention Protocols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Profile Banner */}
          <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Selected Triage Record</span>
                <h3 className="text-xl font-bold text-white font-sans">
                  {selectedMember.rank} {selectedMember.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  Military ID: {selectedMember.militaryId} | Echelon Unit: {selectedMember.unit}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rose-950 text-rose-400 font-mono font-bold text-xs rounded border border-rose-800">
                  7D FORECAST: {selectedMember.forecast7d} / 100
                </span>
              </div>
            </div>

            {/* SHAP Attributions (Example from user prompt) */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                SHAP Risk Factor Contribution Analysis
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                {selectedMember.shap.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {s.factor} <span className="text-cyan-400">+{s.pct}%</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        {s.factor === "Poor Sleep" && "3.7h restorative deficit"}
                        {s.factor === "Low Mood" && "Reported morale index 3/10"}
                        {s.factor === "Facial Fatigue" && "EAR eye closure drop (0.18)"}
                        {s.factor === "High Duty Hours" && "15.5h continuous shift"}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-400 font-mono">+{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Intervention Decision Engine */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 font-mono">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                Authoritative Intervention Protocols
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => handleIssueIntervention("REST_RECOMMENDATION")}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-rose-800 text-left rounded-xl transition-all group"
                >
                  <div className="font-bold text-rose-300 font-sans">Mandatory 24h Stand-Down</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Relieve from operational duty. Mandatory circadian sleep recovery block.
                  </div>
                  <div className="text-[10px] text-rose-400 mt-2 font-mono flex items-center gap-1">
                    ISSUE STAND-DOWN <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  onClick={() => handleIssueIntervention("COUNSELLING")}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-amber-800 text-left rounded-xl transition-all group"
                >
                  <div className="font-bold text-amber-300 font-sans">Unit Welfare Counselling</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Schedule confidential 1-on-1 psychological assessment with medical officer.
                  </div>
                  <div className="text-[10px] text-amber-400 mt-2 font-mono flex items-center gap-1">
                    SCHEDULE SESSION <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  onClick={() => handleIssueIntervention("WELLNESS_PROGRAM")}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-cyan-800 text-left rounded-xl transition-all group"
                >
                  <div className="font-bold text-cyan-300 font-sans">Circadian Wellness Program</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Enroll in dark-quarters sleep hygiene & tactical bio-recovery regiment.
                  </div>
                  <div className="text-[10px] text-cyan-400 mt-2 font-mono flex items-center gap-1">
                    ENROLL OPERATOR <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button
                  onClick={() => handleIssueIntervention("MEDICAL_REVIEW")}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-700 text-left rounded-xl transition-all group"
                >
                  <div className="font-bold text-slate-200 font-sans">Full Flight Surgeon Review</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Comprehensive physiological check: autonomic ECG, cognitive tests, and clearance.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-1">
                    ORDER MEDICAL REVIEW <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
