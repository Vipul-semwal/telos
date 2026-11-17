import { describe, expect, it } from "vitest";
import { MATH_ROADMAP_SEED } from "@/modules/data-seed/fixtures/math-roadmap";
import { createProjectSchema } from "@/modules/projects/validation";
import { createDisciplineSchema } from "@/modules/disciplines/validation";
import { createTaskSchema } from "@/modules/tasks/validation";
import {
  recallCardSchema,
  taskYardNoteSchema,
  taskYardTldrSchema,
} from "@/modules/notifications/validation";

describe("math roadmap seed fixture", () => {
  it("contains the confirmed one-level curriculum structure", () => {
    expect(MATH_ROADMAP_SEED.key).toBe("math-roadmap-v1");
    expect(MATH_ROADMAP_SEED.target).toEqual({
      disciplineTitle: "Tool-master",
      projectTitle: "math",
    });
    expect(MATH_ROADMAP_SEED.tasks).toHaveLength(17);
    expect(
      MATH_ROADMAP_SEED.tasks.reduce((count, task) => count + task.subtasks.length, 0),
    ).toBe(93);

    for (const task of MATH_ROADMAP_SEED.tasks) {
      expect(task.subtasks.length).toBeGreaterThan(0);
      expect(task.subtasks.length).toBeLessThanOrEqual(8);
      expect(new Set(task.subtasks.map((subtask) => subtask.title)).size).toBe(
        task.subtasks.length,
      );
    }
  });

  it("fits the domain validation limits", () => {
    const validationProjectId = "00000000-0000-4000-8000-000000000000";
    createDisciplineSchema.parse(MATH_ROADMAP_SEED.discipline);
    createProjectSchema.parse({
      disciplineId: validationProjectId,
      ...MATH_ROADMAP_SEED.project,
    });

    for (const task of MATH_ROADMAP_SEED.tasks) {
      createTaskSchema.parse({
        projectId: validationProjectId,
        title: task.title,
        description: task.description,
        estimatedDurationSeconds: task.estimatedMinutes * 60,
        priority: task.priority,
      });

      for (const subtask of task.subtasks) {
        createTaskSchema.parse({
          projectId: validationProjectId,
          parentTaskId: validationProjectId,
          title: subtask.title,
          description: subtask.description,
          estimatedDurationSeconds: subtask.estimatedMinutes * 60,
        });
      }

      if (task.taskYard?.tldr) {
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
  });

  it("contains the supplied fractions Task Yard material", () => {
    const fractions = MATH_ROADMAP_SEED.tasks.find(
      (task) => task.title === "Fractions and decimals mastery",
    );
    expect(fractions?.taskYard?.tldr).toContain("parts of a whole");
    expect(fractions?.taskYard?.notes).toHaveLength(2);
    expect(fractions?.taskYard?.flashcards).toHaveLength(8);
  });
});
