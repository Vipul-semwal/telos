import { Temporal } from "@js-temporal/polyfill";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { NotFoundError } from "@/shared/errors/domain-error";
import { DisciplinesService } from "../disciplines/service";
import { ProjectsService } from "../projects/service";
import { TasksService } from "../tasks/service";
import { cockpitDestination } from "./destination";
import {
  notificationDeliveries,
  notificationHistory,
  notificationOccurrences,
  notificationSchedules,
  notifications,
} from "./schema";
import {
  firstOccurrence,
  isPastEnd,
  localDateTimeToInstant,
  nextOccurrence,
  assertTimeZone,
} from "./scheduling";
import type {
  NotificationSourceType,
  RecurrenceRule,
  ScheduleInput,
} from "./domain/types";
import type {
  CreateNotificationInput,
  UpdateNotificationInput,
} from "./validation";

const HORIZON_DAYS = 30;
const MAX_MISSED_DAYS = 7;
const MAX_OCCURRENCES_PER_RUN = 100;

function endAtFor(input: ScheduleInput) {
  if (!input.endDate) return null;
  return new Date(
    Temporal.PlainDate.from(input.endDate)
      .toZonedDateTime({
        timeZone: input.timezone,
        plainTime: Temporal.PlainTime.from("23:59"),
      })
      .toInstant().epochMilliseconds,
  );
}

export class NotificationService {
  static async recordHistory(
    userId: string,
    sourceType: NotificationSourceType,
    sourceId: string,
    eventType: string,
    eventData?: unknown,
  ) {
    await db.insert(notificationHistory).values({
      userId,
      sourceType,
      sourceId,
      eventType,
      eventData: eventData ?? null,
    });
  }

  static async createSchedule(
    userId: string,
    sourceType: NotificationSourceType,
    sourceId: string,
    input: ScheduleInput,
  ) {
    assertTimeZone(input.timezone);
    const startAt = new Date(
      localDateTimeToInstant(input.startDate, input.startTime, input.timezone)
        .epochMilliseconds,
    );
    const [schedule] = await db
      .insert(notificationSchedules)
      .values({
        userId,
        sourceType,
        sourceId,
        timezone: input.timezone,
        startAt,
        nextRunAt: startAt,
        recurrence: input.recurrence,
        endAt: endAtFor(input),
        occurrenceLimit: input.occurrenceLimit ?? null,
      })
      .returning();

    await this.recordHistory(userId, sourceType, sourceId, "scheduled", {
      scheduleId: schedule.id,
      startAt,
      recurrence: input.recurrence,
      timezone: input.timezone,
    });
    await this.materializeForUser(userId);
    return schedule;
  }

  static async replaceSourceSchedules(
    userId: string,
    sourceType: NotificationSourceType,
    sourceId: string,
    input: ScheduleInput,
  ) {
    await this.endSourceSchedules(userId, sourceType, sourceId, "rescheduled");
    return this.createSchedule(userId, sourceType, sourceId, input);
  }

  static async endSourceSchedules(
    userId: string,
    sourceType: NotificationSourceType,
    sourceId: string,
    eventType = "ended",
  ) {
    const now = new Date();
    const schedules = await db
      .select({ id: notificationSchedules.id })
      .from(notificationSchedules)
      .where(
        and(
          eq(notificationSchedules.userId, userId),
          eq(notificationSchedules.sourceType, sourceType),
          eq(notificationSchedules.sourceId, sourceId),
        ),
      );
    const scheduleIds = schedules.map((schedule) => schedule.id);
    if (scheduleIds.length === 0) return;

    await db
      .update(notificationSchedules)
      .set({ status: "ended", updatedAt: now })
      .where(
        and(
          eq(notificationSchedules.userId, userId),
          inArray(notificationSchedules.id, scheduleIds),
        ),
      );
    await db
      .update(notificationOccurrences)
      .set({ status: "cancelled", updatedAt: now })
      .where(
        and(
          eq(notificationOccurrences.userId, userId),
          inArray(notificationOccurrences.scheduleId, scheduleIds),
          eq(notificationOccurrences.status, "scheduled"),
        ),
      );
    await this.recordHistory(userId, sourceType, sourceId, eventType, { scheduleIds });
  }

  static async setSourceScheduleStatus(
    userId: string,
    sourceType: NotificationSourceType,
    sourceId: string,
    status: "active" | "paused",
  ) {
    await db
      .update(notificationSchedules)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(notificationSchedules.userId, userId),
          eq(notificationSchedules.sourceType, sourceType),
          eq(notificationSchedules.sourceId, sourceId),
          ne(notificationSchedules.status, "ended"),
        ),
      );
    await this.recordHistory(userId, sourceType, sourceId, status === "paused" ? "paused" : "resumed");
  }

  static async materializeForUser(userId: string, now = new Date()) {
    const schedules = await db
      .select({ id: notificationSchedules.id })
      .from(notificationSchedules)
      .where(
        and(
          eq(notificationSchedules.userId, userId),
          ne(notificationSchedules.status, "paused"),
        ),
      );

    for (const summary of schedules) {
      await db.transaction(async (tx) => {
        const [schedule] = await tx
          .select()
          .from(notificationSchedules)
          .where(
            and(
              eq(notificationSchedules.id, summary.id),
              eq(notificationSchedules.userId, userId),
              eq(notificationSchedules.status, "active"),
            ),
          )
          .for("update");
        if (!schedule) return;

        const rule = schedule.recurrence as RecurrenceRule;
        const horizon = Temporal.Instant.fromEpochMilliseconds(
          now.getTime() + HORIZON_DAYS * 86_400_000,
        );
        const missedCutoff = Temporal.Instant.fromEpochMilliseconds(
          now.getTime() - MAX_MISSED_DAYS * 86_400_000,
        );
        let cursor = firstOccurrence(schedule.nextRunAt, schedule.timezone);
        let occurrenceCount = schedule.occurrenceCount;
        let generated = 0;
        let skippedMissed = 0;

        if (rule.type !== "once") {
          while (
            cursor.toInstant().epochMilliseconds < missedCutoff.epochMilliseconds &&
            skippedMissed < 10_000
          ) {
            const next = nextOccurrence(cursor, rule, schedule.timezone);
            if (!next) break;
            cursor = next;
            skippedMissed += 1;
          }
        }

        let ended = false;
        while (generated < MAX_OCCURRENCES_PER_RUN) {
          if (schedule.occurrenceLimit && occurrenceCount >= schedule.occurrenceLimit) {
            ended = true;
            break;
          }
          if (isPastEnd(cursor, schedule.endAt)) {
            ended = true;
            break;
          }
          if (cursor.toInstant().epochMilliseconds > horizon.epochMilliseconds) break;

          const scheduledFor = new Date(cursor.toInstant().epochMilliseconds);
          const [occurrence] = await tx
            .insert(notificationOccurrences)
            .values({
              userId,
              scheduleId: schedule.id,
              sourceType: schedule.sourceType as NotificationSourceType,
              sourceId: schedule.sourceId,
              scheduledFor,
            })
            .onConflictDoNothing()
            .returning();

          if (occurrence) {
            occurrenceCount += 1;
            generated += 1;
            await cockpitDestination.deliver(userId, occurrence.id, tx);
          }

          const next = nextOccurrence(cursor, rule, schedule.timezone);
          if (!next) {
            ended = true;
            break;
          }
          cursor = next;
        }

        await tx
          .update(notificationSchedules)
          .set({
            occurrenceCount,
            nextRunAt: new Date(cursor.toInstant().epochMilliseconds),
            status: ended ? "ended" : schedule.status,
            updatedAt: now,
          })
          .where(eq(notificationSchedules.id, schedule.id));

        if (skippedMissed > 0) {
          await tx.insert(notificationHistory).values({
            userId,
            sourceType: schedule.sourceType,
            sourceId: schedule.sourceId,
            eventType: "missed_occurrences_skipped",
            eventData: { count: skippedMissed },
          });
        }
      });
    }
  }

  static async processAll(now = new Date()) {
    const users = await db
      .selectDistinct({ userId: notificationSchedules.userId })
      .from(notificationSchedules)
      .where(eq(notificationSchedules.status, "active"));
    for (const { userId } of users) {
      await this.materializeForUser(userId, now);
    }
  }

  static async listSchedulesForSources(
    userId: string,
    sourceType: NotificationSourceType,
    sourceIds: string[],
  ) {
    if (sourceIds.length === 0) return [];
    return db
      .select()
      .from(notificationSchedules)
      .where(
        and(
          eq(notificationSchedules.userId, userId),
          eq(notificationSchedules.sourceType, sourceType),
          inArray(notificationSchedules.sourceId, sourceIds),
        ),
      )
      .orderBy(desc(notificationSchedules.createdAt));
  }

  static async listOccurrencesForSources(
    userId: string,
    sourceType: NotificationSourceType,
    sourceIds: string[],
  ) {
    if (sourceIds.length === 0) return [];
    return db
      .select()
      .from(notificationOccurrences)
      .where(
        and(
          eq(notificationOccurrences.userId, userId),
          eq(notificationOccurrences.sourceType, sourceType),
          inArray(notificationOccurrences.sourceId, sourceIds),
        ),
      )
      .orderBy(desc(notificationOccurrences.scheduledFor));
  }

  static async getDueOccurrences(userId: string, now = new Date()) {
    await this.materializeForUser(userId, now);
    const rows = await db
      .select({
        occurrence: notificationOccurrences,
        sourceStatus: notificationSchedules.status,
        deliveryStatus: notificationDeliveries.status,
        deliveredAt: notificationDeliveries.deliveredAt,
        readAt: notificationDeliveries.readAt,
      })
      .from(notificationOccurrences)
      .innerJoin(
        notificationSchedules,
        eq(notificationOccurrences.scheduleId, notificationSchedules.id),
      )
      .leftJoin(
        notificationDeliveries,
        and(
          eq(notificationDeliveries.occurrenceId, notificationOccurrences.id),
          eq(notificationDeliveries.destination, "cockpit"),
        ),
      )
      .where(
        and(
          eq(notificationOccurrences.userId, userId),
          eq(notificationOccurrences.status, "scheduled"),
          ne(notificationSchedules.status, "paused"),
        ),
      )
      .orderBy(notificationOccurrences.scheduledFor);

    return rows
      .filter(({ occurrence }) => {
        const effectiveDue = occurrence.snoozedUntil ?? occurrence.scheduledFor;
        return new Date(effectiveDue).getTime() <= now.getTime();
      })
      .map((row) => ({
        ...row.occurrence,
        effectiveDueAt: row.occurrence.snoozedUntil ?? row.occurrence.scheduledFor,
        deliveryStatus: row.deliveryStatus,
        deliveredAt: row.deliveredAt,
        readAt: row.readAt,
      }));
  }

  static async listOccurrencesForUser(userId: string, now = new Date()) {
    await this.materializeForUser(userId, now);
    return db
      .select()
      .from(notificationOccurrences)
      .where(eq(notificationOccurrences.userId, userId))
      .orderBy(desc(notificationOccurrences.scheduledFor));
  }

  static async getSchedulesForUser(userId: string) {
    return db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.userId, userId))
      .orderBy(desc(notificationSchedules.createdAt));
  }

  static async markDelivered(userId: string, occurrenceIds: string[]) {
    if (occurrenceIds.length === 0) return;
    await db
      .update(notificationDeliveries)
      .set({ status: "delivered", deliveredAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          eq(notificationDeliveries.destination, "cockpit"),
          eq(notificationDeliveries.status, "pending"),
          inArray(notificationDeliveries.occurrenceId, occurrenceIds),
        ),
      );
  }

  static async markRead(userId: string, occurrenceId: string) {
    await this.assertOccurrenceOwner(userId, occurrenceId);
    await cockpitDestination.markRead(userId, occurrenceId);
  }

  static async snoozeOccurrence(userId: string, occurrenceId: string, minutes: number) {
    const occurrence = await this.assertOccurrenceOwner(userId, occurrenceId);
    const snoozedUntil = new Date(Date.now() + minutes * 60_000);
    await db.transaction(async (tx) => {
      await tx
        .update(notificationOccurrences)
        .set({ snoozedUntil, status: "scheduled", updatedAt: new Date() })
        .where(
          and(
            eq(notificationOccurrences.id, occurrence.id),
            eq(notificationOccurrences.userId, userId),
          ),
        );
      await tx
        .update(notificationDeliveries)
        .set({
          status: "pending",
          readAt: null,
          deliveredAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notificationDeliveries.userId, userId),
            eq(notificationDeliveries.occurrenceId, occurrenceId),
            eq(notificationDeliveries.destination, "cockpit"),
          ),
        );
    });
    await this.recordHistory(userId, occurrence.sourceType as NotificationSourceType, occurrence.sourceId, "snoozed", {
      occurrenceId,
      minutes,
      snoozedUntil,
    });
  }

  static async completeOccurrence(userId: string, occurrenceId: string) {
    return this.resolveOccurrence(userId, occurrenceId, "completed");
  }

  static async dismissOccurrence(userId: string, occurrenceId: string) {
    return this.resolveOccurrence(userId, occurrenceId, "dismissed");
  }

  private static async resolveOccurrence(
    userId: string,
    occurrenceId: string,
    status: "completed" | "dismissed",
  ) {
    const occurrence = await this.assertOccurrenceOwner(userId, occurrenceId);
    const now = new Date();
    await db
      .update(notificationOccurrences)
      .set({
        status,
        completedAt: status === "completed" ? now : null,
        dismissedAt: status === "dismissed" ? now : null,
        updatedAt: now,
      })
      .where(
        and(
          eq(notificationOccurrences.id, occurrenceId),
          eq(notificationOccurrences.userId, userId),
        ),
      );
    await cockpitDestination.markRead(userId, occurrenceId);
    await this.recordHistory(
      userId,
      occurrence.sourceType as NotificationSourceType,
      occurrence.sourceId,
      status,
      { occurrenceId },
    );
    return occurrence;
  }

  static async assertOccurrenceOwner(userId: string, occurrenceId: string) {
    const [occurrence] = await db
      .select()
      .from(notificationOccurrences)
      .where(
        and(
          eq(notificationOccurrences.id, occurrenceId),
          eq(notificationOccurrences.userId, userId),
        ),
      );
    if (!occurrence) throw new Error("Notification occurrence not found");
    return occurrence;
  }
}

export class NotifyService {
  static async createNotification(userId: string, input: CreateNotificationInput) {
    await this.validateAssociation(userId, input.associationType, input.associationId);
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title: input.title,
        message: input.message || null,
        taskId: input.associationType === "task" ? input.associationId : null,
        projectId: input.associationType === "project" ? input.associationId : null,
        disciplineId: input.associationType === "discipline" ? input.associationId : null,
      })
      .returning();

    try {
      await NotificationService.createSchedule(userId, "notify", notification.id, input.schedule as ScheduleInput);
    } catch (error) {
      await db.delete(notifications).where(eq(notifications.id, notification.id));
      throw error;
    }
    await NotificationService.recordHistory(userId, "notify", notification.id, "created", input);
    return notification;
  }

  static async updateNotification(
    userId: string,
    id: string,
    input: UpdateNotificationInput,
  ) {
    const notification = await this.getById(userId, id);
    await this.validateAssociation(userId, input.associationType, input.associationId);
    const [updated] = await db
      .update(notifications)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.message !== undefined ? { message: input.message || null } : {}),
        ...(input.associationType !== undefined
          ? {
              taskId: input.associationType === "task" ? input.associationId : null,
              projectId: input.associationType === "project" ? input.associationId : null,
              disciplineId:
                input.associationType === "discipline" ? input.associationId : null,
            }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(notifications.id, notification.id), eq(notifications.userId, userId)))
      .returning();

    if (input.schedule) {
      await NotificationService.replaceSourceSchedules(
        userId,
        "notify",
        id,
        input.schedule as ScheduleInput,
      );
    }
    if (input.status === "paused" || input.status === "active") {
      await NotificationService.setSourceScheduleStatus(userId, "notify", id, input.status);
    }
    await NotificationService.recordHistory(userId, "notify", id, "updated", input);
    return updated;
  }

  static async getById(userId: string, id: string) {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    if (!notification) throw new NotFoundError("Notification", id);
    return notification;
  }

  static async list(userId: string) {
    await NotificationService.materializeForUser(userId);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    const schedules = await NotificationService.getSchedulesForUser(userId);
    const occurrences = await NotificationService.listOccurrencesForUser(userId);
    const occurrenceIds = occurrences.map((occurrence) => occurrence.id);
    const deliveries =
      occurrenceIds.length > 0
        ? await db
            .select()
            .from(notificationDeliveries)
            .where(
              and(
                eq(notificationDeliveries.userId, userId),
                inArray(notificationDeliveries.occurrenceId, occurrenceIds),
              ),
            )
        : [];
    const history = await db
      .select()
      .from(notificationHistory)
      .where(eq(notificationHistory.userId, userId))
      .orderBy(desc(notificationHistory.createdAt))
      .limit(100);
    return {
      notifications: rows,
      schedules,
      occurrences,
      deliveries,
      history,
    };
  }

  static async pause(userId: string, id: string) {
    return this.updateNotification(userId, id, { status: "paused" });
  }

  static async resume(userId: string, id: string) {
    return this.updateNotification(userId, id, { status: "active" });
  }

  static async endRecurrence(userId: string, id: string) {
    await this.getById(userId, id);
    await NotificationService.endSourceSchedules(userId, "notify", id);
  }

  static async complete(userId: string, id: string) {
    await this.getById(userId, id);
    const now = new Date();
    await db
      .update(notifications)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    await NotificationService.endSourceSchedules(userId, "notify", id, "completed");
    await NotificationService.recordHistory(userId, "notify", id, "completed");
  }

  static async delete(userId: string, id: string) {
    await this.getById(userId, id);
    await db.transaction(async (tx) => {
      const scheduleIds = (
        await tx
          .select({ id: notificationSchedules.id })
          .from(notificationSchedules)
          .where(
            and(
              eq(notificationSchedules.userId, userId),
              eq(notificationSchedules.sourceType, "notify"),
              eq(notificationSchedules.sourceId, id),
            ),
          )
      ).map((schedule) => schedule.id);
      if (scheduleIds.length > 0) {
        await tx
          .delete(notificationOccurrences)
          .where(inArray(notificationOccurrences.scheduleId, scheduleIds));
        await tx
          .delete(notificationSchedules)
          .where(inArray(notificationSchedules.id, scheduleIds));
      }
      await tx.delete(notifications).where(eq(notifications.id, id));
    });
  }

  static async getDueItems(
    userId: string,
    preloadedRows?: Awaited<ReturnType<typeof NotificationService.getDueOccurrences>>,
  ) {
    const rows = preloadedRows ?? (await NotificationService.getDueOccurrences(userId));
    const notificationRows = rows.filter((row) => row.sourceType === "notify");
    if (notificationRows.length === 0) {
      return {
        items: [] as Array<{
          occurrenceId: string;
          sourceId: string;
          title: string;
          message: string | null;
          sourceHref: string | null;
          taskYardHref: null;
          dueAt: string;
          readAt: Date | null;
        }>,
        occurrenceIds: [] as string[],
      };
    }
    const ids = notificationRows.map((row) => row.sourceId);
    const sourceRows = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), inArray(notifications.id, ids)),
      );
    const sourceMap = new Map(sourceRows.map((source) => [source.id, source]));
    const items = notificationRows.flatMap((row) => {
      const source = sourceMap.get(row.sourceId);
      if (!source || source.status === "archived") return [];
      const sourceHref = source.taskId
        ? `/tasks/${source.taskId}/yard`
        : source.projectId
          ? `/projects/${source.projectId}`
          : source.disciplineId
            ? "/disciplines"
            : "/notify";
      return [
        {
          occurrenceId: row.id,
          sourceId: source.id,
          title: source.title,
          message: source.message,
          sourceHref,
          taskYardHref: source.taskId ? `/tasks/${source.taskId}/yard` : null,
          dueAt: new Date(row.effectiveDueAt).toISOString(),
          readAt: row.readAt,
        },
      ];
    });
    return { items, occurrenceIds: items.map((item) => item.occurrenceId) };
  }

  private static async validateAssociation(
    userId: string,
    type: "task" | "project" | "discipline" | null | undefined,
    id: string | null | undefined,
  ) {
    if (!type && !id) return;
    if (!type || !id) throw new Error("Both association type and id are required");
    if (type === "task") await TasksService.getById(userId, id);
    if (type === "project") await ProjectsService.getById(userId, id);
    if (type === "discipline") await DisciplinesService.getById(userId, id);
  }
}
