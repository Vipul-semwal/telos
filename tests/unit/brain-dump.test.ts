import { describe, it, expect } from "vitest";
import {
  createBrainDumpSchema,
  updateBrainDumpSchema,
  convertBrainDumpToTaskSchema,
  convertBrainDumpToProjectSchema,
  associateBrainDumpSchema,
  listBrainDumpQuerySchema,
} from "@/modules/brain-dump/validation";
import {
  BRAIN_DUMP_CONSTRAINTS,
  BRAIN_DUMP_KINDS,
  BRAIN_DUMP_STATUSES,
} from "@/modules/brain-dump/domain/types";

describe("Brain Dump Validation & Domain Types", () => {
  it("requires only content to capture an item", () => {
    const valid = createBrainDumpSchema.safeParse({
      content: "Investigate zero-knowledge proofs for data sharing.",
    });
    expect(valid.success).toBe(true);

    expect(createBrainDumpSchema.safeParse({ content: "" }).success).toBe(false);
    expect(createBrainDumpSchema.safeParse({ content: "   " }).success).toBe(false);
  });

  it("accepts an optional classification kind", () => {
    for (const kind of BRAIN_DUMP_KINDS) {
      expect(createBrainDumpSchema.safeParse({ content: "capture", kind }).success).toBe(
        true,
      );
    }
    expect(
      createBrainDumpSchema.safeParse({ content: "capture", kind: "urgent" }).success,
    ).toBe(false);
  });

  it("requires at least one field when editing", () => {
    expect(updateBrainDumpSchema.safeParse({ content: "Edited" }).success).toBe(true);
    expect(updateBrainDumpSchema.safeParse({ kind: null }).success).toBe(true);
    expect(updateBrainDumpSchema.safeParse({}).success).toBe(false);
  });

  it("requires a valid project id to convert into a task", () => {
    const valid = convertBrainDumpToTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(valid.success).toBe(true);

    expect(convertBrainDumpToTaskSchema.safeParse({}).success).toBe(false);
    expect(
      convertBrainDumpToTaskSchema.safeParse({ projectId: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("requires a valid discipline id to create a project", () => {
    expect(
      convertBrainDumpToProjectSchema.safeParse({
        disciplineId: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(true);
    expect(convertBrainDumpToProjectSchema.safeParse({}).success).toBe(false);
  });

  it("requires a target when associating an item", () => {
    expect(
      associateBrainDumpSchema.safeParse({
        projectId: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(true);
    expect(associateBrainDumpSchema.safeParse({ keepAsNote: true }).success).toBe(true);
    expect(associateBrainDumpSchema.safeParse({}).success).toBe(false);
  });

  it("validates list query filters", () => {
    expect(listBrainDumpQuerySchema.safeParse({ status: "inbox" }).success).toBe(true);
    expect(
      listBrainDumpQuerySchema.safeParse({ kind: "reference", search: "kernel" }).success,
    ).toBe(true);
    expect(listBrainDumpQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("exposes the full lifecycle and content constraint", () => {
    expect(BRAIN_DUMP_STATUSES).toEqual([
      "inbox",
      "converted",
      "archived",
      "dismissed",
    ]);
    expect(BRAIN_DUMP_CONSTRAINTS.CONTENT_MAX_LENGTH).toBe(5000);
  });
});
