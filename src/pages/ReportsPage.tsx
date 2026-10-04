import React from "react";
import { FileText, Download, Calendar, BarChart3, TrendingDown, Users, ShieldCheck, CheckCircle } from "lucide-react";

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            Operational Readiness & Stress Briefing Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Command intelligence briefs, longitudinal medical fatigue reviews, and audit exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-2 font-mono transition-colors">
            <Download className="w-4 h-4" /> GENERATE COMBAT READINESS BRIEF (PDF)
          </button>
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Weekly Sleep Deficit Average</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">5.4 <span className="text-sm font-normal text-slate-400">hrs / member</span></div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">14% improvement over previous rotation</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Triage Escalation Frequency</div>
          <div className="text-2xl font-bold font-mono text-white mt-2">12 <span className="text-sm font-normal text-slate-400">Alerts this cycle</span></div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">100% acknowledged within 15 mins</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-mono uppercase text-slate-400">Combat Fatigue Clearance Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">94.8%</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Cleared for high-tempo operations</div>
        </div>
      </div>

      {/* Available Reports Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
            Generated Command Briefs & Medical Records
          </h2>
          <span className="text-xs font-mono text-slate-400">CYCLE 2026-Q4</span>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono text-xs text-slate-300">
          {[
            {
              title: "Battalion 7-Cav Operational Stress Analysis (7-Day Rolling)",
              code: "REP-2026-089",
              classification: "RESTRICTED",
              date: "Today, 0600 hrs",
              author: "Medical Officer / Dr. H. Vance",
              fileSize: "2.4 MB",
            },
            {
              title: "High-Tempo Patrol Sleep Debt & Autonomic HRV Correlation Audit",
              code: "REP-2026-088",
              classification: "RESTRICTED",
              date: "Yesterday, 1800 hrs",
              author: "Welfare Officer / CPT E. Stone",
              fileSize: "1.8 MB",
            },
            {
              title: "Isolation Forest Anomaly Scan: Extreme Duty Over-extension Log",
              code: "REP-2026-087",
              classification: "COMMAND EYES ONLY",
              date: "28 Sep 2026",
              author: "Automated SentinelMind Engine",
              fileSize: "940 KB",
            },
            {
              title: "Monthly Personnel Baseline Recalibration & Triage Summary",
              code: "REP-2026-086",
              classification: "RESTRICTED",
              date: "25 Sep 2026",
              author: "Defense Psychological Readiness Group",
              fileSize: "4.1 MB",
            },
          ].map((rep, idx) => (
            <div
              key={idx}
              className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white font-sans text-sm">{rep.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                    {rep.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Author: {rep.author}</span>
                  <span>Date: {rep.date}</span>
                  <span>Classification: <strong className="text-amber-400">{rep.classification}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1.5 transition-colors">
                  <Download className="w-3.5 h-3.5" /> PDF ({rep.fileSize})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
