import { describe, it, expect } from "vitest";
import {
  createBrainDumpSchema,
  convertBrainDumpSchema,
} from "@/modules/brain-dump/validation";
import { BRAIN_DUMP_CONSTRAINTS } from "@/modules/brain-dump/domain/types";

describe("Brain Dump Validation & Domain Types", () => {
  it("validates raw thought creation input", () => {
    const valid = createBrainDumpSchema.safeParse({
      content: "Investigate zero-knowledge proofs for data sharing.",
    });
    expect(valid.success).toBe(true);

    const empty = createBrainDumpSchema.safeParse({ content: "" });
    expect(empty.success).toBe(false);
  });

  it("validates conversion target types (project, task, subtask)", () => {
    const validProjectConversion = convertBrainDumpSchema.safeParse({
      convertedToType: "project",
      convertedToId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(validProjectConversion.success).toBe(true);

    const validTaskConversion = convertBrainDumpSchema.safeParse({
      convertedToType: "task",
      convertedToId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(validTaskConversion.success).toBe(true);

    const invalidType = convertBrainDumpSchema.safeParse({
      convertedToType: "discipline", // Not a valid conversion target
      convertedToId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(invalidType.success).toBe(false);
  });

  it("enforces content max length constraint", () => {
    expect(BRAIN_DUMP_CONSTRAINTS.CONTENT_MAX_LENGTH).toBe(5000);
  });
});
