import { and, asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "../auth/schema";
import { projects } from "../projects/schema";
import { tasks } from "../tasks/schema";
import { DailyPlanningService } from "../daily-planning/service";
import { ProjectsService } from "../projects/service";
import { TasksService } from "../tasks/service";
import {
  ConflictError,
  DomainError,
  ValidationError,
} from "@/shared/errors/domain-error";
import { getTodayDateString } from "@/shared/utils/date";
import {
  routineOccurrences,
  routines,
  routineVariants,
} from "./schema";
import {
  createRoutineSchema,
  updateRoutineSchema,
  type CreateRoutineInput,
  type UpdateRoutineInput,
} from "./validation";

const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function isoWeekday(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export class RoutineService {
  static async create(userId: string, input: CreateRoutineInput) {
    const validated = createRoutineSchema.parse(input);
    const project = await ProjectsService.getById(userId, validated.projectId);

    if (project.status !== "active") {
      throw new ValidationError("Routines can only be created under active projects.");
    }

    return db.transaction(async (tx) => {
      const [routine] = await tx
        .insert(routines)
        .values({
          userId,
          projectId: project.id,
          title: validated.title,
          startDate: validated.startDate,
          endDate: validated.endDate ?? null,
        })
        .returning();

      for (const variant of validated.variants) {
        const task = await TasksService.create(
          userId,
          {
            projectId: project.id,
            title: variant.title,
            kind: "routine",
            description:
              variant.instructions ??
              `${WEEKDAY_LABELS[variant.weekday - 1]} exercise in the ${routine.title} routine.`,
            estimatedDurationSeconds: variant.plannedDurationSeconds,
            priority: "medium",
          },
          tx,
        );

        await tx.insert(routineVariants).values({
          userId,
          routineId: routine.id,
          weekday: variant.weekday,
          taskId: task.id,
          plannedDurationSeconds: variant.plannedDurationSeconds,
          instructions: variant.instructions ?? null,
        });
      }

      return routine;
    });
  }

  static async list(userId: string) {
    const rows = await db
      .select({
        routine: routines,
        projectTitle: projects.title,
        variant: routineVariants,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
      })
      .from(routines)
      .innerJoin(
        projects,
        and(eq(routines.projectId, projects.id), eq(projects.userId, userId)),
      )
      .leftJoin(
        routineVariants,
        and(
          eq(routineVariants.routineId, routines.id),
          eq(routineVariants.userId, userId),
        ),
      )
      .leftJoin(tasks, eq(routineVariants.taskId, tasks.id))
      .where(eq(routines.userId, userId))
      .orderBy(asc(routines.createdAt), asc(routineVariants.weekday));

    const grouped = new Map<
      string,
      {
        id: string;
        title: string;
        status: string;
        projectId: string;
        projectTitle: string;
        startDate: string;
        endDate: string | null;
        variants: {
          id: string;
          weekday: number;
          weekdayLabel: string;
          taskId: string;
          title: string;
          description: string | null;
          plannedDurationSeconds: number;
        }[];
      }
    >();

    for (const row of rows) {
      let routine = grouped.get(row.routine.id);
      if (!routine) {
        routine = {
          id: row.routine.id,
          title: row.routine.title,
          status: row.routine.status,
          projectId: row.routine.projectId,
          projectTitle: row.projectTitle,
          startDate: row.routine.startDate,
          endDate: row.routine.endDate,
          variants: [],
        };
        grouped.set(row.routine.id, routine);
      }

      if (row.variant && row.taskTitle) {
        routine.variants.push({
          id: row.variant.id,
          weekday: row.variant.weekday,
          weekdayLabel: WEEKDAY_LABELS[row.variant.weekday - 1] ?? "Unknown",
          taskId: row.variant.taskId,
          title: row.taskTitle,
          description: row.taskDescription,
          plannedDurationSeconds: row.variant.plannedDurationSeconds,
        });
      }
    }

    return [...grouped.values()];
  }

  static async updateStatus(
    userId: string,
    routineId: string,
    input: UpdateRoutineInput,
  ) {
    const validated = updateRoutineSchema.parse(input);
    const [updated] = await db
      .update(routines)
      .set({ status: validated.status, updatedAt: new Date() })
      .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
      .returning();

    if (!updated) {
      throw new ValidationError("Routine not found.");
    }
    return updated;
  }

  /**
   * Materialize today's weekday variants into Today's Plan.
   * User locking, occurrence uniqueness, and the daily plan task uniqueness
   * make this safe to call on every dashboard request.
   */
  static async materializeForUser(userId: string, now = new Date()) {
    const date = getTodayDateString(now);
    const weekday = isoWeekday(date);

    return db.transaction(async (tx) => {
      await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .for("update");

      const activeRoutines = await tx
        .select()
        .from(routines)
        .where(and(eq(routines.userId, userId), eq(routines.status, "active")));

      for (const routine of activeRoutines) {
        if (
          routine.startDate > date ||
          (routine.endDate && routine.endDate < date)
        ) {
          continue;
        }

        const [variant] = await tx
          .select()
          .from(routineVariants)
          .where(
            and(
              eq(routineVariants.routineId, routine.id),
              eq(routineVariants.userId, userId),
              eq(routineVariants.weekday, weekday),
            ),
          );

        if (!variant) continue;

        const [occurrence] = await tx
          .insert(routineOccurrences)
          .values({
            userId,
            routineId: routine.id,
            variantId: variant.id,
            taskId: variant.taskId,
            localDate: date,
            plannedDurationSeconds: variant.plannedDurationSeconds,
          })
          .onConflictDoNothing()
          .returning();

        if (!occurrence) continue;

        try {
          await DailyPlanningService.addTaskToPlan(
            userId,
            {
              date,
              taskId: variant.taskId,
              plannedDurationSeconds: variant.plannedDurationSeconds,
            },
            {
              executor: tx,
              sourceType: "routine",
              routineOccurrenceId: occurrence.id,
            },
          );
        } catch (error) {
          if (!(error instanceof DomainError)) throw error;
          await tx
            .update(routineOccurrences)
            .set({
              status: error instanceof ConflictError ? "planned" : "blocked",
              failureReason: error.message,
              updatedAt: new Date(),
            })
            .where(eq(routineOccurrences.id, occurrence.id));
        }
      }
    });
  }
}
