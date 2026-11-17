export type SeedPriority = "low" | "medium" | "high";

export interface SeedSubtask {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface SeedFlashcard {
  title: string;
  front: string;
  back: string;
}

export interface SeedNote {
  title: string;
  contentHtml: string;
}

export interface SeedTaskYard {
  tldr?: string;
  notes?: SeedNote[];
  flashcards?: SeedFlashcard[];
}

export interface SeedTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: SeedPriority;
  masteryGate: string;
  resources: string[];
  subtasks: SeedSubtask[];
  taskYard?: SeedTaskYard;
}

export interface CurriculumSeed {
  key: string;
  target?: {
    disciplineTitle: string;
    projectTitle: string;
  };
  discipline: {
    title: string;
    description: string;
  };
  project: {
    title: string;
    description: string;
    desiredOutcome: string;
  };
  tasks: SeedTask[];
}

export interface SeedResult {
  status: "seeded" | "skipped";
  seedKey: string;
  username: string;
  disciplineId?: string;
  projectId?: string;
  taskCount?: number;
  subtaskCount?: number;
  noteCount?: number;
  cardCount?: number;
}
