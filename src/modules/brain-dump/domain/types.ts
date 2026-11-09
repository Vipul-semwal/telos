export type BrainDumpStatus = "inbox" | "converted" | "archived" | "dismissed";

export type BrainDumpKind =
  | "note"
  | "idea"
  | "task"
  | "question"
  | "reference"
  | "project_idea"
  | "research"
  | "problem"
  | "info";

export type BrainDumpConvertedType =
  | "task"
  | "project"
  | "project_link"
  | "discipline_link"
  | "note";

export interface BrainDumpItem {
  id: string;
  userId: string;
  content: string;
  kind: BrainDumpKind | null;
  status: BrainDumpStatus;
  disciplineId: string | null;
  projectId: string | null;
  convertedToType: BrainDumpConvertedType | null;
  convertedToId: string | null;
  convertedAt: Date | null;
  archivedAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const BRAIN_DUMP_CONSTRAINTS = {
  CONTENT_MAX_LENGTH: 5000,
} as const;

export const BRAIN_DUMP_STATUSES: BrainDumpStatus[] = [
  "inbox",
  "converted",
  "archived",
  "dismissed",
];

export const BRAIN_DUMP_KINDS: BrainDumpKind[] = [
  "note",
  "idea",
  "task",
  "question",
  "reference",
  "project_idea",
  "research",
  "problem",
  "info",
];
