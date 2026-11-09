import { describe, expect, it } from "vitest";
import {
  firstOccurrence,
  localDateTimeToInstant,
  nextOccurrence,
} from "@/modules/notifications/scheduling";

describe("Notification scheduling rules", () => {
  it("converts a local wall time using the provided IANA timezone", () => {
    const instant = localDateTimeToInstant("2026-11-06", "09:30", "Asia/Kolkata");
    expect(instant.toString()).toBe("2026-11-06T04:00:00Z");
  });

  it("advances selected weekdays", () => {
    const friday = firstOccurrence("2026-11-06T04:00:00Z", "Asia/Kolkata");
    const next = nextOccurrence(
      friday,
      { type: "weekdays", weekdays: [1, 3, 5] },
      "Asia/Kolkata",
    );
    expect(next?.toPlainDate().toString()).toBe("2026-11-09");
  });

  it("clamps monthly recurrence to the final day of shorter months", () => {
    const january31 = firstOccurrence("2026-01-31T04:00:00Z", "Asia/Kolkata");
    const next = nextOccurrence(
      january31,
      { type: "monthly", dayOfMonth: 31, interval: 1 },
      "Asia/Kolkata",
    );
    expect(next?.toPlainDate().toString()).toBe("2026-02-28");
  });

  it("supports interval recurrence", () => {
    const start = firstOccurrence("2026-11-06T04:00:00Z", "UTC");
    const next = nextOccurrence(
      start,
      { type: "interval", interval: 90, unit: "minutes" },
      "UTC",
    );
    expect(next?.toInstant().toString()).toBe("2026-11-06T05:30:00Z");
  });
});
