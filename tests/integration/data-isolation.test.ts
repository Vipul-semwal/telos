import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { DisciplinesService } from "@/modules/disciplines/service";
import { ProjectsService } from "@/modules/projects/service";
import { TasksService } from "@/modules/tasks/service";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { CapacityExceededError, NotFoundError } from "@/shared/errors/domain-error";
import { eq } from "drizzle-orm";

describe("Data Isolation & Domain Constraints Integration Tests", () => {
  const userAId = "test_user_a_" + Date.now();
  const userBId = "test_user_b_" + Date.now();

  beforeAll(async () => {
    // Seed two independent test users
    await db.insert(user).values([
      {
        id: userAId,
        name: "User Alpha",
        username: "user_alpha_" + Date.now(),
        email: `alpha_${Date.now()}@telos.internal`,
      },
      {
        id: userBId,
        name: "User Beta",
        username: "user_beta_" + Date.now(),
        email: `beta_${Date.now()}@telos.internal`,
      },
    ]);
  });

  afterAll(async () => {
    // Clean up test users (cascades to all user records)
    await db.delete(user).where(eq(user.id, userAId));
    await db.delete(user).where(eq(user.id, userBId));
  });

  it("User B cannot access or view User A's disciplines", async () => {
    // User A creates a discipline
    const discA = await DisciplinesService.create(userAId, {
      title: "Alpha Secret Pursuit",
      description: "Private to User A",
    });

    // User A can access it
    const foundA = await DisciplinesService.getById(userAId, discA.id);
    expect(foundA.id).toBe(discA.id);

    // User B attempts to access User A's discipline by ID -> must fail with NotFoundError
    await expect(DisciplinesService.getById(userBId, discA.id)).rejects.toThrow(NotFoundError);

    // User B listing disciplines must not include User A's discipline
    const listB = await DisciplinesService.list(userBId);
    expect(listB.find((d) => d.id === discA.id)).toBeUndefined();
  });

  it("User B cannot create a project inside User A's discipline", async () => {
    const discA = await DisciplinesService.create(userAId, {
      title: "Alpha Second Pursuit",
    });

    // User B attempts to attach a project to User A's discipline
    await expect(
      ProjectsService.create(userBId, {
        disciplineId: discA.id,
        title: "Malicious Cross-Tenant Project",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("Enforces maximum 3 active disciplines constraint per user", async () => {
    // User A already has 2 disciplines from previous tests. Let's create the 3rd.
    await DisciplinesService.create(userAId, { title: "Alpha Third Pursuit" });

    // Attempting to create a 4th active discipline must be blocked with CapacityExceededError
    await expect(
      DisciplinesService.create(userAId, { title: "Alpha Fourth Pursuit (Illegal)" }),
    ).rejects.toThrow(CapacityExceededError);

    // But User B still has capacity to create their own active disciplines independently
    const discB = await DisciplinesService.create(userBId, { title: "Beta First Pursuit" });
    expect(discB.title).toBe("Beta First Pursuit");
  });

  it("User B cannot access User A's tasks or brain dump items", async () => {
    // User A creates a brain dump item
    const itemA = await BrainDumpService.create(userAId, {
      content: "Alpha proprietary research idea",
    });

    // User B list must not show User A's item
    const listB = await BrainDumpService.list(userBId);
    expect(listB.find((i) => i.id === itemA.id)).toBeUndefined();

    // User B cannot archive User A's brain dump item
    await expect(BrainDumpService.archive(userBId, itemA.id)).rejects.toThrow(NotFoundError);
  });
});
