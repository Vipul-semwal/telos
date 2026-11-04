export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  estimatedDurationSeconds: number;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export type TaskEventType =
  | "created"
  | "status_changed"
  | "session_started"
  | "session_stopped"
  | "completed"
  | "duration_adjusted";

export interface TaskHistoryEntry {
  id: string;
  userId: string;
  taskId: string;
  eventType: TaskEventType;
  eventData: string | null;
  createdAt: Date;
}

export const TASK_CONSTRAINTS = {
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 5000,
  MAX_HIERARCHY_DEPTH: 1, // Discipline -> Project -> Task -> Subtask (parent cannot have parent)
} as const;
