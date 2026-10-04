import React, { useState } from "react";
import { Users, Search, Filter, Plus, ShieldCheck, Heart, Moon, Clock, ArrowUpDown, ChevronRight } from "lucide-react";

interface ServiceMember {
  id: string;
  militaryId: string;
  fullName: string;
  rankGrade: string;
  unitCode: string;
  role: string;
  dutyStatus: string;
  baselineHrv: number;
  baselineSleep: number;
  currentStressScore: number;
  tier: "GREEN" | "AMBER" | "RED";
}

const SAMPLE_PERSONNEL: ServiceMember[] = [
  {
    id: "1",
    militaryId: "MIL-84910",
    fullName: "Marcus Brody",
    rankGrade: "CAPTAIN",
    unitCode: "7-CAV-A",
    role: "Company Commander",
    dutyStatus: "ACTIVE_DUTY",
    baselineHrv: 54.0,
    baselineSleep: 7.5,
    currentStressScore: 84.2,
    tier: "RED",
  },
  {
    id: "2",
    militaryId: "MIL-77219",
    fullName: "Elena Rostova",
    rankGrade: "SERGEANT",
    unitCode: "7-CAV-B",
    role: "Combat Medic",
    dutyStatus: "ACTIVE_DUTY",
    baselineHrv: 62.0,
    baselineSleep: 7.2,
    currentStressScore: 76.5,
    tier: "RED",
  },
  {
    id: "3",
    militaryId: "MIL-90311",
    fullName: "David Sterling",
    rankGrade: "LIEUTENANT",
    unitCode: "7-CAV-A",
    role: "Platoon Leader",
    dutyStatus: "STANDBY",
    baselineHrv: 58.0,
    baselineSleep: 7.0,
    currentStressScore: 54.0,
    tier: "AMBER",
  },
  {
    id: "4",
    militaryId: "MIL-62104",
    fullName: "James Morales",
    rankGrade: "SPECIALIST",
    unitCode: "7-CAV-C",
    role: "Drone Operator",
    dutyStatus: "ACTIVE_DUTY",
    baselineHrv: 66.0,
    baselineSleep: 7.5,
    currentStressScore: 42.1,
    tier: "AMBER",
  },
  {
    id: "5",
    militaryId: "MIL-54129",
    fullName: "Sarah Chen",
    rankGrade: "MAJOR",
    unitCode: "HQ-TAC",
    role: "Intelligence Officer",
    dutyStatus: "BASE_DUTY",
    baselineHrv: 70.0,
    baselineSleep: 8.0,
    currentStressScore: 18.5,
    tier: "GREEN",
  },
  {
    id: "6",
    militaryId: "MIL-33821",
    fullName: "Thomas Wright",
    rankGrade: "CORPORAL",
    unitCode: "7-CAV-B",
    role: "Communications Spec",
    dutyStatus: "BASE_DUTY",
    baselineHrv: 64.0,
    baselineSleep: 7.5,
    currentStressScore: 22.0,
    tier: "GREEN",
  },
];

export const PersonnelPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  const filtered = SAMPLE_PERSONNEL.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.militaryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rankGrade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "ALL" || p.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            Personnel Roster & Individual Baselines
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Registry of all operational operators, personalized physiological baselines, and active clearances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-2 font-mono transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Plus className="w-4 h-4" /> ENROLL SERVICE MEMBER
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, or rank..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tier:
          </span>
          {(["ALL", "GREEN", "AMBER", "RED"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                tierFilter === tier
                  ? tier === "RED"
                    ? "bg-rose-950 border border-rose-600 text-rose-300"
                    : tier === "AMBER"
                    ? "bg-amber-950 border border-amber-600 text-amber-300"
                    : tier === "GREEN"
                    ? "bg-emerald-950 border border-emerald-600 text-emerald-300"
                    : "bg-cyan-950 border border-cyan-500 text-cyan-300"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Member</th>
                <th className="py-3 px-4">Military ID</th>
                <th className="py-3 px-4">Unit / Role</th>
                <th className="py-3 px-4">Duty Status</th>
                <th className="py-3 px-4">30d Baselines</th>
                <th className="py-3 px-4">Current Stress Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {filtered.map((person) => (
                <tr key={person.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-white">{person.fullName}</div>
                    <div className="text-[11px] font-mono text-cyan-400">{person.rankGrade}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{person.militaryId}</td>
                  <td className="py-3.5 px-4">
                    <div className="text-white">{person.unitCode}</div>
                    <div className="text-[11px] text-slate-400 font-sans">{person.role}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {person.dutyStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1" title="Normative HRV">
                        <Heart className="w-3 h-3 text-rose-400" /> {person.baselineHrv}ms
                      </span>
                      <span className="flex items-center gap-1" title="Target Sleep">
                        <Moon className="w-3 h-3 text-indigo-400" /> {person.baselineSleep}h
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          person.tier === "RED"
                            ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                            : person.tier === "AMBER"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                            : "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                        }`}
                      >
                        {person.currentStressScore.toFixed(1)} // {person.tier}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="px-2.5 py-1 text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 transition-colors">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
