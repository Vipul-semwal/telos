import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { DisciplinesService } from "@/modules/disciplines/service";
import { ProjectsService } from "@/modules/projects/service";
import { CapacityExceededError, NotFoundError } from "@/shared/errors/domain-error";
import { eq } from "drizzle-orm";

describe("Projects Management Integration Tests (PostgreSQL)", () => {
  const userAId = "test_user_proj_a_" + Date.now();
  const userBId = "test_user_proj_b_" + Date.now();
  let discA1Id: string;
  let discB1Id: string;

  beforeAll(async () => {
    // 1. Seed two test users
    await db.insert(user).values([
      {
        id: userAId,
        name: "Project Tester A",
        username: "proj_tester_a_" + Date.now(),
        email: `proj_a_${Date.now()}@telos.internal`,
      },
      {
        id: userBId,
        name: "Project Tester B",
        username: "proj_tester_b_" + Date.now(),
        email: `proj_b_${Date.now()}@telos.internal`,
      },
    ]);

    // 2. Create parent disciplines
    const discA = await DisciplinesService.create(userAId, {
      title: "Linux and HPC",
      description: "Systems engineering and supercomputing pursuit",
    });
    discA1Id = discA.id;

    const discB = await DisciplinesService.create(userBId, {
      title: "Mathematics",
      description: "Theoretical pure math",
    });
    discB1Id = discB.id;
  });

  afterAll(async () => {
    // Cascade cleanup
    await db.delete(user).where(eq(user.id, userAId));
    await db.delete(user).where(eq(user.id, userBId));
  });

  it("Rule 1, 2, 8: Creates project under parent discipline with desired outcome", async () => {
    const project = await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Master Linux System Administration",
      description: "Kernel internals, systemd, and network namespaces",
      desiredOutcome: "Pass LPIC-3 certification and maintain zero-downtime cluster",
      initialStatus: "active",
    });

    expect(project.id).toBeDefined();
    expect(project.userId).toBe(userAId);
    expect(project.disciplineId).toBe(discA1Id);
    expect(project.title).toBe("Master Linux System Administration");
    expect(project.desiredOutcome).toBe("Pass LPIC-3 certification and maintain zero-downtime cluster");
    expect(project.status).toBe("active");
  });

  it("Rule 2: Prevents cross-user attachment (User B cannot attach project to User A's discipline)", async () => {
    await expect(
      ProjectsService.create(userBId, {
        disciplineId: discA1Id, // Belongs to User A
        title: "Malicious Attachment Attempt",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("Rule 2: Cross-user access isolation (User B cannot read or update User A's project)", async () => {
    const projA = await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Alpha Confidential Initiative",
    });

    // User B cannot get by ID
    await expect(ProjectsService.getById(userBId, projA.id)).rejects.toThrow(NotFoundError);

    // User B cannot get with details
    await expect(ProjectsService.getByIdWithDetails(userBId, projA.id)).rejects.toThrow(NotFoundError);

    // User B cannot update
    await expect(
      ProjectsService.update(userBId, projA.id, { title: "Hijacked Title" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("Rule 4 & 5: Enforces strict maximum 3 active projects per discipline", async () => {
    // Current active projects in discA1Id: 2 from previous tests.
    // Let's add the 3rd active project.
    await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Build a Slurm HPC Lab",
      initialStatus: "active",
    });

    const activeCount = await ProjectsService.countActive(userAId, discA1Id);
    expect(activeCount).toBe(3);

    // Attempting to create a 4th ACTIVE project must be rejected with CapacityExceededError
    await expect(
      ProjectsService.create(userAId, {
        disciplineId: discA1Id,
        title: "Fourth Active Project (Illegal)",
        initialStatus: "active",
      }),
    ).rejects.toThrow(CapacityExceededError);

    // But creating a PAUSED project in the same discipline succeeds because paused does not consume active quota!
    const pausedProj = await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Design Kernel Modules (Paused)",
      initialStatus: "paused",
    });
    expect(pausedProj.status).toBe("paused");
  });

  it("Rule 9: Pausing, completing, and archiving frees up the 3-project active capacity", async () => {
    // Get all active projects for User A in discA1Id
    const activeList = await ProjectsService.list(userAId, discA1Id, "active");
    expect(activeList.length).toBe(3);

    const projToPause = activeList[0]!;

    // 1. Pause an active project
    await ProjectsService.pause(userAId, projToPause.id);
    const countAfterPause = await ProjectsService.countActive(userAId, discA1Id);
    expect(countAfterPause).toBe(2);

    // Now user can create another active project!
    const newActiveProj = await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Replacement Active Project",
      initialStatus: "active",
    });
    expect(newActiveProj.status).toBe("active");

    // 2. Complete a project
    await ProjectsService.complete(userAId, newActiveProj.id);
    const countAfterComplete = await ProjectsService.countActive(userAId, discA1Id);
    expect(countAfterComplete).toBe(2);

    // 3. Archive a project
    await ProjectsService.archive(userAId, activeList[1]!.id);
    const countAfterArchive = await ProjectsService.countActive(userAId, discA1Id);
    expect(countAfterArchive).toBe(1);
  });

  it("Rule 6, 7 & 11: Archiving preserves records, and restoring enforces active capacity", async () => {
    const project = await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Resilient Initiative",
      description: "Preserved history test",
      initialStatus: "active",
    });

    // Archive it
    const archived = await ProjectsService.archive(userAId, project.id);
    expect(archived.status).toBe("archived");

    // Verify it still exists in the database
    const fetched = await ProjectsService.getById(userAId, project.id);
    expect(fetched.id).toBe(project.id);
    expect(fetched.description).toBe("Preserved history test");

    // Restore to active succeeds when capacity < 3
    const restored = await ProjectsService.restore(userAId, project.id, "active");
    expect(restored.status).toBe("active");
  });

  it("Restoring to active is blocked if 3 active projects already exist, but restoring to paused succeeds", async () => {
    // Fill active capacity in discipline B to 3
    await ProjectsService.create(userBId, { disciplineId: discB1Id, title: "Math Project 1", initialStatus: "active" });
    await ProjectsService.create(userBId, { disciplineId: discB1Id, title: "Math Project 2", initialStatus: "active" });
    await ProjectsService.create(userBId, { disciplineId: discB1Id, title: "Math Project 3", initialStatus: "active" });

    // Create an archived project in discipline B
    const archivedProj = await ProjectsService.create(userBId, {
      disciplineId: discB1Id,
      title: "Math Archived Project",
      initialStatus: "paused",
    });
    await ProjectsService.archive(userBId, archivedProj.id);

    // Attempting to restore as active must fail with CapacityExceededError
    await expect(
      ProjectsService.restore(userBId, archivedProj.id, "active"),
    ).rejects.toThrow(CapacityExceededError);

    // Restoring as paused succeeds
    const restoredPaused = await ProjectsService.restore(userBId, archivedProj.id, "paused");
    expect(restoredPaused.status).toBe("paused");
  });

  it("Rule 10: Users can edit project title, description, and desired outcome", async () => {
    const project = await ProjectsService.create(userAId, {
      disciplineId: discA1Id,
      title: "Original Project Name",
      description: "Original Description",
      desiredOutcome: "Original Outcome",
      initialStatus: "paused",
    });

    const updated = await ProjectsService.update(userAId, project.id, {
      title: "Refined Project Name",
      description: "Refined Description with more context",
      desiredOutcome: "Measurable outcome achieved within 90 days",
    });

    expect(updated.title).toBe("Refined Project Name");
    expect(updated.description).toBe("Refined Description with more context");
    expect(updated.desiredOutcome).toBe("Measurable outcome achieved within 90 days");
  });
});
