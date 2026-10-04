import React, { useState } from "react";
import { Shield, Lock, User, AlertCircle, ArrowRight, Activity, Radio } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (role: "COMMAND_OFFICER" | "WELFARE_OFFICER" | "PERSONNEL") => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("commander.vance");
  const [password, setPassword] = useState("••••••••••••");
  const [selectedRole, setSelectedRole] = useState<"COMMAND_OFFICER" | "WELFARE_OFFICER" | "PERSONNEL">("COMMAND_OFFICER");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(selectedRole);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Military Classification Header */}
      <div className="fixed top-0 inset-x-0 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-center">
        <span className="text-[11px] font-mono tracking-widest text-amber-400 font-semibold uppercase">
          RESTRICTED // NATO MIL-SPEC STRESS SURVEILLANCE SYSTEM // UNCLASSIFIED TEST PORTAL
        </span>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)] mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            SENTINEL<span className="text-cyan-400">MIND</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1">
            Psychological & Physiological Readiness Defense Engine
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300">SYSTEM SECURE // CAC / PIN ACCESS</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
              v1.4-PROD
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                Service ID / CAC Identifier
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="e.g. CPT-89410"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                Security Passcode / Biometric Pin
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Quick Demo Role Selector */}
            <div className="pt-2">
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                Operational Role Clearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["COMMAND_OFFICER", "WELFARE_OFFICER", "PERSONNEL"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-2 px-2 text-[11px] font-mono rounded-lg border text-center transition-all ${
                      selectedRole === role
                        ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] font-semibold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {role === "COMMAND_OFFICER" && "Commander"}
                    {role === "WELFARE_OFFICER" && "Medical/Welfare"}
                    {role === "PERSONNEL" && "Operator"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                  <Activity className="w-4 h-4 animate-spin" /> Verifying Cryptographic Token...
                </span>
              ) : (
                <>
                  <span className="text-sm">AUTHENTICATE & ENTER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>DEFENSE AUTH GATEWAY</span>
            <span>SECURE AES-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};
