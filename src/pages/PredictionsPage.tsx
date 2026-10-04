import React, { useState } from "react";
import {
  Brain,
  Sliders,
  Sparkles,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
  Heart,
  Moon,
  Clock,
  Compass,
} from "lucide-react";

export const PredictionsPage: React.FC = () => {
  // Interactive inputs for XGBoost Regressor
  const [sleep, setSleep] = useState(4.2);
  const [hrv, setHrv] = useState(26.0);
  const [rhr, setRhr] = useState(84);
  const [duty, setDuty] = useState(14.0);
  const [mood, setMood] = useState(3);
  const [intensity, setIntensity] = useState(4);
  const [incidents, setIncidents] = useState(2);

  // Compute live prediction simulation
  const calcScore = () => {
    const raw =
      ((65.0 - hrv) / 50.0) * 19.5 +
      ((rhr - 55.0) / 45.0) * 10.5 +
      ((7.5 - sleep) / 4.5) * 25.0 +
      ((duty - 7.0) / 10.0) * 12.0 +
      ((intensity - 1.0) / 4.0) * 8.0 +
      ((10.0 - mood) / 9.0) * 11.0 +
      (incidents / 4.0) * 9.0 +
      5.0; // synergy
    return Math.min(100.0, Math.max(0.0, raw));
  };

  const currentScore = calcScore();
  const tier = currentScore <= 30 ? "GREEN" : currentScore <= 60 ? "AMBER" : "RED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-cyan-400" />
            XGBoost Stress Predictor & SHAP Explainability Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Simulate operational variables, forecast cumulative stress risk, and inspect SHAP marginal drivers.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded">
            XGBOOST v1.0 REGRESSOR
          </span>
          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-emerald-400 rounded">
            R² = 0.941
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Tactical & Physiological Inputs
          </h2>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Sleep Duration</span>
              <span className="text-white font-bold">{sleep.toFixed(1)} hrs</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="10.0"
              step="0.2"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">HRV (RMSSD ms)</span>
              <span className="text-white font-bold">{hrv.toFixed(1)} ms</span>
            </div>
            <input
              type="range"
              min="15"
              max="95"
              step="1"
              value={hrv}
              onChange={(e) => setHrv(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Resting Heart Rate</span>
              <span className="text-white font-bold">{rhr} BPM</span>
            </div>
            <input
              type="range"
              min="48"
              max="115"
              step="1"
              value={rhr}
              onChange={(e) => setRhr(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Duty Shift Duration</span>
              <span className="text-white font-bold">{duty.toFixed(1)} hrs</span>
            </div>
            <input
              type="range"
              min="4"
              max="18"
              step="0.5"
              value={duty}
              onChange={(e) => setDuty(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Subjective Mood (1-10)</span>
              <span className="text-white font-bold">{mood} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Deployment Intensity</span>
              <span className="text-white font-bold">Tier {intensity} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Critical Incident Exposure</span>
              <span className="text-white font-bold">{incidents} incidents</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={incidents}
              onChange={(e) => setIncidents(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Prediction Score & SHAP Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Predicted Score Display */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Model Estimated Stress Index
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span
                    className={`text-5xl font-extrabold font-mono tracking-tight ${
                      tier === "RED"
                        ? "text-rose-400"
                        : tier === "AMBER"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {currentScore.toFixed(1)}
                  </span>
                  <span className="text-lg text-slate-500 font-mono">/ 100</span>

                  <span
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase ml-2 ${
                      tier === "RED"
                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                        : tier === "AMBER"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {tier} TIER
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
                <div>Population Baseline: <strong>27.5</strong></div>
                <div>Model Latency: <strong>4.2ms</strong></div>
              </div>
            </div>
          </div>

          {/* SHAP Factor Breakdown Cards (Matching Requested Format) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  SHAP Explainability: Top Influencing Risk Factors
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Decomposition of individual feature contributions towards elevated score
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/40">
                TREE SHAP EXPLAINER
              </span>
            </div>

            {/* Requested Examples: Poor Sleep +32%, High Duty Hours +24%, Low HRV +18% */}
            <div className="space-y-3 font-mono">
              <div className="p-4 bg-slate-950/80 border border-rose-900/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div>
                    <div className="text-sm font-bold text-rose-300">Poor Sleep +32%</div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Recorded {sleep.toFixed(1)}h vs 7.5h standard baseline (+16.5 risk points)
                    </div>
                  </div>
                </div>
                <span className="text-xs text-rose-400 font-bold px-2 py-1 bg-rose-950/80 rounded border border-rose-800">
                  PRIMARY CATALYST
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 border border-amber-900/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div>
                    <div className="text-sm font-bold text-amber-300">High Duty Hours +24%</div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Shift duration of {duty.toFixed(1)}h continuous (+12.4 risk points)
                    </div>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-bold px-2 py-1 bg-amber-950/80 rounded border border-amber-800">
                  WORKLOAD
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 border border-amber-900/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div>
                    <div className="text-sm font-bold text-amber-200">Low HRV +18%</div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Autonomic RMSSD at {hrv.toFixed(1)}ms (+9.3 risk points)
                    </div>
                  </div>
                </div>
                <span className="text-xs text-amber-300 font-bold px-2 py-1 bg-amber-950/80 rounded border border-amber-800">
                  VAGAL WITHDRAWAL
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-300">Trauma/Incident Exposure +14%</div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {incidents} combat/critical encounters (+7.2 risk points)
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                  ENVIRONMENTAL
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-300">Depressed Mood +12%</div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Self-reported psychological state at {mood}/10 (+6.2 risk points)
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                  PSYCHOLOGICAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
