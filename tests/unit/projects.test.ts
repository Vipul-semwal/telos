import { describe, it, expect } from "vitest";
import { createProjectSchema } from "@/modules/projects/validation";
import { MAX_ACTIVE_PROJECTS_PER_DISCIPLINE } from "@/modules/projects/service";

describe("Projects Domain Rules & Validation", () => {
  it("enforces rule: maximum 3 active projects per discipline", () => {
    expect(MAX_ACTIVE_PROJECTS_PER_DISCIPLINE).toBe(3);
  });

  it("requires valid UUID disciplineId", () => {
    const valid = createProjectSchema.safeParse({
      disciplineId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Telos Intelligence Core",
    });
    expect(valid.success).toBe(true);

    const invalid = createProjectSchema.safeParse({
      disciplineId: "not-a-uuid",
      title: "Telos Intelligence Core",
    });
    expect(invalid.success).toBe(false);
  });
});
