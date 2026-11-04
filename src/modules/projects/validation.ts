import { z } from "zod";

export const createProjectSchema = z.object({
  disciplineId: z.string().uuid("Invalid discipline ID"),
  title: z.string().trim().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().trim().max(2000).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
