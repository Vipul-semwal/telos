export const NOTIFICATION_SOURCE_TYPES = [
  "notify",
  "task_yard_reminder",
  "task_yard_flashcard",
] as const;

export type NotificationSourceType = (typeof NOTIFICATION_SOURCE_TYPES)[number];

export type RecurrenceRule =
  | { type: "once" }
  | { type: "daily" }
  | { type: "weekdays"; weekdays: number[] }
  | { type: "weekly"; weekdays: number[]; interval: number }
  | { type: "monthly"; dayOfMonth: number; interval: number }
  | { type: "interval"; interval: number; unit: "minutes" | "hours" | "days" };

export type ScheduleStatus = "active" | "paused" | "ended";
export type OccurrenceStatus = "scheduled" | "completed" | "dismissed" | "cancelled";
export type DeliveryStatus = "pending" | "delivered" | "read" | "failed";

export interface ScheduleInput {
  startDate: string;
  startTime: string;
  timezone: string;
  recurrence: RecurrenceRule;
  endDate?: string | null;
  occurrenceLimit?: number | null;
}

export interface CockpitNotificationItem {
  occurrenceId: string;
  scheduleId: string;
  sourceType: NotificationSourceType;
  sourceId: string;
  title: string;
  message: string | null;
  scheduledFor: string;
  effectiveDueAt: string;
  sourceHref: string | null;
  taskYardHref: string | null;
  readAt: string | null;
  deliveredAt: string | null;
  prompt?: string | null;
  answer?: string | null;
  cardType?: "flashcard" | "reminder" | "custom";
}
