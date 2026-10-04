import React, { useState } from "react";
import {
  Shield,
  Layers,
  Users,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const SQUAD_NAMES = [
  "Alpha 1 (Forward Recon)",
  "Alpha 2 (Assault Platoon)",
  "Bravo 1 (Air Support)",
  "Bravo 2 (Heavy Weapon)",
  "Charlie 1 (Drone Recon)",
  "Charlie 2 (Signal/Comms)",
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
  if (score <= 30) return "bg-emerald-950/70 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/60";
  if (score <= 60) return "bg-amber-950/70 text-amber-300 border-amber-800/50 hover:bg-amber-900/60";
  return "bg-rose-950/90 text-rose-300 border-rose-700/70 hover:bg-rose-900/80 font-bold shadow-[0_0_12px_rgba(244,63,94,0.25)]";
};

export const CommandOfficerDashboardPage: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<{ squad: string; day: string; score: number } | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                COMMAND LEVEL BRIEFING // ANONYMOUS AGGREGATES
              </span>
              <span className="text-xs font-mono text-slate-400">7TH AIR CAVALRY BATTALION</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Operational Force Readiness & Stress Heatmap
            </h1>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              High-level echelon combat sustainability, squad-level fatigue distribution, and readiness clearances.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Unit Readiness</div>
              <div className="text-2xl font-extrabold text-emerald-400">92.4%</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase">Total Combat Deployable</div>
          <div className="text-3xl font-extrabold text-white mt-1">145 / 150</div>
          <div className="text-xs text-emerald-400 mt-1 font-sans">5 temporarily on mandatory stand-down</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase">Battalion Mean Duty Shift</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">9.8h</div>
          <div className="text-xs text-slate-400 mt-1 font-sans">Shift tempo peaked during Day 5 operations</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase">Welfare Intervention Adherence</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">100%</div>
          <div className="text-xs text-slate-400 mt-1 font-sans">All stand-down orders enforced by officers</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Squad Stress & Operational Heatmap (7 Squads × 7 Days)
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Anonymous platoon aggregates. Colors signify NATO zones: Green (0-30), Amber (31-60), Red (61-100).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> 0-30 Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block" /> 31-60 Amber
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-600 inline-block" /> 61-100 Red
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                <th className="py-2.5 px-3 text-left font-sans font-semibold">Squad / Echelon Unit</th>
                {DAYS_HEADER.map((day) => (
                  <th key={day} className="py-2.5 px-3 font-semibold uppercase">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {SQUAD_NAMES.map((squadName, sIdx) => (
                <tr key={squadName} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 text-left font-sans font-medium text-slate-200 text-xs">
                    {squadName}
                  </td>
                  {SQUAD_HEATMAP_GRID[sIdx].map((score, dIdx) => (
                    <td key={dIdx} className="p-1">
                      <button
                        onClick={() => setSelectedCell({ squad: squadName, day: DAYS_HEADER[dIdx], score })}
                        className={`w-full py-2 px-1 rounded border transition-all text-xs ${getHeatmapColor(score)}`}
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
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Echelon Sector: </span>
              <strong className="text-white">{selectedCell.squad}</strong> ({selectedCell.day})
              <span className="mx-2 text-slate-600">|</span>
              <span>Anonymous Mean Stress: </span>
              <strong className={selectedCell.score > 60 ? "text-rose-400" : selectedCell.score > 30 ? "text-amber-400" : "text-emerald-400"}>
                {selectedCell.score} / 100 ({selectedCell.score > 60 ? "RED" : selectedCell.score > 30 ? "AMBER" : "GREEN"})
              </strong>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-500 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
