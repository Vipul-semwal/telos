import { z } from "zod";

export const brainDumpKindEnum = z.enum([
  "note",
  "idea",
  "task",
  "question",
  "reference",
  "project_idea",
  "research",
  "problem",
  "info",
]);

export const brainDumpStatusEnum = z.enum([
  "inbox",
  "converted",
  "archived",
  "dismissed",
]);

export const createBrainDumpSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(5000, "Content too long"),
  kind: brainDumpKindEnum.optional(),
});

export const updateBrainDumpSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Content cannot be empty")
      .max(5000, "Content too long")
      .optional(),
    kind: brainDumpKindEnum.nullable().optional(),
  })
  .refine((data) => data.content !== undefined || data.kind !== undefined, {
    message: "At least one field must be provided",
  });

export const listBrainDumpQuerySchema = z.object({
  status: brainDumpStatusEnum.optional(),
  kind: brainDumpKindEnum.optional(),
  search: z.string().trim().max(200).optional(),
});

export const convertBrainDumpToTaskSchema = z.object({
  projectId: z.string().uuid("A valid parent Project is required"),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional(),
});

export const convertBrainDumpToProjectSchema = z.object({
  disciplineId: z.string().uuid("A valid parent Discipline is required"),
  title: z.string().trim().min(1).max(255).optional(),
});

export const associateBrainDumpSchema = z
  .object({
    projectId: z.string().uuid("Invalid project ID").optional(),
    disciplineId: z.string().uuid("Invalid discipline ID").optional(),
    keepAsNote: z.boolean().optional(),
  })
  .refine(
    (data) => data.projectId !== undefined || data.disciplineId !== undefined || data.keepAsNote === true,
    { message: "Select a project, a discipline, or keep as note" },
  );

export type CreateBrainDumpInput = z.infer<typeof createBrainDumpSchema>;
export type UpdateBrainDumpInput = z.infer<typeof updateBrainDumpSchema>;
export type ListBrainDumpQuery = z.infer<typeof listBrainDumpQuerySchema>;
export type BrainDumpStatus = z.infer<typeof brainDumpStatusEnum>;
export type BrainDumpKind = z.infer<typeof brainDumpKindEnum>;
export type ConvertBrainDumpToTaskInput = z.infer<typeof convertBrainDumpToTaskSchema>;
export type ConvertBrainDumpToProjectInput = z.infer<typeof convertBrainDumpToProjectSchema>;
export type AssociateBrainDumpInput = z.infer<typeof associateBrainDumpSchema>;
