import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks, taskHistory } from "@/modules/tasks/schema";
import { TasksService } from "@/modules/tasks/service";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import { eq, inArray } from "drizzle-orm";

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const USER_A_ID = "tasks-int-user-a";
const USER_B_ID = "tasks-int-user-b";
let disciplineId: string;
let projectId: string;

async function seedBase() {
  await db.insert(user).values([
    {
      id: USER_A_ID,
      name: "User A",
      email: "user-a-tasks@test.com",
      emailVerified: false,
      username: "user_a_tasks",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: USER_B_ID,
      name: "User B",
      email: "user-b-tasks@test.com",
      emailVerified: false,
      username: "user_b_tasks",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]).onConflictDoNothing();

  const [disc] = await db
    .insert(disciplines)
    .values({
      userId: USER_A_ID,
      title: "Task Testing Discipline",
      description: "Seed data for task integration tests",
      status: "active",
    })
    .returning();
  disciplineId = disc.id;

  const [proj] = await db
    .insert(projects)
    .values({
      userId: USER_A_ID,
      disciplineId,
      title: "Task Testing Project",
      status: "active",
    })
    .returning();
  projectId = proj.id;
}

beforeEach(async () => {
  // Scope cleanup only to our test user IDs — does not disturb other test suites
  await db.delete(taskHistory).where(inArray(taskHistory.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(tasks).where(inArray(tasks.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(projects).where(inArray(projects.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(disciplines).where(inArray(disciplines.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(user).where(inArray(user.id, [USER_A_ID, USER_B_ID]));
  await seedBase();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("TasksService Integration", () => {
  it("creates a root task under an owned project", async () => {
    const task = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Write documentation",
      estimatedDurationSeconds: 1800,
      priority: "high",
    });

    expect(task.id).toBeDefined();
    expect(task.userId).toBe(USER_A_ID);
    expect(task.projectId).toBe(projectId);
    expect(task.parentTaskId).toBeNull();
    expect(task.status).toBe("todo");
    expect(task.estimatedDurationSeconds).toBe(1800);

    // Verify creation event was logged
    const history = await db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.taskId, task.id));
    expect(history.length).toBe(1);
    expect(history[0].eventType).toBe("created");
  });

  it("creates a subtask under a root task", async () => {
    const parent = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Parent Task",
    });

    const subtask = await TasksService.create(USER_A_ID, {
      projectId,
      parentTaskId: parent.id,
      title: "Subtask One",
      estimatedDurationSeconds: 900,
    });

    expect(subtask.parentTaskId).toBe(parent.id);
    expect(subtask.projectId).toBe(projectId);
    expect(subtask.userId).toBe(USER_A_ID);
  });

  it("enforces max nesting depth: subtask cannot have a child", async () => {
    const root = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Root",
    });

    const subtask = await TasksService.create(USER_A_ID, {
      projectId,
      parentTaskId: root.id,
      title: "Subtask",
    });

    await expect(
      TasksService.create(USER_A_ID, {
        projectId,
        parentTaskId: subtask.id,
        title: "Nested sub-subtask — MUST FAIL",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("prevents creating a task under another user's project", async () => {
    await expect(
      TasksService.create(USER_B_ID, {
        projectId,
        title: "Cross-user task — MUST FAIL",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates a task title and description", async () => {
    const task = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Old title",
    });

    const updated = await TasksService.update(USER_A_ID, task.id, {
      title: "New title",
      description: "Added detail",
    });

    expect(updated.title).toBe("New title");
    expect(updated.description).toBe("Added detail");
  });

  it("sets completedAt when status is set to completed", async () => {
    const task = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Task to complete",
    });

    expect(task.completedAt).toBeNull();

    const completed = await TasksService.update(USER_A_ID, task.id, {
      status: "completed",
    });

    expect(completed.status).toBe("completed");
    expect(completed.completedAt).not.toBeNull();

    const history = await db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.taskId, task.id));
    const statusEvent = history.find((h) => h.eventType === "status_changed");
    expect(statusEvent).toBeDefined();
    const eventData = JSON.parse(statusEvent!.eventData!);
    expect(eventData.from).toBe("todo");
    expect(eventData.to).toBe("completed");
  });

  it("clears completedAt when task is reopened", async () => {
    const task = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Task to reopen",
    });

    await TasksService.update(USER_A_ID, task.id, { status: "completed" });
    const reopened = await TasksService.update(USER_A_ID, task.id, { status: "todo" });

    expect(reopened.status).toBe("todo");
    expect(reopened.completedAt).toBeNull();
  });

  it("transitionStatus detects when all subtasks complete and suggests parent completion", async () => {
    const parent = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Parent",
    });
    const sub1 = await TasksService.create(USER_A_ID, {
      projectId,
      parentTaskId: parent.id,
      title: "Subtask A",
    });
    const sub2 = await TasksService.create(USER_A_ID, {
      projectId,
      parentTaskId: parent.id,
      title: "Subtask B",
    });

    // Complete first subtask — should NOT suggest yet
    const result1 = await TasksService.transitionStatus(USER_A_ID, sub1.id, "completed");
    expect(result1.suggestParentCompletion).toBe(false);

    // Complete second subtask — both done, parent still todo
    const result2 = await TasksService.transitionStatus(USER_A_ID, sub2.id, "completed");
    expect(result2.suggestParentCompletion).toBe(true);
    expect(result2.parentTask?.id).toBe(parent.id);

    // Parent status must NOT have changed automatically
    const parentAfter = await TasksService.getById(USER_A_ID, parent.id);
    expect(parentAfter.status).toBe("todo");
  });

  it("deletes a task and throws NotFoundError on subsequent lookup", async () => {
    const task = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Task to delete",
    });

    const deleted = await TasksService.delete(USER_A_ID, task.id);
    expect(deleted.id).toBe(task.id);

    await expect(TasksService.getById(USER_A_ID, task.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("prevents deleting another user's task", async () => {
    const task = await TasksService.create(USER_A_ID, {
      projectId,
      title: "User A task",
    });

    await expect(TasksService.delete(USER_B_ID, task.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lists tasks with subtasks aggregated", async () => {
    const root = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Root Task",
    });
    await TasksService.create(USER_A_ID, {
      projectId,
      parentTaskId: root.id,
      title: "Subtask One",
    });
    await TasksService.create(USER_A_ID, {
      projectId,
      parentTaskId: root.id,
      title: "Subtask Two",
    });

    const withSubtasks = await TasksService.listWithSubtasks(USER_A_ID, projectId);
    expect(withSubtasks.length).toBe(1);
    expect(withSubtasks[0].subtasks.length).toBe(2);
  });

  it("reorders root tasks and persists the new order", async () => {
    const first = await TasksService.create(USER_A_ID, {
      projectId,
      title: "First ordered task",
    });
    const second = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Second ordered task",
    });
    const third = await TasksService.create(USER_A_ID, {
      projectId,
      title: "Third ordered task",
    });

    await TasksService.reorder(USER_A_ID, projectId, [
      { id: third.id, orderIndex: 0 },
      { id: first.id, orderIndex: 1 },
      { id: second.id, orderIndex: 2 },
    ]);

    const reordered = await TasksService.list(USER_A_ID, {
      projectId,
      parentTaskId: null,
    });
    expect(reordered.map((task) => task.id)).toEqual([third.id, first.id, second.id]);
  });

  it("isolates tasks by user: user B cannot see user A tasks", async () => {
    await TasksService.create(USER_A_ID, {
      projectId,
      title: "User A private task",
    });

    const userBTasks = await TasksService.list(USER_B_ID, { projectId });
    expect(userBTasks.length).toBe(0);
  });
});
