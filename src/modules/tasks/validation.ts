import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  parentTaskId: z.string().uuid("Invalid parent task ID").optional(),
  title: z.string().trim().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().trim().max(5000).optional(),
  estimatedDurationSeconds: z.number().int().min(0, "Estimated duration must be positive").default(0),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional(),
  estimatedDurationSeconds: z.number().int().min(0).optional(),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
