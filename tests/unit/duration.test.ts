import { describe, it, expect } from "vitest";
import {
  formatSecondsToClock,
  formatSecondsToHuman,
  calculateEtaStatus,
  MAX_DAILY_PLANNED_SECONDS,
} from "@/shared/utils/duration";

describe("Duration and Time Utilities", () => {
  it("formats seconds to strict HH:MM:SS clock format", () => {
    expect(formatSecondsToClock(0)).toBe("00:00:00");
    expect(formatSecondsToClock(59)).toBe("00:00:59");
    expect(formatSecondsToClock(60)).toBe("00:01:00");
    expect(formatSecondsToClock(3600)).toBe("01:00:00");
    expect(formatSecondsToClock(3665)).toBe("01:01:05");
    expect(formatSecondsToClock(72000)).toBe("20:00:00");
  });

  it("formats seconds to human readable string", () => {
    expect(formatSecondsToHuman(45)).toBe("45s");
    expect(formatSecondsToHuman(1800)).toBe("30m");
    expect(formatSecondsToHuman(3600)).toBe("1h");
    expect(formatSecondsToHuman(5400)).toBe("1h 30m");
  });

  it("calculates ETA status correctly (green when on track, red when exceeded)", () => {
    // 30 min estimate, 20 min actual -> GREEN
    expect(calculateEtaStatus(1200, 1800)).toBe("green");
    // 30 min estimate, 30 min actual -> GREEN (equal to estimate is still green)
    expect(calculateEtaStatus(1800, 1800)).toBe("green");
    // 30 min estimate, 31 min actual -> RED
    expect(calculateEtaStatus(1860, 1800)).toBe("red");
    // Unset estimate (0) defaults to green
    expect(calculateEtaStatus(500, 0)).toBe("green");
  });

  it("enforces maximum daily planned allocation limit of 4 hours (14,400s)", () => {
    expect(MAX_DAILY_PLANNED_SECONDS).toBe(14400);
    expect(MAX_DAILY_PLANNED_SECONDS / 3600).toBe(4);
  });
});
