export type DisciplineStatus = "active" | "archived";

export interface Discipline {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: DisciplineStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const DISCIPLINE_CONSTRAINTS = {
  MAX_ACTIVE: 3,
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 2000,
} as const;
