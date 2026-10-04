import React from "react";
import {
  Activity,
  ArrowRight,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  Heart,
  History,
  Lock,
  Moon,
  Radio,
  Scan,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { AppRoute } from "../types/navigation";

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="relative z-10 space-y-16 pb-12">
      {/* =========================================================================
          1. HERO SECTION: AI BRAIN VISUALIZATION + HEALTH PULSE + HEADLINE
      ========================================================================= */}
      <section className="relative pt-6 sm:pt-10 flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
        {/* Floating SIH / DefenseTech Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-cyan-400/30 text-xs font-mono text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] animate-cream-float">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold tracking-wider uppercase">
            NEXT-GEN HEALTHTECH × DEFENSE MEDICAL AI // SIH SHOWCASE EDITION
          </span>
        </div>

        {/* Headline & Subheadline */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Sentinel<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">Mind</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400">Vision</span>
          </h1>
          <p className="text-lg sm:text-2xl font-light text-slate-300 max-w-3xl mx-auto leading-relaxed font-sans">
            AI-Powered Facial Stress Analysis & Predictive Welfare Monitoring for High-Reliability Uniformed Personnel
          </p>
        </div>

        {/* Animated Medical ECG Heartbeat Pulse Bar */}
        <div className="w-full max-w-md h-12 glass-panel rounded-full flex items-center justify-between px-6 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">LIVE AUTONOMIC ECG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold">72 BPM NORMAL</span>
          </div>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("personnel-dashboard")}
            className="cream-button px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 text-slate-950 font-bold text-sm font-sans flex items-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transform hover:-translate-y-0.5 transition-all"
          >
            <Scan className="w-4 h-4 text-slate-950" />
            Launch Live Medical AI Scanner
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate("dashboard")}
            className="cream-button px-6 py-3.5 rounded-xl glass-panel hover:bg-slate-900/80 text-white font-semibold text-sm font-sans flex items-center gap-2 border border-slate-700 hover:border-cyan-400/50 transition-all"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            Command Health Center
          </button>
        </div>

        {/* =========================================================================
            HERO VISUAL: INTERACTIVE AI BRAIN & MEDICAL DASHBOARD PREVIEW
        ========================================================================= */}
        <div className="w-full relative mt-6 pt-4">
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10 pointer-events-none" />

          {/* Futuristic Medical Glass Dashboard Hero Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)] relative overflow-hidden text-left">
            {/* Soft iridescent background sheen */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-20">
              {/* Left Column: AI Brain Visualization */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 glass-panel-subtle rounded-2xl border border-cyan-400/20 text-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* Pulsing Synaptic Rings */}
                  <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-25" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-teal-400/40 animate-spin" style={{ animationDuration: "25s" }} />
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-950 via-teal-900/60 to-slate-900 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                    <Brain className="w-16 h-16 text-cyan-300 animate-pulse" />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <div className="text-base font-bold text-white font-sans flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    DeepFace & MediaPipe Neural Engine
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    468 Facial Landmarks // XGBoost Multi-Horizon Fatigue Predictor
                  </p>
                </div>
              </div>

              {/* Right Column: Live Glowing Biometric Metric Readout */}
              <div className="lg:col-span-7 space-y-4 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-white font-bold uppercase tracking-wider font-sans">
                      Active Telemetry Assessment Stream
                    </span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    REAL-TIME V3.4
                  </span>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl glass-panel-subtle border border-cyan-500/20">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Current Emotion</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">Neutral</div>
                    <div className="text-[10px] text-slate-500">82% Certainty</div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel-subtle border border-cyan-500/20">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Stress Index</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">28.4%</div>
                    <div className="text-[10px] text-emerald-400/80">Green Tier Normal</div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel-subtle border border-cyan-500/20">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Fatigue Score</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">Medium</div>
                    <div className="text-[10px] text-slate-500">EAR: 0.28</div>
                  </div>

                  <div className="p-3.5 rounded-xl glass-panel-subtle border border-cyan-500/20">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Attention Gaze</div>
                    <div className="text-base font-bold text-teal-300 mt-0.5">94.0%</div>
                    <div className="text-[10px] text-teal-400/80">Optimal Posture</div>
                  </div>
                </div>

                {/* SHAP Decomposition Preview Pill */}
                <div className="p-3.5 rounded-xl glass-panel-subtle border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-bold">SHAP Explainability:</span>
                    <span>Poor Sleep (+32%), High Duty Hours (+24%), Low HRV (+18%)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. HEALTHCARE AI VALUE PROPOSITIONS & DEFENSE ARCHITECTURE
      ========================================================================= */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
            Clinically Validated Defense Welfare Architecture
          </h2>
          <p className="text-sm text-slate-400 font-sans max-w-2xl mx-auto">
            Combining non-invasive computer vision with multi-variate statistical health models to prevent combat burnout before mission degradation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Card 1: Computer Vision */}
          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Non-Invasive Facial Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts 468 landmark vectors using MediaPipe and DeepFace. Measures subtle eyelid drooping (EAR), micro-blink cadence, involuntary yawning (MAR), and corrugator supercilii facial tension.
            </p>
            <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> SUB-100MS LATENCY
            </div>
          </div>

          {/* Card 2: XGBoost & Multi-Horizon */}
          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-teal-950 border border-teal-500/40 text-teal-400 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Horizon Predictive Risk</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trains calibrated gradient-boosted decision trees over personalized 7-day and 30-day baseline norms. Computes continuous risk trajectories (0–100) and forward 48-hour exhaustion projections.
            </p>
            <div className="text-[11px] font-mono text-teal-400 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> XGBOOST + 30D BASELINES
            </div>
          </div>

          {/* Card 3: Explainable Interventions */}
          <div className="glass-panel glass-card-hover rounded-2xl p-6 space-y-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Explainable Triage & Stand-Down</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Utilizes SHAP mathematical feature attribution to inform welfare officers of root catalysts. Automatically issues mandatory 24h rest stand-downs or circadian recovery protocols for Red Tier alerts.
            </p>
            <div className="text-[11px] font-mono text-blue-400 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> TREE SHAP EXPLAINABILITY
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. QUICK NAVIGATION TILES FOR SIH EVALUATION
      ========================================================================= */}
      <section className="max-w-6xl mx-auto glass-panel rounded-2xl p-8 border border-cyan-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              SentinelMind Vision Platform Subsystems
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Access role-specific interfaces, historical archives, and AI model parameters
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded border border-cyan-800">
            NATO MIL-SPEC EHR COMPLIANT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-xs">
          <button
            onClick={() => onNavigate("personnel-dashboard")}
            className="p-4 rounded-xl glass-panel-subtle hover:bg-slate-900 border border-cyan-500/20 text-left space-y-1.5 transition-all group"
          >
            <div className="text-cyan-400 font-mono font-bold flex items-center justify-between">
              01 // LIVE SCANNER
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="font-semibold text-white">Personnel Vision Portal</div>
            <p className="text-[11px] text-slate-400">Webcam scan, self-assessment & duty logger.</p>
          </button>

          <button
            onClick={() => onNavigate("welfare-dashboard")}
            className="p-4 rounded-xl glass-panel-subtle hover:bg-slate-900 border border-rose-500/20 text-left space-y-1.5 transition-all group"
          >
            <div className="text-rose-400 font-mono font-bold flex items-center justify-between">
              02 // WELFARE TRIAGE
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="font-semibold text-white">Welfare Officer Triage</div>
            <p className="text-[11px] text-slate-400">High-risk operator queue & SHAP cards.</p>
          </button>

          <button
            onClick={() => onNavigate("command-dashboard")}
            className="p-4 rounded-xl glass-panel-subtle hover:bg-slate-900 border border-teal-500/20 text-left space-y-1.5 transition-all group"
          >
            <div className="text-teal-400 font-mono font-bold flex items-center justify-between">
              03 // SQUAD HEATMAP
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="font-semibold text-white">Command Stress Heatmap</div>
            <p className="text-[11px] text-slate-400">7-Squad × 7-Day operational matrix.</p>
          </button>

          <button
            onClick={() => onNavigate("history")}
            className="p-4 rounded-xl glass-panel-subtle hover:bg-slate-900 border border-indigo-500/20 text-left space-y-1.5 transition-all group"
          >
            <div className="text-indigo-400 font-mono font-bold flex items-center justify-between">
              04 // AUDIT HISTORY
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="font-semibold text-white">Facial Analysis Archive</div>
            <p className="text-[11px] text-slate-400">PostgreSQL EHR records with CSV export.</p>
          </button>
        </div>
      </section>
    </div>
  );
};
