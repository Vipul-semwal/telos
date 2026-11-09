import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks } from "@/modules/tasks/schema";
import { brainDumpItems } from "@/modules/brain-dump/schema";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { NotFoundError } from "@/shared/errors/domain-error";
import { inArray, eq } from "drizzle-orm";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_A_ID = `bd-int-a-${SUFFIX}`;
const USER_B_ID = `bd-int-b-${SUFFIX}`;

let disciplineAId: string;
let projectAId: string;
let projectBId: string;

async function seedBase() {
  await db
    .insert(user)
    .values([
      {
        id: USER_A_ID,
        name: "Brain Dump A",
        email: `bd-a-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `bd_a_${SUFFIX}`,
      },
      {
        id: USER_B_ID,
        name: "Brain Dump B",
        email: `bd-b-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `bd_b_${SUFFIX}`,
      },
    ])
    .onConflictDoNothing();

  const [discA] = await db
    .insert(disciplines)
    .values({ userId: USER_A_ID, title: "A Discipline", status: "active" })
    .returning();
  const [discB] = await db
    .insert(disciplines)
    .values({ userId: USER_B_ID, title: "B Discipline", status: "active" })
    .returning();

  const [projA] = await db
    .insert(projects)
    .values({ userId: USER_A_ID, disciplineId: discA.id, title: "A Project", status: "active" })
    .returning();
  const [projB] = await db
    .insert(projects)
    .values({ userId: USER_B_ID, disciplineId: discB.id, title: "B Project", status: "active" })
    .returning();

  disciplineAId = discA.id;
  projectAId = projA.id;
  projectBId = projB.id;
}

beforeEach(async () => {
  await db.delete(brainDumpItems).where(inArray(brainDumpItems.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(tasks).where(inArray(tasks.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(projects).where(inArray(projects.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(disciplines).where(inArray(disciplines.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(user).where(inArray(user.id, [USER_A_ID, USER_B_ID]));
  await seedBase();
});

describe("BrainDumpService Integration", () => {
  it("creates an unclassified item with only content", async () => {
    const item = await BrainDumpService.create(USER_A_ID, {
      content: "Possible research topic: deterministic schedulers",
    });

    expect(item.userId).toBe(USER_A_ID);
    expect(item.content).toBe("Possible research topic: deterministic schedulers");
    expect(item.status).toBe("inbox");
    expect(item.kind).toBeNull();
    expect(item.createdAt).toBeInstanceOf(Date);
  });

  it("edits content and kind without resolving the item", async () => {
    const item = await BrainDumpService.create(USER_A_ID, { content: "Rough idea" });

    const updated = await BrainDumpService.update(USER_A_ID, item.id, {
      content: "Refined idea",
      kind: "idea",
    });

    expect(updated.content).toBe("Refined idea");
    expect(updated.kind).toBe("idea");
    expect(updated.status).toBe("inbox");
  });

  it("archives, dismisses, and restores while preserving records", async () => {
    const item = await BrainDumpService.create(USER_A_ID, { content: "Temporary noise" });

    const archived = await BrainDumpService.archive(USER_A_ID, item.id);
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).toBeInstanceOf(Date);

    const restored = await BrainDumpService.restore(USER_A_ID, item.id);
    expect(restored.status).toBe("inbox");
    expect(restored.archivedAt).toBeNull();

    const dismissed = await BrainDumpService.dismiss(USER_A_ID, item.id);
    expect(dismissed.status).toBe("dismissed");
    expect(dismissed.dismissedAt).toBeInstanceOf(Date);

    const restoredAgain = await BrainDumpService.restore(USER_A_ID, item.id);
    expect(restoredAgain.status).toBe("inbox");
    expect(restoredAgain.dismissedAt).toBeNull();

    // Record still exists; nothing was hard-deleted.
    const stored = await BrainDumpService.getById(USER_A_ID, item.id);
    expect(stored.content).toBe("Temporary noise");
  });

  it("converts an item into a Task under a valid owned Project and preserves the original", async () => {
    const originalContent = "Set up a nightly database backup";
    const item = await BrainDumpService.create(USER_A_ID, { content: originalContent });

    const { item: converted, task } = await BrainDumpService.convertToTask(
      USER_A_ID,
      item.id,
      { projectId: projectAId },
    );

    expect(converted.status).toBe("converted");
    expect(converted.convertedToType).toBe("task");
    expect(converted.convertedToId).toBe(task.id);
    expect(converted.convertedAt).toBeInstanceOf(Date);
    expect(converted.projectId).toBe(projectAId);

    // The original capture is not mutated or removed.
    expect(converted.content).toBe(originalContent);
    expect(converted.id).toBe(item.id);

    const [storedTask] = await db.select().from(tasks).where(eq(tasks.id, task.id));
    expect(storedTask.projectId).toBe(projectAId);
    expect(storedTask.userId).toBe(USER_A_ID);
    expect(storedTask.title).toBe(originalContent);
  });

  it("rejects conversion when the selected project is invalid or owned by another user", async () => {
    const item = await BrainDumpService.create(USER_A_ID, { content: "Orphan risk" });

    await expect(
      BrainDumpService.convertToTask(USER_A_ID, item.id, {
        projectId: "00000000-0000-4000-8000-000000000000",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      BrainDumpService.convertToTask(USER_A_ID, item.id, { projectId: projectBId }),
    ).rejects.toBeInstanceOf(NotFoundError);

    // Failed conversions must not resolve the item.
    const stored = await BrainDumpService.getById(USER_A_ID, item.id);
    expect(stored.status).toBe("inbox");
    expect(stored.convertedToId).toBeNull();

    // No orphan task was created.
    const [storedTask] = await db.select().from(tasks).where(eq(tasks.userId, USER_A_ID));
    expect(storedTask).toBeUndefined();
  });

  it("uses an item to create a Project under a discipline", async () => {
    const item = await BrainDumpService.create(USER_A_ID, {
      content: "Build a local-first notes tool",
    });

    const { item: converted, project } = await BrainDumpService.convertToProject(
      USER_A_ID,
      item.id,
      { disciplineId: disciplineAId },
    );

    expect(converted.status).toBe("converted");
    expect(converted.convertedToType).toBe("project");
    expect(converted.convertedToId).toBe(project.id);
    expect(converted.disciplineId).toBe(disciplineAId);
    expect(project.disciplineId).toBe(disciplineAId);
  });

  it("links items to existing projects/disciplines and keeps notes", async () => {
    const linkProject = await BrainDumpService.create(USER_A_ID, { content: "Link me" });
    const associated = await BrainDumpService.associate(USER_A_ID, linkProject.id, {
      projectId: projectAId,
    });
    expect(associated.status).toBe("converted");
    expect(associated.projectId).toBe(projectAId);
    expect(associated.disciplineId).not.toBeNull();
    expect(associated.convertedToType).toBe("project_link");

    const note = await BrainDumpService.create(USER_A_ID, { content: "Useful reference" });
    const kept = await BrainDumpService.associate(USER_A_ID, note.id, { keepAsNote: true });
    expect(kept.kind).toBe("note");
    expect(kept.convertedToType).toBe("note");
  });

  it("searches and filters by status, kind, and content", async () => {
    await BrainDumpService.create(USER_A_ID, {
      content: "Kernel scheduler research",
      kind: "research",
    });
    await BrainDumpService.create(USER_A_ID, {
      content: "Buy more coffee",
      kind: "task",
    });
    const archived = await BrainDumpService.create(USER_A_ID, {
      content: "Old kernel note",
      kind: "reference",
    });
    await BrainDumpService.archive(USER_A_ID, archived.id);

    const inbox = await BrainDumpService.list(USER_A_ID, { status: "inbox" });
    expect(inbox).toHaveLength(2);

    const research = await BrainDumpService.list(USER_A_ID, { kind: "research" });
    expect(research).toHaveLength(1);
    expect(research[0].content).toContain("Kernel scheduler");

    const search = await BrainDumpService.list(USER_A_ID, { search: "kernel" });
    expect(search).toHaveLength(2);

    const archivedOnly = await BrainDumpService.list(USER_A_ID, { status: "archived" });
    expect(archivedOnly).toHaveLength(1);
    expect(archivedOnly[0].id).toBe(archived.id);
  });

  it("isolates all operations by user", async () => {
    const item = await BrainDumpService.create(USER_A_ID, { content: "Private capture" });

    expect(await BrainDumpService.list(USER_B_ID)).toHaveLength(0);
    await expect(BrainDumpService.getById(USER_B_ID, item.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      BrainDumpService.update(USER_B_ID, item.id, { content: "Hijacked" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(BrainDumpService.archive(USER_B_ID, item.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(BrainDumpService.dismiss(USER_B_ID, item.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(BrainDumpService.restore(USER_B_ID, item.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      BrainDumpService.convertToTask(USER_B_ID, item.id, { projectId: projectBId }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const [stored] = await db
      .select()
      .from(brainDumpItems)
      .where(eq(brainDumpItems.id, item.id));
    expect(stored.content).toBe("Private capture");
    expect(stored.status).toBe("inbox");
  });
});
