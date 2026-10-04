import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  Camera,
  FileText,
  HeartHandshake,
  History,
  Home,
  Layers,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  X,
  ChevronRight,
  Scan,
  Sparkles,
} from "lucide-react";
import { AppRoute, UserSession } from "../../types/navigation";
import { MedicalCreamBackground } from "../effects/MedicalCreamBackground";

interface AppLayoutProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  userSession: UserSession;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onRouteChange,
  userSession,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleNavItems = [
    {
      id: "landing" as AppRoute,
      label: "Showcase Landing",
      icon: Home,
      badge: "AI CORE",
      badgeColor: "cyan",
    },
    {
      id: "personnel-dashboard" as AppRoute,
      label: "Live Vision Scanner",
      icon: Scan,
      badge: "REAL-TIME",
      badgeColor: "cyan",
    },
    {
      id: "history" as AppRoute,
      label: "Analysis History",
      icon: History,
      badge: "ARCHIVE",
      badgeColor: "cyan",
    },
    {
      id: "welfare-dashboard" as AppRoute,
      label: "Welfare Officer Triage",
      icon: HeartHandshake,
      badge: "SHAP",
      badgeColor: "rose",
    },
    {
      id: "command-dashboard" as AppRoute,
      label: "Command Stress Heatmap",
      icon: Layers,
      badge: "READY",
      badgeColor: "emerald",
    },
  ];

  const standardNavItems = [
    {
      id: "dashboard" as AppRoute,
      label: "Master Command Center",
      icon: Activity,
    },
    {
      id: "personnel" as AppRoute,
      label: "Personnel Roster",
      icon: Users,
    },
    {
      id: "stress-monitoring" as AppRoute,
      label: "Stress Monitoring",
      icon: Moon,
    },
    {
      id: "alerts" as AppRoute,
      label: "Alert Engine",
      icon: ShieldAlert,
      badge: "5",
      badgeColor: "rose",
    },
    {
      id: "predictions" as AppRoute,
      label: "Predictions & SHAP",
      icon: Brain,
    },
    {
      id: "reports" as AppRoute,
      label: "Readiness Reports",
      icon: FileText,
    },
    {
      id: "settings" as AppRoute,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Interactive Cream Mouse-Follow Background & Neural Web */}
      <MedicalCreamBackground />

      {/* 2. Top Classification Bar */}
      <div className="relative z-50 bg-slate-950/80 backdrop-blur-md border-b border-cyan-900/40 py-1 px-4 text-center">
        <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-semibold uppercase flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          SENTINELMIND VISION // MEDICAL AI & DEFENSE WELFARE PLATFORM // SMART INDIA HACKATHON
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-40">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Futuristic Glassmorphic Sidebar */}
        <aside
          className={`fixed lg:static top-0 bottom-0 left-0 w-64 glass-panel border-r border-cyan-500/20 z-50 transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Logo / Header */}
          <div className="p-4 border-b border-cyan-900/30 flex items-center justify-between">
            <div
              onClick={() => {
                onRouteChange("landing");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-950 via-teal-900 to-slate-900 border border-cyan-400/50 text-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <div className="text-base font-extrabold tracking-tight text-white leading-none font-sans">
                  SENTINEL<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">MIND</span>
                </div>
                <div className="text-[9px] font-mono text-cyan-400/80 tracking-wider mt-0.5">VISION // HEALTH AI</div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/70 px-3 pt-1 pb-1.5 font-bold">
              Medical AI & Scanner
            </div>

            {roleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onRouteChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-950/90 to-teal-950/60 border border-cyan-400/60 text-cyan-200 font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)] translate-x-1"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-cyan-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
                    <span className="font-sans text-xs truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        item.badgeColor === "rose"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : item.badgeColor === "emerald"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/70 px-3 pt-3 pb-1.5 font-bold">
              Defense Welfare Core
            </div>

            {standardNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onRouteChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span className="font-sans text-xs truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Session Footer Card */}
          <div className="p-3 border-t border-cyan-900/30 bg-slate-950/60">
            <div className="p-2.5 rounded-xl glass-panel-subtle border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-950 to-teal-900 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                  {userSession.rankGrade.slice(0, 3)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-white truncate font-sans">
                    {userSession.fullName}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate">
                    {userSession.unitCode} // {userSession.roleCode}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Disconnect Session"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Bar */}
          <header className="h-14 border-b border-cyan-900/30 glass-panel-subtle px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white p-1"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>ECHELON:</span>
                <span className="text-cyan-400 font-semibold">{userSession.unitName}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300 capitalize font-sans">{currentRoute.replace("-", " ")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Jump to Landing Showcase */}
              {currentRoute !== "landing" && (
                <button
                  onClick={() => onRouteChange("landing")}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel-subtle border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:border-cyan-400 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Showcase Home</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel border border-emerald-500/30 text-[11px] font-mono text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SENTINELMIND VISION // ONLINE</span>
              </div>

              <button
                onClick={() => onRouteChange("alerts")}
                className="relative p-2 rounded-lg glass-panel-subtle border border-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </button>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
