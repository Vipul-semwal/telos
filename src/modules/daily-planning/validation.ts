import { z } from "zod";

export const addTaskToPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  taskId: z.string().uuid("Invalid task ID"),
  plannedDurationSeconds: z.number().int().positive("Planned duration must be positive").optional(),
});

export const updatePlanItemSchema = z.object({
  plannedDurationSeconds: z.number().int().positive().optional(),
  status: z.enum(["planned", "in_progress", "completed", "deferred"]).optional(),
  sortOrder: z.number().int().optional(),
});

export type AddTaskToPlanInput = z.infer<typeof addTaskToPlanSchema>;
export type UpdatePlanItemInput = z.infer<typeof updatePlanItemSchema>;
