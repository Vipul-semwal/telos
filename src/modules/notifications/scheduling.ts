import { Temporal } from "@js-temporal/polyfill";
import type { RecurrenceRule } from "./domain/types";

export function assertTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return timezone;
  } catch {
    throw new Error("Invalid IANA timezone");
  }
}

export function localDateTimeToInstant(
  date: string,
  time: string,
  timezone: string,
): Temporal.Instant {
  assertTimeZone(timezone);
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return Temporal.ZonedDateTime.from(
    {
      timeZone: timezone,
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    },
    { disambiguation: "compatible" },
  ).toInstant();
}

export function instantToZoned(instant: Date | string, timezone: string) {
  const temporalInstant =
    instant instanceof Date
      ? Temporal.Instant.fromEpochMilliseconds(instant.getTime())
      : Temporal.Instant.from(instant);
  return temporalInstant.toZonedDateTimeISO(timezone);
}

export function nextOccurrence(
  current: Temporal.ZonedDateTime,
  rule: RecurrenceRule,
  timezone: string,
): Temporal.ZonedDateTime | null {
  if (rule.type === "once") return null;
  if (rule.type === "interval") {
    return current.add(
      rule.unit === "minutes"
        ? { minutes: rule.interval }
        : rule.unit === "hours"
          ? { hours: rule.interval }
          : { days: rule.interval },
    );
  }
  if (rule.type === "daily") return current.add({ days: 1 });
  if (rule.type === "weekdays") {
    for (let offset = 1; offset <= 8; offset += 1) {
      const candidate = current.add({ days: offset });
      if (rule.weekdays.includes(candidate.dayOfWeek)) return candidate;
    }
    return null;
  }
  if (rule.type === "weekly") {
    const currentDate = current.toPlainDate();
    for (let offset = 1; offset <= 7 * rule.interval + 7; offset += 1) {
      const candidate = current.add({ days: offset });
      if (!rule.weekdays.includes(candidate.dayOfWeek)) continue;
      const daysSinceStart = Number(
        candidate.toPlainDate().since(currentDate, { largestUnit: "days" }).days,
      );
      if (Math.floor(daysSinceStart / 7) % rule.interval === 0) return candidate;
    }
    return null;
  }

  const nextMonth = current.toPlainDate().with({ day: 1 }).add({ months: rule.interval });
  const day = Math.min(rule.dayOfMonth, nextMonth.daysInMonth);
  return nextMonth
    .with({ day })
    .toZonedDateTime({ timeZone: timezone, plainTime: current.toPlainTime() });
}

export function firstOccurrence(
  startAt: Date | string,
  timezone: string,
): Temporal.ZonedDateTime {
  return instantToZoned(startAt, timezone);
}

export function isPastEnd(
  candidate: Temporal.ZonedDateTime,
  endAt: Date | null,
): boolean {
  return Boolean(endAt && candidate.toInstant().epochMilliseconds > endAt.getTime());
}
