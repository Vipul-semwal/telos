import { describe, it, expect } from "vitest";
import {
  startTimerSchema,
  manualSessionSchema,
} from "@/modules/time-tracking/validation";
import { calculateEtaStatus, formatSecondsToClock } from "@/shared/utils/duration";

describe("Time Tracking Validation & ETA Rules", () => {
  it("accepts a valid task timer start payload", () => {
    const result = startTimerSchema.safeParse({
      taskId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid task id", () => {
    const result = startTimerSchema.safeParse({ taskId: "task-1" });
    expect(result.success).toBe(false);
  });

  it("requires positive integer seconds for manual sessions", () => {
    const valid = manualSessionSchema.safeParse({
      taskId: "123e4567-e89b-12d3-a456-426614174000",
      durationSeconds: 1800,
    });
    expect(valid.success).toBe(true);

    for (const durationSeconds of [0, -30, 12.5]) {
      const invalid = manualSessionSchema.safeParse({
        taskId: "123e4567-e89b-12d3-a456-426614174000",
        durationSeconds,
      });
      expect(invalid.success).toBe(false);
    }
  });

  it("marks ETA green when actual <= estimate and red when exceeded", () => {
    expect(calculateEtaStatus(1800, 3600)).toBe("green");
    expect(calculateEtaStatus(3600, 3600)).toBe("green");
    expect(calculateEtaStatus(3601, 3600)).toBe("red");
    expect(calculateEtaStatus(60, 0)).toBe("green");
  });

  it("formats integer seconds into clock format", () => {
    expect(formatSecondsToClock(0)).toBe("00:00:00");
    expect(formatSecondsToClock(3661)).toBe("01:01:01");
  });
});
