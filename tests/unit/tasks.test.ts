import { describe, it, expect } from "vitest";
import { createTaskSchema, updateTaskSchema, taskStatusEnum, taskPriorityEnum } from "@/modules/tasks/validation";

describe("Task Validation Schemas", () => {
  it("validates root task with all required fields", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Set up CI pipeline",
      estimatedDurationSeconds: 3600,
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("applies default priority medium when not provided", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Task without priority",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("applies default estimatedDurationSeconds of 0", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Task without ETA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedDurationSeconds).toBe(0);
    }
  });

  it("validates subtask with parentTaskId", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      parentTaskId: "223e4567-e89b-12d3-a456-426614174000",
      title: "Write unit tests",
      estimatedDurationSeconds: 1200,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative duration", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Bad task",
      estimatedDurationSeconds: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project ID format", () => {
    const result = createTaskSchema.safeParse({
      projectId: "not-a-uuid",
      title: "Task",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority value", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Task",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createTaskSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("validates all status enum values", () => {
    const statuses = ["todo", "in_progress", "completed", "cancelled"];
    statuses.forEach((s) => {
      const result = taskStatusEnum.safeParse(s);
      expect(result.success).toBe(true);
    });
  });

  it("validates all priority enum values", () => {
    const priorities = ["low", "medium", "high"];
    priorities.forEach((p) => {
      const result = taskPriorityEnum.safeParse(p);
      expect(result.success).toBe(true);
    });
  });

  it("allows partial updates via updateTaskSchema", () => {
    const result = updateTaskSchema.safeParse({
      title: "Updated title",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty updateTaskSchema title", () => {
    const result = updateTaskSchema.safeParse({
      title: "",
    });
    expect(result.success).toBe(false);
  });
});
