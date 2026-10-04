export type AppRoute =
  | "landing"
  | "login"
  | "dashboard"
  | "personnel-dashboard"
  | "welfare-dashboard"
  | "command-dashboard"
  | "history"
  | "personnel"
  | "stress-monitoring"
  | "alerts"
  | "predictions"
  | "reports"
  | "settings";

export interface NavItem {
  id: AppRoute;
  label: string;
  path: string;
  iconName: string;
  badge?: number | string;
  badgeColor?: "red" | "amber" | "green" | "blue" | "cyan";
  description: string;
}

export interface UserSession {
  username: string;
  fullName: string;
  rankGrade: string;
  roleCode: "COMMAND_OFFICER" | "WELFARE_OFFICER" | "MEDICAL_OFFICER" | "PERSONNEL" | "ADMIN";
  unitCode: string;
  unitName: string;
}
