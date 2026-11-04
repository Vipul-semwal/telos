import { z } from "zod";

export const createDisciplineSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().trim().max(2000).optional(),
});

export const updateDisciplineSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export type CreateDisciplineInput = z.infer<typeof createDisciplineSchema>;
export type UpdateDisciplineInput = z.infer<typeof updateDisciplineSchema>;
