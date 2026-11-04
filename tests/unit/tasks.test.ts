import { describe, it, expect } from "vitest";
import { createTaskSchema } from "@/modules/tasks/validation";

describe("Tasks & Subtasks Validation", () => {
  it("validates root task with integer seconds estimated duration", () => {
    const valid = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Establish database migrations",
      estimatedDurationSeconds: 1800, // 30 mins
      priority: "high",
    });
    expect(valid.success).toBe(true);
  });

  it("validates subtask referencing a parentTaskId", () => {
    const validSubtask = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      parentTaskId: "223e4567-e89b-12d3-a456-426614174000",
      title: "Write integration test for data isolation",
      estimatedDurationSeconds: 900,
    });
    expect(validSubtask.success).toBe(true);
  });

  it("rejects negative duration estimates", () => {
    const invalid = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Test",
      estimatedDurationSeconds: -100,
    });
    expect(invalid.success).toBe(false);
  });
});
