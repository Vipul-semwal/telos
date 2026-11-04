import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  projectStatusEnum,
} from "@/modules/projects/validation";
import { MAX_ACTIVE_PROJECTS_PER_DISCIPLINE } from "@/modules/projects/service";

describe("Projects Validation & Domain Invariants", () => {
  it("enforces rule: maximum 3 active projects per discipline", () => {
    expect(MAX_ACTIVE_PROJECTS_PER_DISCIPLINE).toBe(3);
  });

  it("supports all 4 project status lifecycles: active, paused, completed, archived", () => {
    expect(projectStatusEnum.safeParse("active").success).toBe(true);
    expect(projectStatusEnum.safeParse("paused").success).toBe(true);
    expect(projectStatusEnum.safeParse("completed").success).toBe(true);
    expect(projectStatusEnum.safeParse("archived").success).toBe(true);
    expect(projectStatusEnum.safeParse("deleted").success).toBe(false);
  });

  it("validates full project creation input with desiredOutcome and initialStatus", () => {
    const valid = createProjectSchema.safeParse({
      disciplineId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Master Linux System Administration",
      description: "Core kernel and systems internals",
      desiredOutcome: "LPIC-3 enterprise certification and kernel debugging skills",
      initialStatus: "active",
    });
    expect(valid.success).toBe(true);
  });

  it("allows creating a project initially in paused state", () => {
    const validPaused = createProjectSchema.safeParse({
      disciplineId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Build a Slurm HPC Lab",
      initialStatus: "paused",
    });
    expect(validPaused.success).toBe(true);
    if (validPaused.success) {
      expect(validPaused.data.initialStatus).toBe("paused");
    }
  });

  it("rejects project creation without title or with invalid UUID disciplineId", () => {
    expect(
      createProjectSchema.safeParse({
        disciplineId: "not-a-uuid",
        title: "Valid Title",
      }).success,
    ).toBe(false);

    expect(
      createProjectSchema.safeParse({
        disciplineId: "123e4567-e89b-12d3-a456-426614174000",
        title: "",
      }).success,
    ).toBe(false);
  });

  it("validates editing project title, description, and desired outcome", () => {
    const validEdit = updateProjectSchema.safeParse({
      title: "Updated Title",
      desiredOutcome: "Refined measurable outcome statement",
      status: "completed",
    });
    expect(validEdit.success).toBe(true);
  });
});
