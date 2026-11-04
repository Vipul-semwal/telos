import { z } from "zod";

export const createBrainDumpSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(5000, "Content too long"),
});

export const convertBrainDumpSchema = z.object({
  convertedToType: z.enum(["project", "task", "subtask"]),
  convertedToId: z.string().uuid("Invalid target ID"),
});

export type CreateBrainDumpInput = z.infer<typeof createBrainDumpSchema>;
export type ConvertBrainDumpInput = z.infer<typeof convertBrainDumpSchema>;
