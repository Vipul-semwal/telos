import { describe, it, expect } from "vitest";
import { createDisciplineSchema, updateDisciplineSchema } from "@/modules/disciplines/validation";
import { MAX_ACTIVE_DISCIPLINES } from "@/modules/disciplines/service";

describe("Disciplines Validation & Domain Rules", () => {
  it("enforces maximum 3 active disciplines constant", () => {
    expect(MAX_ACTIVE_DISCIPLINES).toBe(3);
  });

  it("validates discipline creation input", () => {
    const valid = createDisciplineSchema.safeParse({
      title: "Systems Engineering",
      description: "Architecture, compilers, distributed protocols",
    });
    expect(valid.success).toBe(true);

    const empty = createDisciplineSchema.safeParse({
      title: "",
    });
    expect(empty.success).toBe(false);
  });

  it("validates discipline status updates", () => {
    expect(updateDisciplineSchema.safeParse({ status: "archived" }).success).toBe(true);
    expect(updateDisciplineSchema.safeParse({ status: "active" }).success).toBe(true);
    expect(updateDisciplineSchema.safeParse({ status: "deleted" as any }).success).toBe(false);
  });
});
