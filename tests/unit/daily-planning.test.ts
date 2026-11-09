import { describe, it, expect } from "vitest";
import {
  addTaskToPlanSchema,
  updatePlanItemSchema,
} from "@/modules/daily-planning/validation";
import { MAX_DAILY_PLANNED_SECONDS } from "@/shared/utils/duration";
import { getTodayDateString, isValidDateString } from "@/shared/utils/date";

describe("Daily Planning Validation", () => {
  it("accepts a valid plan item with optional planned duration", () => {
    const result = addTaskToPlanSchema.safeParse({
      date: "2026-11-04",
      taskId: "123e4567-e89b-12d3-a456-426614174000",
      plannedDurationSeconds: 1800,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid date format", () => {
    const result = addTaskToPlanSchema.safeParse({
      date: "04-11-2026",
      taskId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive planned durations", () => {
    const result = addTaskToPlanSchema.safeParse({
      date: "2026-11-04",
      taskId: "123e4567-e89b-12d3-a456-426614174000",
      plannedDurationSeconds: 0,
    });
    expect(result.success).toBe(false);
  });

  it("validates plan item status transitions", () => {
    for (const status of ["planned", "in_progress", "completed", "deferred"]) {
      const result = updatePlanItemSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
    expect(updatePlanItemSchema.safeParse({ status: "overdue" }).success).toBe(false);
  });

  it("exposes the strict 4-hour planned capacity invariant", () => {
    expect(MAX_DAILY_PLANNED_SECONDS).toBe(4 * 3600);
    expect(MAX_DAILY_PLANNED_SECONDS).toBe(14400);
  });

  it("produces valid ISO date strings", () => {
    const today = getTodayDateString();
    expect(isValidDateString(today)).toBe(true);
  });
});
