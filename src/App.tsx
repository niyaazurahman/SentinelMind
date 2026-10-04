import React, { useState, useEffect } from "react";
import { AppRoute, UserSession } from "./types/navigation";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PersonnelDashboardPage } from "./pages/PersonnelDashboardPage";
import { WelfareOfficerDashboardPage } from "./pages/WelfareOfficerDashboardPage";
import { CommandOfficerDashboardPage } from "./pages/CommandOfficerDashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { PersonnelPage } from "./pages/PersonnelPage";
import { StressMonitoringPage } from "./pages/StressMonitoringPage";
import { AlertsPage } from "./pages/AlertsPage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

export const App: React.FC = () => {
  // Routing state
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash.replace("#", "") as AppRoute;
    const validRoutes: AppRoute[] = [
      "landing",
      "login",
      "dashboard",
      "personnel-dashboard",
      "welfare-dashboard",
      "command-dashboard",
      "history",
      "personnel",
      "stress-monitoring",
      "alerts",
      "predictions",
      "reports",
      "settings",
    ];
    return validRoutes.includes(hash) ? hash : "landing";
  });

  // User session state
  const [session, setSession] = useState<UserSession | null>({
    username: "commander.vance",
    fullName: "Alex Vance",
    rankGrade: "CAPTAIN",
    roleCode: "COMMAND_OFFICER",
    unitCode: "7-CAV-HQ",
    unitName: "7th Air Cavalry Battalion",
  });

  useEffect(() => {
    window.location.hash = currentRoute;
  }, [currentRoute]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as AppRoute;
      const validRoutes: AppRoute[] = [
        "landing",
        "login",
        "dashboard",
        "personnel-dashboard",
        "welfare-dashboard",
        "command-dashboard",
        "history",
        "personnel",
        "stress-monitoring",
        "alerts",
        "predictions",
        "reports",
        "settings",
      ];
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleLogin = (role: "COMMAND_OFFICER" | "WELFARE_OFFICER" | "PERSONNEL") => {
    setSession({
      username: "authorized.operator",
      fullName:
        role === "COMMAND_OFFICER"
          ? "Alex Vance"
          : role === "WELFARE_OFFICER"
          ? "Dr. Helen Vance"
          : "Marcus Brody",
      rankGrade:
        role === "COMMAND_OFFICER"
          ? "CAPTAIN"
          : role === "WELFARE_OFFICER"
          ? "MAJOR"
          : "SERGEANT",
      roleCode: role,
      unitCode: "7-CAV-HQ",
      unitName: "7th Air Cavalry Battalion",
    });

    if (role === "PERSONNEL") {
      setCurrentRoute("personnel-dashboard");
    } else if (role === "WELFARE_OFFICER") {
      setCurrentRoute("welfare-dashboard");
    } else {
      setCurrentRoute("dashboard");
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentRoute("login");
  };

  if (currentRoute === "login" || !session) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentRoute) {
      case "landing":
        return <LandingPage onNavigate={setCurrentRoute} />;
      case "dashboard":
        return <DashboardPage />;
      case "personnel-dashboard":
        return <PersonnelDashboardPage />;
      case "welfare-dashboard":
        return <WelfareOfficerDashboardPage />;
      case "command-dashboard":
        return <CommandOfficerDashboardPage />;
      case "history":
        return <HistoryPage />;
      case "personnel":
        return <PersonnelPage />;
      case "stress-monitoring":
        return <StressMonitoringPage />;
      case "alerts":
        return <AlertsPage />;
      case "predictions":
        return <PredictionsPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <LandingPage onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <AppLayout
      currentRoute={currentRoute}
      onRouteChange={setCurrentRoute}
      userSession={session}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppLayout>
  );
};

export default App;
