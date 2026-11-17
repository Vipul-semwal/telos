import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { dataSeedRuns } from "@/modules/data-seed/schema";
import { DataSeedService } from "@/modules/data-seed/service";
import type { CurriculumSeed } from "@/modules/data-seed/domain/types";
import { MATH_ROADMAP_SEED } from "@/modules/data-seed/fixtures/math-roadmap";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks } from "@/modules/tasks/schema";
import { recallCards, taskYardNotes } from "@/modules/task-yard/schema";

const SUFFIX = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const USER_A = `data-seed-a-${SUFFIX}`;
const USER_B = `data-seed-b-${SUFFIX}`;
const USER_C = `data-seed-c-${SUFFIX}`;
const USER_D = `data-seed-d-${SUFFIX}`;
const SEED_KEY = `integration_seed_${SUFFIX}`;

const fixture: CurriculumSeed = {
  key: SEED_KEY,
  discipline: {
    title: "Integration Seed Discipline",
    description: "A temporary discipline used to verify one-time imports.",
  },
  project: {
    title: "Integration Seed Project",
    description: "A temporary project used to verify transactional seeding.",
    desiredOutcome: "The seed imports once, stays owned by one user, and never duplicates.",
  },
  tasks: [
    {
      title: "Integration Seed Task",
      description: "A temporary root task with complete Task Yard material.",
      estimatedMinutes: 45,
      priority: "high",
      masteryGate: "The task and all nested records remain attached to the same user.",
      resources: ["Temporary integration fixture"],
      subtasks: [
        {
          title: "Integration Seed Subtask",
          description: "A temporary subtask that confirms one-level nesting.",
          estimatedMinutes: 20,
        },
      ],
      taskYard: {
        tldr: "A compact summary for the integration test.",
        notes: [
          {
            title: "Integration note",
            contentHtml: "<p>Rich text survives the import.</p>",
          },
        ],
        flashcards: [
          {
            title: "Integration card",
            front: "What should happen on a second run?",
            back: "The seed should skip without creating duplicates.",
          },
        ],
      },
    },
  ],
};

beforeAll(async () => {
  await db.insert(user).values([
    {
      id: USER_A,
      name: "Data Seed A",
      email: `data-seed-a-${SUFFIX}@telos.internal`,
      username: `data_seed_a_${SUFFIX}`,
    },
    {
      id: USER_B,
      name: "Data Seed B",
      email: `data-seed-b-${SUFFIX}@telos.internal`,
      username: `data_seed_b_${SUFFIX}`,
    },
    {
      id: USER_C,
      name: "Data Seed C",
      email: `data-seed-c-${SUFFIX}@telos.internal`,
      username: `data_seed_c_${SUFFIX}`,
    },
    {
      id: USER_D,
      name: "Data Seed D",
      email: `data-seed-d-${SUFFIX}@telos.internal`,
      username: `data_seed_d_${SUFFIX}`,
    },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, USER_A));
  await db.delete(user).where(eq(user.id, USER_B));
  await db.delete(user).where(eq(user.id, USER_C));
  await db.delete(user).where(eq(user.id, USER_D));
});

describe("one-time curriculum seed", () => {
  it("imports transactionally and skips later runs", async () => {
    const first = await DataSeedService.seedCurriculum(
      `data_seed_a_${SUFFIX}`,
      fixture,
    );
    expect(first.status).toBe("seeded");
    expect(first.taskCount).toBe(1);
    expect(first.subtaskCount).toBe(1);
    expect(first.noteCount).toBe(2);
    expect(first.cardCount).toBe(1);

    const second = await DataSeedService.seedCurriculum(
      `data_seed_a_${SUFFIX}`,
      fixture,
    );
    expect(second.status).toBe("skipped");

    const [seedRun] = await db
      .select()
      .from(dataSeedRuns)
      .where(
        and(
          eq(dataSeedRuns.userId, USER_A),
          eq(dataSeedRuns.seedKey, SEED_KEY),
        ),
      );
    expect(seedRun).toBeDefined();

    const [disciplineCount] = await db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(and(eq(disciplines.userId, USER_A), eq(disciplines.title, fixture.discipline.title)));
    expect(disciplineCount).toBeDefined();

    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, USER_A));
    expect(projectRows).toHaveLength(1);

    const taskRows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, USER_A));
    expect(taskRows).toHaveLength(2);

    const notes = await db
      .select()
      .from(taskYardNotes)
      .where(eq(taskYardNotes.userId, USER_A));
    expect(notes).toHaveLength(2);

    const cards = await db
      .select()
      .from(recallCards)
      .where(eq(recallCards.userId, USER_A));
    expect(cards).toHaveLength(1);
  });

  it("does not attach seeded data to another user", async () => {
    const [foreignDiscipline] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.userId, USER_B));
    expect(foreignDiscipline).toBeUndefined();
  });

  it("imports the complete mathematics curriculum", async () => {
    const [targetDiscipline] = await db
      .insert(disciplines)
      .values({ userId: USER_C, title: "Tool-master" })
      .returning();
    const [targetProject] = await db
      .insert(projects)
      .values({
        userId: USER_C,
        disciplineId: targetDiscipline.id,
        title: "math",
        description: "Existing project content must remain unchanged.",
      })
      .returning();

    const result = await DataSeedService.seedCurriculum(
      `data_seed_c_${SUFFIX}`,
      MATH_ROADMAP_SEED,
    );

    expect(result.status).toBe("seeded");
    expect(result.taskCount).toBe(17);
    expect(result.subtaskCount).toBe(93);
    expect(result.noteCount).toBe(19);
    expect(result.cardCount).toBe(8);
    expect(result.projectId).toBe(targetProject.id);

    const taskRows = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.userId, USER_C));
    const noteRows = await db
      .select({ id: taskYardNotes.id })
      .from(taskYardNotes)
      .where(eq(taskYardNotes.userId, USER_C));
    const cardRows = await db
      .select({ id: recallCards.id })
      .from(recallCards)
      .where(eq(recallCards.userId, USER_C));

    expect(taskRows).toHaveLength(110);
    expect(noteRows).toHaveLength(19);
    expect(cardRows).toHaveLength(8);

    const disciplineRows = await db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(eq(disciplines.userId, USER_C));
    const projectRows = await db
      .select({ id: projects.id, description: projects.description })
      .from(projects)
      .where(eq(projects.userId, USER_C));
    expect(disciplineRows).toHaveLength(1);
    expect(projectRows).toEqual([
      {
        id: targetProject.id,
        description: "Existing project content must remain unchanged.",
      },
    ]);
  });

  it("appends to an existing project without changing existing task order", async () => {
    const [targetDiscipline] = await db
      .insert(disciplines)
      .values({ userId: USER_D, title: "Tool-master" })
      .returning();
    const [targetProject] = await db
      .insert(projects)
      .values({
        userId: USER_D,
        disciplineId: targetDiscipline.id,
        title: "math",
        description: "Pre-existing project",
      })
      .returning();
    const [existingTask] = await db
      .insert(tasks)
      .values({
        userId: USER_D,
        projectId: targetProject.id,
        title: "Existing task",
        orderIndex: 7,
      })
      .returning();

    const targetedFixture: CurriculumSeed = {
      ...fixture,
      key: `integration_existing_${SUFFIX}`,
      target: {
        disciplineTitle: "Tool-master",
        projectTitle: "math",
      },
    };
    const first = await DataSeedService.seedCurriculum(
      `data_seed_d_${SUFFIX}`,
      targetedFixture,
    );
    expect(first.status).toBe("seeded");
    expect(first.projectId).toBe(targetProject.id);

    const second = await DataSeedService.seedCurriculum(
      `data_seed_d_${SUFFIX}`,
      targetedFixture,
    );
    expect(second.status).toBe("skipped");

    const disciplineRows = await db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(eq(disciplines.userId, USER_D));
    const projectRows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, USER_D));
    expect(disciplineRows).toEqual([{ id: targetDiscipline.id }]);
    expect(projectRows).toEqual([{ id: targetProject.id }]);

    const [preservedTask] = await db
      .select({ id: tasks.id, orderIndex: tasks.orderIndex })
      .from(tasks)
      .where(eq(tasks.id, existingTask.id));
    expect(preservedTask.orderIndex).toBe(7);
  });
});
