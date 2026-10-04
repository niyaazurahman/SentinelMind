import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ShieldAlert,
  UserCheck,
  Check,
  Eye,
} from "lucide-react";

interface AlertItem {
  id: string;
  tier: "RED" | "AMBER" | "GREEN";
  score: number;
  personnelName: string;
  rank: string;
  unit: string;
  title: string;
  description: string;
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
}

const SAMPLE_ALERTS: AlertItem[] = [
  {
    id: "a1",
    tier: "RED",
    score: 84.2,
    personnelName: "Marcus Brody",
    rank: "CAPTAIN",
    unit: "7-CAV-A",
    title: "CRITICAL: High Stress Overload (84.2/100)",
    description: "Vagal collapse (18ms) & 15.5h duty shift. Exceeds safe operational threshold (61-100).",
    status: "NEW",
    createdAt: "12 mins ago",
  },
  {
    id: "a2",
    tier: "RED",
    score: 76.5,
    personnelName: "Elena Rostova",
    rank: "SERGEANT",
    unit: "7-CAV-B",
    title: "CRITICAL: Acute Sleep Deficit & Vagal Crash",
    description: "Sleep dropped to 3.1h with low mood score (2/10). Critical welfare triage flagged.",
    status: "NEW",
    createdAt: "38 mins ago",
  },
  {
    id: "a3",
    tier: "AMBER",
    score: 54.0,
    personnelName: "David Sterling",
    rank: "LIEUTENANT",
    unit: "7-CAV-A",
    title: "WARNING: Elevated Fatigue & Sleep Debt",
    description: "Registered 54.0/100 (Threshold 31-60). 4.2h accumulated sleep debt across 72 hours.",
    status: "ACKNOWLEDGED",
    createdAt: "1 hour ago",
  },
  {
    id: "a4",
    tier: "AMBER",
    score: 42.1,
    personnelName: "James Morales",
    rank: "SPECIALIST",
    unit: "7-CAV-C",
    title: "WARNING: Extended Drone Shift Fatigue",
    description: "Consecutive night shift duty logged at 13.0 continuous hours.",
    status: "ACKNOWLEDGED",
    createdAt: "2 hours ago",
  },
  {
    id: "a5",
    tier: "GREEN",
    score: 18.5,
    personnelName: "Sarah Chen",
    rank: "MAJOR",
    unit: "HQ-TAC",
    title: "NORMAL: Stress Recovery Confirmed",
    description: "Auto-resolved: Stress score normalized to GREEN (18.5/100) after 8h restorative rest block.",
    status: "RESOLVED",
    createdAt: "3 hours ago",
  },
];

export const AlertsPage: React.FC = () => {
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [alerts, setAlerts] = useState<AlertItem[]>(SAMPLE_ALERTS);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" as const } : a))
    );
  };

  const handleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "RESOLVED" as const } : a))
    );
  };

  const filtered = alerts.filter((a) => filterTier === "ALL" || a.tier === filterTier);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Automated Alert & Incident Triage Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time escalation board enforcing NATO standard tiers: Green (0-30), Amber (31-60), Red (61-100).
          </p>
        </div>

        {/* Rule Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded">
            0-30 GREEN
          </span>
          <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-800 text-amber-400 rounded">
            31-60 AMBER
          </span>
          <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-800 text-rose-400 rounded">
            61-100 RED
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Severity Filter:
          </span>
          {(["ALL", "RED", "AMBER", "GREEN"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                filterTier === tier
                  ? tier === "RED"
                    ? "bg-rose-950 border border-rose-600 text-rose-300 font-bold"
                    : tier === "AMBER"
                    ? "bg-amber-950 border border-amber-600 text-amber-300 font-bold"
                    : tier === "GREEN"
                    ? "bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold"
                    : "bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filtered.length} Alerts
        </span>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3 font-mono">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-xl border backdrop-blur-xl transition-all ${
              alert.tier === "RED"
                ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60"
                : alert.tier === "AMBER"
                ? "bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60"
                : "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      alert.tier === "RED"
                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                        : alert.tier === "AMBER"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {alert.tier} // {alert.score.toFixed(1)} / 100
                  </span>

                  <span
                    className={`text-[11px] px-2 py-0.5 rounded border ${
                      alert.status === "NEW"
                        ? "bg-rose-950/60 text-rose-400 border-rose-800/50 animate-pulse"
                        : alert.status === "ACKNOWLEDGED"
                        ? "bg-cyan-950/60 text-cyan-400 border-cyan-800/50"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    STATUS: {alert.status}
                  </span>

                  <span className="text-xs text-slate-500">{alert.createdAt}</span>
                </div>

                <h3 className="text-sm font-semibold text-white font-sans">{alert.title}</h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">{alert.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Operator: <strong className="text-slate-200">{alert.rank} {alert.personnelName}</strong></span>
                  <span>Echelon Unit: <strong className="text-slate-200">{alert.unit}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {alert.status === "NEW" && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                )}

                {alert.status !== "RESOLVED" && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-800/50 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve Alert
                  </button>
                )}

                {alert.status === "RESOLVED" && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Incident Closed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
