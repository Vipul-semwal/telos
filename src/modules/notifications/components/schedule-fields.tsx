"use client";

import * as React from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";
import type { RecurrenceRule } from "../domain/types";

export interface ScheduleDraft {
  startDate: string;
  startTime: string;
  timezone: string;
  recurrence: RecurrenceRule;
  endDate: string;
  occurrenceLimit: string;
}

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function defaultScheduleDraft(): ScheduleDraft {
  const now = new Date();
  const timezone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const local = new Date(now.getTime() + 5 * 60_000);
  return {
    startDate: `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`,
    startTime: `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`,
    timezone: timezone || "UTC",
    recurrence: { type: "once" },
    endDate: "",
    occurrenceLimit: "",
  };
}

export function schedulePayload(draft: ScheduleDraft) {
  return {
    startDate: draft.startDate,
    startTime: draft.startTime,
    timezone: draft.timezone,
    recurrence: draft.recurrence,
    endDate: draft.endDate || null,
    occurrenceLimit: draft.occurrenceLimit ? Number(draft.occurrenceLimit) : null,
  };
}

export function ScheduleFields({
  value,
  onChange,
}: {
  value: ScheduleDraft;
  onChange: (value: ScheduleDraft) => void;
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const setRecurrenceType = (type: RecurrenceRule["type"]) => {
    if (type === "once") onChange({ ...value, recurrence: { type } });
    if (type === "daily") onChange({ ...value, recurrence: { type } });
    if (type === "weekdays") {
      onChange({ ...value, recurrence: { type, weekdays: [1, 2, 3, 4, 5] } });
    }
    if (type === "weekly") {
      onChange({
        ...value,
        recurrence: { type, weekdays: [1], interval: 1 },
      });
    }
    if (type === "monthly") {
      onChange({
        ...value,
        recurrence: {
          type,
          dayOfMonth: Number(value.startDate.slice(-2)) || 1,
          interval: 1,
        },
      });
    }
    if (type === "interval") {
      onChange({
        ...value,
        recurrence: { type, interval: 2, unit: "days" },
      });
    }
  };

  const toggleWeekday = (weekday: number) => {
    if (value.recurrence.type !== "weekdays" && value.recurrence.type !== "weekly") return;
    const current = value.recurrence.weekdays;
    const weekdays = current.includes(weekday)
      ? current.filter((day) => day !== weekday)
      : [...current, weekday].sort();
    if (weekdays.length === 0) return;
    onChange({ ...value, recurrence: { ...value.recurrence, weekdays } });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Date"
          type="date"
          required
          value={value.startDate}
          onChange={(event) => onChange({ ...value, startDate: event.target.value })}
        />
        <Input
          label="Time"
          type="time"
          required
          value={value.startTime}
          onChange={(event) => onChange({ ...value, startTime: event.target.value })}
        />
      </div>

      <Input
        label="Timezone"
        required
        list="telos-timezones"
        value={value.timezone}
        onChange={(event) => onChange({ ...value, timezone: event.target.value })}
        hint="IANA timezone, for example Asia/Kolkata or America/New_York."
      />
      <datalist id="telos-timezones">
        {COMMON_TIMEZONES.map((timezone) => (
          <option key={timezone} value={timezone} />
        ))}
      </datalist>

      <Select
        label="Repeat"
        value={value.recurrence.type}
        onChange={(event) =>
          setRecurrenceType(event.target.value as RecurrenceRule["type"])
        }
      >
        <option value="once">One time</option>
        <option value="daily">Every day</option>
        <option value="weekdays">Selected weekdays</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="interval">Custom interval</option>
      </Select>

      {(value.recurrence.type === "weekdays" || value.recurrence.type === "weekly") && (
        <div className="space-y-2">
          <span className="text-small font-medium text-foreground-secondary">Days</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => {
              const active = value.recurrence.type !== "once" &&
                value.recurrence.type !== "daily" &&
                value.recurrence.type !== "monthly" &&
                value.recurrence.type !== "interval" &&
                value.recurrence.weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleWeekday(day.value)}
                  className={cn(
                    "h-9 min-w-11 rounded px-2 text-caption font-medium transition-colors",
                    active
                      ? "bg-accent text-white"
                      : "bg-surface-raised text-foreground-secondary hover:bg-surface-hover",
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {value.recurrence.type === "weekly" && (
        <Input
          label="Weeks between occurrences"
          type="number"
          min="1"
          max="52"
          value={value.recurrence.interval}
          onChange={(event) =>
            onChange({
              ...value,
              recurrence: {
                ...(value.recurrence as Extract<RecurrenceRule, { type: "weekly" }>),
                interval: Math.max(1, Number(event.target.value) || 1),
              },
            })
          }
        />
      )}

      {value.recurrence.type === "monthly" && (
        <Input
          label="Day of month"
          type="number"
          min="1"
          max="31"
          value={value.recurrence.dayOfMonth}
          onChange={(event) =>
            onChange({
              ...value,
              recurrence: {
                ...(value.recurrence as Extract<RecurrenceRule, { type: "monthly" }>),
                dayOfMonth: Math.min(31, Math.max(1, Number(event.target.value) || 1)),
              },
            })
          }
          hint="Months without this date use their final day."
        />
      )}

      {value.recurrence.type === "interval" && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Every"
            type="number"
            min="1"
            value={value.recurrence.interval}
            onChange={(event) =>
              onChange({
                ...value,
                recurrence: {
                  ...(value.recurrence as Extract<RecurrenceRule, { type: "interval" }>),
                  interval: Math.max(1, Number(event.target.value) || 1),
                },
              })
            }
          />
          <Select
            label="Unit"
            value={value.recurrence.unit}
            onChange={(event) =>
              onChange({
                ...value,
                recurrence: {
                  ...(value.recurrence as Extract<RecurrenceRule, { type: "interval" }>),
                  unit: event.target.value as "minutes" | "hours" | "days",
                },
              })
            }
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </Select>
        </div>
      )}

      <div className="rounded-lg bg-surface-raised/60 px-3 py-2.5">
        <p className="text-caption font-medium text-foreground-primary">Destination</p>
        <p className="mt-0.5 text-caption text-foreground-muted">
          Cockpit — due items appear there automatically.
        </p>
      </div>

      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced((current) => !current)}
        >
          {showAdvanced ? <CaretDown size={14} /> : <CaretRight size={14} />}
          Advanced schedule
        </Button>
        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 gap-3 border-l border-separator/10 pl-4 sm:grid-cols-2">
            <Input
              label="End date (optional)"
              type="date"
              value={value.endDate}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
            />
            <Input
              label="Maximum occurrences"
              type="number"
              min="1"
              max="500"
              value={value.occurrenceLimit}
              onChange={(event) =>
                onChange({ ...value, occurrenceLimit: event.target.value })
              }
              placeholder="No limit"
            />
          </div>
        )}
      </div>
    </div>
  );
}
