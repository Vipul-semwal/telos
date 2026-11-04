import { z } from "zod";

export const projectStatusEnum = z.enum(["active", "paused", "completed", "archived"]);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

export const createProjectSchema = z.object({
  disciplineId: z.string().uuid("Invalid discipline ID"),
  title: z.string().trim().min(1, "Project name is required").max(255, "Project name too long"),
  description: z.string().trim().max(2000, "Description too long").optional(),
  desiredOutcome: z.string().trim().max(2000, "Desired outcome too long").optional(),
  initialStatus: z.enum(["active", "paused"]).optional().default("active"),
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(1, "Project name is required").max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  desiredOutcome: z.string().trim().max(2000).optional(),
  status: projectStatusEnum.optional(),
});

export const projectStatusTransitionSchema = z.object({
  status: projectStatusEnum,
});

export type CreateProjectInput = {
  disciplineId: string;
  title: string;
  description?: string;
  desiredOutcome?: string;
  initialStatus?: "active" | "paused";
};
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectStatusTransitionInput = z.infer<typeof projectStatusTransitionSchema>;
