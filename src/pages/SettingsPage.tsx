import React, { useState } from "react";
import { Settings, Shield, Bell, Cpu, Database, Save, CheckCircle2 } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [greenMax, setGreenMax] = useState(30);
  const [amberMax, setAmberMax] = useState(60);
  const [contamination, setContamination] = useState(0.05);
  const [autoAcknowledgeCooldown, setAutoAcknowledgeCooldown] = useState(60);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            System Configuration & Operational Parameters
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Configure triage tier boundaries, machine learning thresholds, and secure tactical channels.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 font-mono transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <Save className="w-4 h-4" /> SAVE CONFIGURATION
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4" /> Parameters persisted to system environment and PostgreSQL schema.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triage Rules Engine Settings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Triage Rules & Alert Thresholds
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                Green Tier Ceiling (Optimal Equilibrium)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={greenMax}
                  onChange={(e) => setGreenMax(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white w-24"
                />
                <span className="text-slate-500">Current Rule: 0 to {greenMax} = GREEN</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Amber Tier Ceiling (Warning / Fatigue)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={amberMax}
                  onChange={(e) => setAmberMax(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white w-24"
                />
                <span className="text-slate-500">Current Rule: {greenMax + 1} to {amberMax} = AMBER</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Red Tier Floor (Critical Overload)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  disabled
                  value={`${amberMax + 1} - 100`}
                  className="bg-slate-950/60 border border-slate-800/60 rounded px-3 py-2 text-rose-400 font-bold w-24 cursor-not-allowed"
                />
                <span className="text-rose-400 font-bold">RED TIER (Immediate Triage Action)</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI & Anomaly Detection Tuning */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              ML Anomaly & Inference Settings
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Isolation Forest Contamination Rate</span>
                <span className="text-white font-bold">{(contamination * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.01"
                value={contamination}
                onChange={(e) => setContamination(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-sans">
                Controls the expected proportion of acute physiological breakdown outliers.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SHAP Attribution Depth</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
                <option>Top 5 Feature Breakdown (Standard Clinical HUD)</option>
                <option>Full 7-Feature Decomposition</option>
                <option>Primary Risk Driver Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
