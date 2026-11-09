import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const recurrenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("once") }),
  z.object({ type: z.literal("daily") }),
  z.object({
    type: z.literal("weekdays"),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  }),
  z.object({
    type: z.literal("weekly"),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1),
    interval: z.number().int().min(1).max(52).default(1),
  }),
  z.object({
    type: z.literal("monthly"),
    dayOfMonth: z.number().int().min(1).max(31),
    interval: z.number().int().min(1).max(12).default(1),
  }),
  z.object({
    type: z.literal("interval"),
    interval: z.number().int().min(1).max(365),
    unit: z.enum(["minutes", "hours", "days"]),
  }),
]);

export const scheduleInputSchema = z.object({
  startDate: z.string().regex(dateRegex, "Use a valid date"),
  startTime: z.string().regex(timeRegex, "Use a valid time"),
  timezone: z.string().min(1).max(100),
  recurrence: recurrenceSchema,
  endDate: z.string().regex(dateRegex, "Use a valid end date").nullable().optional(),
  occurrenceLimit: z.number().int().min(1).max(500).nullable().optional(),
}).superRefine((value, context) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value.timezone }).format();
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["timezone"],
      message: "Use a valid IANA timezone",
    });
  }
});

export const createNotificationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().max(5000).optional(),
  associationType: z.enum(["task", "project", "discipline"]).nullable().optional(),
  associationId: z.string().uuid().nullable().optional(),
  schedule: scheduleInputSchema,
});

export const updateNotificationSchema = createNotificationSchema.partial().extend({
  status: z.enum(["active", "paused", "completed", "archived"]).optional(),
});

export const recallCardSchema = z
  .object({
    cardType: z.enum(["flashcard", "reminder", "custom"]),
    title: z.string().trim().min(1, "Title is required").max(255),
    prompt: z.string().trim().max(5000).optional().nullable(),
    answer: z.string().trim().max(5000).optional().nullable(),
    content: z.string().trim().max(10000).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.cardType === "flashcard") {
      if (!value.prompt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prompt"],
          message: "Flashcard front is required",
        });
      }
      if (!value.answer) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["answer"],
          message: "Flashcard back is required",
        });
      }
    }
    if (value.cardType === "reminder" && !value.content) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Reminder message is required",
      });
    }
  });

export const updateRecallCardSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  prompt: z.string().trim().max(5000).optional().nullable(),
  answer: z.string().trim().max(5000).optional().nullable(),
  content: z.string().trim().max(10000).optional().nullable(),
});

export const taskYardNoteSchema = z.object({
  title: z.string().trim().max(255).optional(),
  contentHtml: z.string().min(1, "Note content is required").max(100000),
});

export const taskYardTldrSchema = z.object({
  tldr: z.string().max(5000),
});

export const reviewCardSchema = z.object({
  result: z.enum(["remembered", "forgotten", "completed", "dismissed"]),
  occurrenceId: z.string().uuid().optional(),
});

export const snoozeOccurrenceSchema = z.object({
  minutes: z.number().int().min(1).max(60 * 24 * 30),
});

export type ScheduleInput = z.infer<typeof scheduleInputSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type RecallCardInput = z.infer<typeof recallCardSchema>;
export type UpdateRecallCardInput = z.infer<typeof updateRecallCardSchema>;
