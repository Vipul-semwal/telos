import { z } from "zod";

export const taskStatusEnum = z.enum(["todo", "in_progress", "completed", "cancelled"]);
export type TaskStatus = z.infer<typeof taskStatusEnum>;

export const taskPriorityEnum = z.enum(["low", "medium", "high"]);
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  parentTaskId: z.string().uuid("Invalid parent task ID").optional().nullable(),
  title: z.string().trim().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().trim().max(5000).optional().nullable(),
  estimatedDurationSeconds: z.number().int().min(0, "Estimated duration must be positive").default(0),
  priority: taskPriorityEnum.default("medium"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().trim().max(10000).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(255).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  estimatedDurationSeconds: z.number().int().min(0, "Estimated duration must be positive").optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().trim().max(10000).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
});

export const taskStatusTransitionSchema = z.object({
  status: taskStatusEnum,
});

export const reorderTasksSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid("Invalid task ID"),
        orderIndex: z.number().int().min(0),
      }),
    )
    .min(1, "At least one item required to reorder"),
});

export type CreateTaskInput = {
  projectId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  estimatedDurationSeconds?: number;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  notes?: string | null;
  orderIndex?: number;
};
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskStatusTransitionInput = z.infer<typeof taskStatusTransitionSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
