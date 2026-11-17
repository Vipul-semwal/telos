import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "../auth/schema";
import { DisciplinesService } from "../disciplines/service";
import { ProjectsService } from "../projects/service";
import { TasksService } from "../tasks/service";
import { TaskYardService } from "../task-yard/service";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../projects/validation";
import { createDisciplineSchema } from "../disciplines/validation";
import { createTaskSchema } from "../tasks/validation";
import {
  recallCardSchema,
  taskYardNoteSchema,
  taskYardTldrSchema,
} from "../notifications/validation";
import { dataSeedRuns } from "./schema";
import type {
  CurriculumSeed,
  SeedResult,
  SeedTask,
} from "./domain/types";

const VALIDATION_PROJECT_ID = "00000000-0000-4000-8000-000000000000";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function taskDescription(task: SeedTask) {
  const resources = task.resources.map((resource) => `- ${resource}`).join("\n");
  return [
    task.description,
    "",
    "Mastery gate:",
    task.masteryGate,
    "",
    "Resources:",
    resources,
  ].join("\n");
}

function masteryNote(task: SeedTask) {
  const resources = task.resources
    .map((resource) => `<li>${escapeHtml(resource)}</li>`)
    .join("");
  return `
    <p><strong>Mastery gate</strong></p>
    <p>${escapeHtml(task.masteryGate)}</p>
    <p><strong>Resources</strong></p>
    <ul>${resources}</ul>
  `.trim();
}

function validateSeed(seed: CurriculumSeed) {
  if (!/^[a-z0-9][a-z0-9_-]{2,99}$/.test(seed.key)) {
    throw new Error("Seed key must contain only lowercase letters, numbers, underscores, or hyphens.");
  }
  if (seed.target) {
    const disciplineTitle = seed.target.disciplineTitle.trim();
    const projectTitle = seed.target.projectTitle.trim();
    if (!disciplineTitle || disciplineTitle.length > 255) {
      throw new Error("Target discipline title must be between 1 and 255 characters.");
    }
    if (!projectTitle || projectTitle.length > 255) {
      throw new Error("Target project title must be between 1 and 255 characters.");
    }
  }

  createDisciplineSchema.parse(seed.discipline);
  createProjectSchema.parse({
    disciplineId: VALIDATION_PROJECT_ID,
    ...seed.project,
  });
  updateProjectSchema.parse(seed.project);

  const rootTitles = new Set<string>();
  for (const task of seed.tasks) {
    if (rootTitles.has(task.title)) {
      throw new Error(`Duplicate root task title in seed: ${task.title}`);
    }
    rootTitles.add(task.title);

    createTaskSchema.parse({
      projectId: VALIDATION_PROJECT_ID,
      title: task.title,
      description: taskDescription(task),
      estimatedDurationSeconds: task.estimatedMinutes * 60,
      priority: task.priority,
      orderIndex: 0,
    });

    const subtaskTitles = new Set<string>();
    for (const subtask of task.subtasks) {
      if (subtaskTitles.has(subtask.title)) {
        throw new Error(`Duplicate subtask title in ${task.title}: ${subtask.title}`);
      }
      subtaskTitles.add(subtask.title);

      createTaskSchema.parse({
        projectId: VALIDATION_PROJECT_ID,
        parentTaskId: VALIDATION_PROJECT_ID,
        title: subtask.title,
        description: subtask.description,
        estimatedDurationSeconds: subtask.estimatedMinutes * 60,
      });
    }

    if (task.taskYard?.tldr !== undefined) {
      taskYardTldrSchema.parse({ tldr: task.taskYard.tldr });
    }
    for (const note of task.taskYard?.notes ?? []) {
      taskYardNoteSchema.parse(note);
    }
    for (const card of task.taskYard?.flashcards ?? []) {
      recallCardSchema.parse({
        cardType: "flashcard",
        title: card.title,
        prompt: card.front,
        answer: card.back,
      });
    }
  }
}

export class DataSeedService {
  static async seedCurriculum(
    username: string,
    seed: CurriculumSeed,
  ): Promise<SeedResult> {
    validateSeed(seed);
    const normalizedUsername = username.trim().toLowerCase();

    return db.transaction(async (tx) => {
      const [targetUser] = await tx
        .select({ id: user.id, username: user.username })
        .from(user)
        .where(eq(user.username, normalizedUsername))
        .for("update");

      if (!targetUser) {
        throw new Error(
          `Cannot run ${seed.key}: user "${normalizedUsername}" does not exist.`,
        );
      }

      const [existingRun] = await tx
        .select({ id: dataSeedRuns.id })
        .from(dataSeedRuns)
        .where(
          and(
            eq(dataSeedRuns.userId, targetUser.id),
            eq(dataSeedRuns.seedKey, seed.key),
          ),
        );

      if (existingRun) {
        return {
          status: "skipped",
          seedKey: seed.key,
          username: normalizedUsername,
        };
      }

      const discipline = seed.target
        ? await DisciplinesService.findByTitle(
            targetUser.id,
            seed.target.disciplineTitle,
            tx,
          )
        : await DisciplinesService.create(
            targetUser.id,
            seed.discipline,
            tx,
          );
      if (!discipline) {
        throw new Error(
          `Cannot run ${seed.key}: discipline "${seed.target?.disciplineTitle}" was not found.`,
        );
      }

      const project = seed.target
        ? await ProjectsService.findByTitle(
            targetUser.id,
            discipline.id,
            seed.target.projectTitle,
            tx,
          )
        : await ProjectsService.create(
            targetUser.id,
            {
              disciplineId: discipline.id,
              ...seed.project,
              initialStatus: "active",
            },
            tx,
          );
      if (!project) {
        throw new Error(
          `Cannot run ${seed.key}: project "${seed.target?.projectTitle}" was not found under discipline "${seed.target?.disciplineTitle}".`,
        );
      }

      let subtaskCount = 0;
      let noteCount = 0;
      let cardCount = 0;

      for (const task of seed.tasks) {
        const createdTask = await TasksService.create(
          targetUser.id,
          {
            projectId: project.id,
            title: task.title,
            description: taskDescription(task),
            estimatedDurationSeconds: task.estimatedMinutes * 60,
            priority: task.priority,
          },
          tx,
        );

        for (const subtask of task.subtasks) {
          await TasksService.create(
            targetUser.id,
            {
              projectId: project.id,
              parentTaskId: createdTask.id,
              title: subtask.title,
              description: subtask.description,
              estimatedDurationSeconds: subtask.estimatedMinutes * 60,
            },
            tx,
          );
          subtaskCount += 1;
        }

        await TaskYardService.createNote(
          targetUser.id,
          createdTask.id,
          {
            title: "Mastery gate and resources",
            contentHtml: masteryNote(task),
          },
          tx,
        );
        noteCount += 1;

        if (task.taskYard?.tldr) {
          await TaskYardService.updateTldr(
            targetUser.id,
            createdTask.id,
            task.taskYard.tldr,
            tx,
          );
        }

        for (const note of task.taskYard?.notes ?? []) {
          await TaskYardService.createNote(
            targetUser.id,
            createdTask.id,
            note,
            tx,
          );
          noteCount += 1;
        }

        for (const card of task.taskYard?.flashcards ?? []) {
          await TaskYardService.createCard(
            targetUser.id,
            createdTask.id,
            {
              cardType: "flashcard",
              title: card.title,
              prompt: card.front,
              answer: card.back,
            },
            tx,
          );
          cardCount += 1;
        }
      }

      await tx.insert(dataSeedRuns).values({
        userId: targetUser.id,
        seedKey: seed.key,
        metadata: {
          disciplineId: discipline.id,
          projectId: project.id,
          target: seed.target ?? null,
          taskCount: seed.tasks.length,
          subtaskCount,
          noteCount,
          cardCount,
        },
      });

      return {
        status: "seeded",
        seedKey: seed.key,
        username: normalizedUsername,
        disciplineId: discipline.id,
        projectId: project.id,
        taskCount: seed.tasks.length,
        subtaskCount,
        noteCount,
        cardCount,
      };
    });
  }
}
