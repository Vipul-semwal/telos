import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const routineVariantInputSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  title: z.string().trim().min(1, "Exercise name is required").max(255),
  plannedDurationSeconds: z
    .number()
    .int()
    .min(60, "Duration must be at least one minute")
    .max(14_400, "Duration cannot exceed four hours"),
  instructions: z.string().trim().max(5000).optional().nullable(),
});

export const createRoutineSchema = z
  .object({
    projectId: z.string().uuid("Invalid project ID"),
    title: z.string().trim().min(1, "Routine name is required").max(255),
    startDate: z.string().regex(dateRegex, "Use a valid start date"),
    endDate: z.string().regex(dateRegex, "Use a valid end date").optional().nullable(),
    variants: z.array(routineVariantInputSchema).min(1).max(7),
  })
  .superRefine((value, context) => {
    const weekdays = new Set<number>();
    for (const variant of value.variants) {
      if (weekdays.has(variant.weekday)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "Each weekday can appear only once.",
        });
      }
      weekdays.add(variant.weekday);
    }
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be before the start date.",
      });
    }
  });

export const updateRoutineSchema = z.object({
  status: z.enum(["active", "paused", "archived"]),
});

export type RoutineVariantInput = z.infer<typeof routineVariantInputSchema>;
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
