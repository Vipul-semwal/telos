import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks } from "@/modules/tasks/schema";
import { TaskYardService } from "@/modules/task-yard/service";
import { recallCards, taskYardNotes } from "@/modules/task-yard/schema";
import {
  notificationDeliveries,
  notificationOccurrences,
  notificationSchedules,
  notifications,
} from "@/modules/notifications/schema";
import { NotificationService, NotifyService } from "@/modules/notifications/service";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_A = `yard-int-a-${SUFFIX}`;
const USER_B = `yard-int-b-${SUFFIX}`;
let taskAId: string;
let taskBId: string;

function dueSchedule() {
  const now = new Date(Date.now() - 60_000);
  return {
    startDate: now.toISOString().slice(0, 10),
    startTime: now.toISOString().slice(11, 16),
    timezone: "UTC",
    recurrence: { type: "once" as const },
    endDate: null,
    occurrenceLimit: null,
  };
}

async function seed() {
  await db.insert(user).values([
    {
      id: USER_A,
      name: "Yard A",
      email: `yard-a-${SUFFIX}@telos.internal`,
      username: `yard_a_${SUFFIX}`,
    },
    {
      id: USER_B,
      name: "Yard B",
      email: `yard-b-${SUFFIX}@telos.internal`,
      username: `yard_b_${SUFFIX}`,
    },
  ]);
  const [disciplineA] = await db
    .insert(disciplines)
    .values({ userId: USER_A, title: "Yard Discipline A" })
    .returning();
  const [disciplineB] = await db
    .insert(disciplines)
    .values({ userId: USER_B, title: "Yard Discipline B" })
    .returning();
  const [projectA] = await db
    .insert(projects)
    .values({
      userId: USER_A,
      disciplineId: disciplineA.id,
      title: "Yard Project A",
    })
    .returning();
  const [projectB] = await db
    .insert(projects)
    .values({
      userId: USER_B,
      disciplineId: disciplineB.id,
      title: "Yard Project B",
    })
    .returning();
  const [taskA] = await db
    .insert(tasks)
    .values({ userId: USER_A, projectId: projectA.id, title: "Yard Task A" })
    .returning();
  const [taskB] = await db
    .insert(tasks)
    .values({ userId: USER_B, projectId: projectB.id, title: "Yard Task B" })
    .returning();
  taskAId = taskA.id;
  taskBId = taskB.id;
}

beforeAll(seed);

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [USER_A, USER_B]));
});

describe("Task Yard and shared notifications", () => {
  it("creates TL;DR, sanitized rich-text notes, and persistent recall cards", async () => {
    await TaskYardService.updateTldr(USER_A, taskAId, "Remember the release constraints.");
    const note = await TaskYardService.createNote(USER_A, taskAId, {
      title: "Reference",
      contentHtml:
        '<p>Keep <strong>formatting</strong>.</p><script>alert("x")</script><a href="javascript:alert(1)">bad</a>',
    });
    expect(note.contentHtml).toContain("<strong>formatting</strong>");
    expect(note.contentHtml).not.toContain("<script");
    expect(note.contentHtml).not.toContain("javascript:");

    const card = await TaskYardService.createCard(USER_A, taskAId, {
      cardType: "flashcard",
      title: "TCP handshake",
      prompt: "What are the TCP handshake steps?",
      answer: "SYN, SYN-ACK, ACK",
      content: null,
    });
    const review = await TaskYardService.reviewCard(USER_A, taskAId, card.id, {
      result: "remembered",
    });
    expect(review.result).toBe("remembered");

    const workspace = await TaskYardService.getWorkspace(USER_A, taskAId);
    expect(workspace.yard.tldr).toContain("release constraints");
    expect(workspace.notes).toHaveLength(1);
    expect(workspace.cards).toHaveLength(1);
    expect(workspace.reviews[0].cardId).toBe(card.id);
  });

  it("schedules one persistent card and surfaces the same card in Cockpit", async () => {
    const workspace = await TaskYardService.getWorkspace(USER_A, taskAId);
    const card = workspace.cards[0];
    await TaskYardService.scheduleCard(USER_A, taskAId, card.id, dueSchedule());

    const cards = await db
      .select()
      .from(recallCards)
      .where(and(eq(recallCards.userId, USER_A), eq(recallCards.taskYardId, workspace.yard.id)));
    expect(cards).toHaveLength(1);

    const due = await TaskYardService.getDueItems(USER_A);
    expect(due.items.some((item) => item.sourceId === card.id)).toBe(true);
  });

  it("uses one engine for standalone Notify notifications", async () => {
    const notification = await NotifyService.createNotification(USER_A, {
      title: "Standalone reminder",
      message: "Check the release.",
      associationType: null,
      associationId: null,
      schedule: dueSchedule(),
    });
    const due = await NotifyService.getDueItems(USER_A);
    const item = due.items.find((entry) => entry.sourceId === notification.id);
    expect(item).toBeDefined();

    await NotificationService.markRead(USER_A, item!.occurrenceId);
    const [delivery] = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.occurrenceId, item!.occurrenceId));
    expect(delivery.status).toBe("read");

    const [source] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id));
    expect(source.status).toBe("active");
  });

  it("deduplicates recurring occurrence generation", async () => {
    const now = new Date();
    const notification = await NotifyService.createNotification(USER_A, {
      title: "Daily audit",
      schedule: {
        startDate: now.toISOString().slice(0, 10),
        startTime: now.toISOString().slice(11, 16),
        timezone: "UTC",
        recurrence: { type: "daily" },
        endDate: null,
        occurrenceLimit: 5,
      },
    });
    await Promise.all([
      NotificationService.materializeForUser(USER_A),
      NotificationService.materializeForUser(USER_A),
    ]);
    const occurrences = await db
      .select()
      .from(notificationOccurrences)
      .where(
        and(
          eq(notificationOccurrences.userId, USER_A),
          eq(notificationOccurrences.sourceId, notification.id),
        ),
      );
    expect(occurrences.length).toBeLessThanOrEqual(5);
    expect(new Set(occurrences.map((item) => item.scheduledFor.getTime())).size).toBe(
      occurrences.length,
    );
  });

  it("pauses, resumes, snoozes, and completes scheduled occurrences", async () => {
    const notification = await NotifyService.createNotification(USER_A, {
      title: "Lifecycle controls",
      schedule: {
        ...dueSchedule(),
        recurrence: { type: "daily" as const },
      },
    });
    let due = await NotifyService.getDueItems(USER_A);
    const occurrence = due.items.find((item) => item.sourceId === notification.id);
    expect(occurrence).toBeDefined();

    await NotifyService.pause(USER_A, notification.id);
    due = await NotifyService.getDueItems(USER_A);
    expect(due.items.some((item) => item.sourceId === notification.id)).toBe(false);

    await NotifyService.resume(USER_A, notification.id);
    await NotificationService.snoozeOccurrence(USER_A, occurrence!.occurrenceId, 10);
    due = await NotifyService.getDueItems(USER_A);
    expect(due.items.some((item) => item.sourceId === notification.id)).toBe(false);

    await NotificationService.completeOccurrence(USER_A, occurrence!.occurrenceId);
    const [completed] = await db
      .select()
      .from(notificationOccurrences)
      .where(eq(notificationOccurrences.id, occurrence!.occurrenceId));
    expect(completed.status).toBe("completed");

    const [source] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id));
    expect(source.status).toBe("active");
  });

  it("rescheduling cancels prior occurrences and ending recurrence stops future work", async () => {
    const notification = await NotifyService.createNotification(USER_A, {
      title: "Reschedule me",
      schedule: dueSchedule(),
    });
    await NotifyService.updateNotification(USER_A, notification.id, {
      schedule: {
        startDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
        startTime: "09:00",
        timezone: "UTC",
        recurrence: { type: "daily" },
        endDate: null,
        occurrenceLimit: null,
      },
    });

    const schedules = await db
      .select()
      .from(notificationSchedules)
      .where(
        and(
          eq(notificationSchedules.userId, USER_A),
          eq(notificationSchedules.sourceId, notification.id),
        ),
      );
    const active = schedules.filter((schedule) => schedule.status === "active");
    const ended = schedules.filter((schedule) => schedule.status === "ended");
    expect(active).toHaveLength(1);
    expect(ended.length).toBeGreaterThan(0);

    await NotifyService.endRecurrence(USER_A, notification.id);
    const [endedAfter] = await db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.id, active[0].id));
    expect(endedAfter.status).toBe("ended");
  });

  it("isolates Task Yard and notification records by user", async () => {
    await expect(TaskYardService.getWorkspace(USER_B, taskAId)).rejects.toThrow();
    const items = await NotifyService.list(USER_B);
    expect(items.notifications).toHaveLength(0);
    expect(items.occurrences).toHaveLength(0);
  });

  it("preserves card identity and history across scheduling", async () => {
    const workspace = await TaskYardService.getWorkspace(USER_A, taskAId);
    const cardId = workspace.cards[0].id;
    const schedules = await db
      .select()
      .from(notificationSchedules)
      .where(
        and(
          eq(notificationSchedules.userId, USER_A),
          eq(notificationSchedules.sourceId, cardId),
        ),
      );
    expect(schedules.length).toBeGreaterThan(0);
    const reviews = await db
      .select()
      .from(recallCards)
      .where(eq(recallCards.id, cardId));
    expect(reviews).toHaveLength(1);
  });
});
