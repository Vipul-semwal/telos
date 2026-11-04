export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export interface Project {
  id: string;
  userId: string;
  disciplineId: string;
  title: string;
  description: string | null;
  desiredOutcome: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithDetails extends Project {
  disciplineTitle?: string;
  taskCount?: number;
  completedTaskCount?: number;
  totalDurationSeconds?: number;
}

export const PROJECT_CONSTRAINTS = {
  MAX_ACTIVE_PER_DISCIPLINE: 3,
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 2000,
  DESIRED_OUTCOME_MAX_LENGTH: 2000,
} as const;
