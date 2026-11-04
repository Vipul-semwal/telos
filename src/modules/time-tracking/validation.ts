import { z } from "zod";

export const startTimerSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

export const stopTimerSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID").optional(),
});

export const manualSessionSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  durationSeconds: z.number().int().positive("Duration must be positive integer seconds"),
  notes: z.string().trim().max(1000).optional(),
});

export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type StopTimerInput = z.infer<typeof stopTimerSchema>;
export type ManualSessionInput = z.infer<typeof manualSessionSchema>;
