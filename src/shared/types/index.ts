export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: Date;
}

export type DisciplineStatus = "active" | "archived";
export type ProjectStatus = "active" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";
export type BrainDumpStatus = "inbox" | "converted" | "archived";
export type DailyPlanItemStatus = "planned" | "in_progress" | "completed" | "deferred";
export type EtaStatus = "green" | "red";
