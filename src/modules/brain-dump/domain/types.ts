export type BrainDumpStatus = "inbox" | "converted" | "archived";
export type BrainDumpConvertedType = "project" | "task" | "subtask";

export interface BrainDumpItem {
  id: string;
  userId: string;
  content: string;
  status: BrainDumpStatus;
  convertedToType: BrainDumpConvertedType | null;
  convertedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const BRAIN_DUMP_CONSTRAINTS = {
  CONTENT_MAX_LENGTH: 5000,
} as const;
