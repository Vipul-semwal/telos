import { describe, expect, it } from "vitest";
import { createRoutineSchema } from "@/modules/routines/validation";

const base = {
  projectId: "123e4567-e89b-12d3-a456-426614174000",
  title: "Exercise",
  startDate: "2026-11-16",
};

describe("routine validation", () => {
  it("accepts a six-day routine with different variants", () => {
    const result = createRoutineSchema.safeParse({
      ...base,
      variants: [1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        title: `Exercise ${weekday}`,
        plannedDurationSeconds: 2700,
      })),
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate weekdays", () => {
    const result = createRoutineSchema.safeParse({
      ...base,
      variants: [
        { weekday: 1, title: "Push-ups", plannedDurationSeconds: 2700 },
        { weekday: 1, title: "Squats", plannedDurationSeconds: 2700 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = createRoutineSchema.safeParse({
      ...base,
      endDate: "2026-11-15",
      variants: [
        { weekday: 1, title: "Push-ups", plannedDurationSeconds: 2700 },
      ],
    });
    expect(result.success).toBe(false);
  });
});
