import React, { useState } from "react";
import {
  Activity,
  Heart,
  Moon,
  Clock,
  Smile,
  Zap,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const StressMonitoringPage: React.FC = () => {
  // Controlled form state for the 6 core metrics requested
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [hrv, setHrv] = useState<number>(42.8);
  const [restingHr, setRestingHr] = useState<number>(62);
  const [dutyHours, setDutyHours] = useState<number>(8.0);
  const [moodScore, setMoodScore] = useState<number>(7);
  const [stressScore, setStressScore] = useState<number>(38.5);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string>("CPT Marcus Brody (MIL-84910)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedTime, setLastSubmittedTime] = useState<string | null>(null);

  const handleLogTelemetry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setLastSubmittedTime(new Date().toLocaleTimeString());
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Physiological Telemetry & Stress Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time ingestion and longitudinal tracking of all 6 operational stress vitals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 hover:border-slate-700 flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> SYNC WEARABLES (BLUETOOTH / TAC-NET)
          </button>
        </div>
      </div>

      {/* Grid: Ingestion Form + Live Reading Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Input Panel */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Manual & Sensor Ingestion
            </h2>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              API POST /logs
            </span>
          </div>

          <form onSubmit={handleLogTelemetry} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Target Service Member</label>
              <select
                value={selectedPersonnel}
                onChange={(e) => setSelectedPersonnel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option>CPT Marcus Brody (MIL-84910)</option>
                <option>SGT Elena Rostova (MIL-77219)</option>
                <option>LT David Sterling (MIL-90311)</option>
                <option>SPC James Morales (MIL-62104)</option>
                <option>MAJ Sarah Chen (MIL-54129)</option>
              </select>
            </div>

            {/* 1. Sleep Hours */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-indigo-400" /> Sleep Hours
                </span>
                <span className="text-white font-bold">{sleepHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="14.0"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* 2. HRV */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-400" /> HRV (RMSSD ms)
                </span>
                <span className="text-white font-bold">{hrv.toFixed(1)} ms</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="1"
                value={hrv}
                onChange={(e) => setHrv(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* 3. Resting HR */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" /> Resting Heart Rate (BPM)
                </span>
                <span className="text-white font-bold">{restingHr} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="130"
                step="1"
                value={restingHr}
                onChange={(e) => setRestingHr(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* 4. Duty Hours */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Duty Shift Hours
                </span>
                <span className="text-white font-bold">{dutyHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={dutyHours}
                onChange={(e) => setDutyHours(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* 5. Mood Score */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Smile className="w-3 h-3 text-emerald-400" /> Psychological Mood (1-10)
                </span>
                <span className="text-white font-bold">{moodScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={moodScore}
                onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* 6. Stress Score */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Stress Score (0-100)
                </span>
                <span className={`font-bold ${
                  stressScore <= 30 ? "text-emerald-400" : stressScore <= 60 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {stressScore.toFixed(1)} // {stressScore <= 30 ? "GREEN" : stressScore <= 60 ? "AMBER" : "RED"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={stressScore}
                onChange={(e) => setStressScore(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Logging Telemetry..." : "Commit Telemetry Record"}
            </button>

            {lastSubmittedTime && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-lg flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Persisted in PostgreSQL at {lastSubmittedTime}</span>
              </div>
            )}
          </form>
        </div>

        {/* Live Vitals Telemetry Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Recent Multi-Parameter Telemetry Stream</h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">Real-time incoming field sensors & wearable sync</p>

            <div className="space-y-3">
              {[
                {
                  name: "CPT Marcus Brody",
                  time: "10m ago",
                  sleep: "3.5h",
                  hrv: "21.0ms",
                  rhr: "84 bpm",
                  duty: "15.0h",
                  mood: "2/10",
                  score: 84.2,
                  tier: "RED",
                },
                {
                  name: "SGT Elena Rostova",
                  time: "24m ago",
                  sleep: "4.2h",
                  hrv: "28.5ms",
                  rhr: "78 bpm",
                  duty: "13.5h",
                  mood: "3/10",
                  score: 76.5,
                  tier: "RED",
                },
                {
                  name: "LT David Sterling",
                  time: "48m ago",
                  sleep: "5.8h",
                  hrv: "42.0ms",
                  rhr: "66 bpm",
                  duty: "9.0h",
                  mood: "6/10",
                  score: 54.0,
                  tier: "AMBER",
                },
                {
                  name: "SPC James Morales",
                  time: "1h ago",
                  sleep: "6.2h",
                  hrv: "49.5ms",
                  rhr: "64 bpm",
                  duty: "8.5h",
                  mood: "7/10",
                  score: 42.1,
                  tier: "AMBER",
                },
                {
                  name: "MAJ Sarah Chen",
                  time: "2h ago",
                  sleep: "7.8h",
                  hrv: "68.2ms",
                  rhr: "58 bpm",
                  duty: "7.5h",
                  mood: "9/10",
                  score: 18.5,
                  tier: "GREEN",
                },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div>
                    <div className="flex items-center gap-2 font-sans font-semibold text-white">
                      <span>{log.name}</span>
                      <span className="text-[11px] font-mono text-slate-500 font-normal">{log.time}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-slate-400">
                      <span>Sleep: <strong className="text-slate-200">{log.sleep}</strong></span>
                      <span>HRV: <strong className="text-slate-200">{log.hrv}</strong></span>
                      <span>RHR: <strong className="text-slate-200">{log.rhr}</strong></span>
                      <span>Duty: <strong className="text-slate-200">{log.duty}</strong></span>
                      <span>Mood: <strong className="text-slate-200">{log.mood}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        log.tier === "RED"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : log.tier === "AMBER"
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}
                    >
                      {log.score.toFixed(1)} // {log.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
