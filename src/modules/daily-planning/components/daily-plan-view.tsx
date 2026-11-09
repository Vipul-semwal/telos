"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDots, Clock, Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";
import { useToast } from "@/components/ui/toast";
import { formatSecondsToHuman, MAX_DAILY_PLANNED_SECONDS } from "@/shared/utils/duration";

export type PlanItemStatus = "planned" | "in_progress" | "completed" | "deferred";

export interface PlanItemRow {
  id: string;
  taskId: string;
  taskTitle: string;
  taskEstimatedSeconds: number;
  plannedDurationSeconds: number;
  status: PlanItemStatus;
  sortOrder: number;
}

interface CandidateTask {
  id: string;
  title: string;
  projectTitle: string;
  estimatedDurationSeconds: number;
}

interface DailyPlanViewProps {
  date: string;
  initialItems: PlanItemRow[];
  candidateTasks: CandidateTask[];
}

interface PlanResponse {
  items: PlanItemRow[];
  capacity: {
    maxSeconds: number;
    allocatedSeconds: number;
    remainingSeconds: number;
    isCapacityReached: boolean;
  };
}

const STATUS_VARIANT: Record<PlanItemStatus, "neutral" | "warning" | "success" | "accent"> = {
  planned: "neutral",
  in_progress: "warning",
  completed: "success",
  deferred: "accent",
};

const STATUS_LABEL: Record<PlanItemStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Done",
  deferred: "Deferred",
};

const selectClass =
  "h-8 rounded-lg bg-surface-raised/70 px-2 text-caption text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent/40";

export function DailyPlanView({ date, initialItems, candidateTasks }: DailyPlanViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<PlanItemRow[]>(initialItems);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [addMinutes, setAddMinutes] = React.useState<string>("");

  const allocatedSeconds = items.reduce((sum, item) => sum + item.plannedDurationSeconds, 0);
  const remainingSeconds = Math.max(0, MAX_DAILY_PLANNED_SECONDS - allocatedSeconds);
  const isCapacityReached = allocatedSeconds >= MAX_DAILY_PLANNED_SECONDS;
  const plannedTaskIds = new Set(items.map((item) => item.taskId));
  const availableTasks = candidateTasks.filter((task) => !plannedTaskIds.has(task.id));

  const refreshPlan = React.useCallback(async () => {
    const res = await fetch(`/api/daily-planning?date=${encodeURIComponent(date)}`);
    if (res.ok) {
      const data: PlanResponse = await res.json();
      setItems(data.items);
    }
    router.refresh();
  }, [date, router]);

  const handleAdd = async (task: CandidateTask) => {
    setError(null);
    setBusyId(task.id);
    try {
      const plannedSeconds =
        addMinutes && Number(addMinutes) > 0
          ? Math.round(Number(addMinutes) * 60)
          : task.estimatedDurationSeconds > 0
            ? task.estimatedDurationSeconds
            : 1800;

      const res = await fetch("/api/daily-planning/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, taskId: task.id, plannedDurationSeconds: plannedSeconds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add task to plan.");
      } else {
        toast("Task added to today's plan.");
        await refreshPlan();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = async (itemId: string, status: PlanItemStatus) => {
    setError(null);
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/daily-planning/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update item.");
      } else {
        await refreshPlan();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuration = async (itemId: string, minutes: string) => {
    const parsed = Number(minutes);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setError(null);
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/daily-planning/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannedDurationSeconds: Math.round(parsed * 60) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update planned duration.");
      } else {
        await refreshPlan();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setError(null);
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/daily-planning/items/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove item.");
      } else {
        toast("Task removed from today's plan.");
        await refreshPlan();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-status-error/[0.08] px-4 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-caption font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card variant="glass" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <CalendarDots size={20} />
            </span>
            <div>
              <p className="text-subheading font-semibold text-foreground-primary">
                Planned capacity
              </p>
              <p className="text-caption text-foreground-muted">
                {items.length} task{items.length === 1 ? "" : "s"} queued ·{" "}
                {formatSecondsToHuman(remainingSeconds)} remaining
              </p>
            </div>
          </div>
          <Badge variant={isCapacityReached ? "error" : "neutral"}>
            {formatSecondsToHuman(allocatedSeconds)} / 4h
          </Badge>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCapacityReached ? "bg-status-error" : "bg-accent"
            }`}
            style={{
              width: `${Math.min(100, (allocatedSeconds / MAX_DAILY_PLANNED_SECONDS) * 100)}%`,
            }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-heading font-semibold text-foreground-primary">Today&apos;s queue</h2>
            <Badge variant="neutral">{items.length}</Badge>
          </div>

          {items.length === 0 ? (
            <EmptyState
              kicker="Nothing planned"
              title="Build today's queue"
              description="Select tasks from the available list to build a plan capped at four hours of planned work."
            />
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="surface-panel space-y-3 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-small font-medium text-foreground-primary">
                        {item.taskTitle}
                      </p>
                      {item.taskEstimatedSeconds > 0 && (
                        <p className="inline-flex items-center gap-1 font-mono text-caption tabular-nums text-foreground-muted">
                          <Clock size={12} />
                          ETA {formatSecondsToHuman(item.taskEstimatedSeconds)}
                        </p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANT[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-caption text-foreground-muted" htmlFor={`duration-${item.id}`}>
                      Planned
                    </label>
                    <input
                      id={`duration-${item.id}`}
                      type="number"
                      min="1"
                      defaultValue={Math.round(item.plannedDurationSeconds / 60)}
                      onBlur={(event) => {
                        const next = event.target.value;
                        if (Math.round(item.plannedDurationSeconds / 60) !== Number(next)) {
                          handleDuration(item.id, next);
                        }
                      }}
                      className="h-8 w-16 rounded-lg bg-surface-raised/70 px-2 text-caption tabular-nums text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                    <span className="text-caption text-foreground-muted">min</span>

                    <select
                      value={item.status}
                      onChange={(event) =>
                        handleStatus(item.id, event.target.value as PlanItemStatus)
                      }
                      disabled={busyId === item.id}
                      aria-label={`Status for ${item.taskTitle}`}
                      className={selectClass}
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Done</option>
                      <option value="deferred">Deferred</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={busyId === item.id}
                      aria-label={`Remove ${item.taskTitle} from plan`}
                      className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-status-error/10 hover:text-status-error disabled:opacity-40"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-heading font-semibold text-foreground-primary">
              Available tasks
            </h2>
            <div className="flex items-center gap-1.5">
              <label htmlFor="default-minutes" className="text-caption text-foreground-muted">
                Default
              </label>
              <input
                id="default-minutes"
                type="number"
                min="1"
                value={addMinutes}
                onChange={(event) => setAddMinutes(event.target.value)}
                placeholder="auto"
                className="h-8 w-16 rounded-lg bg-surface-raised/70 px-2 text-caption tabular-nums text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none placeholder:text-foreground-quaternary focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              <span className="text-caption text-foreground-muted">min</span>
            </div>
          </div>

          {availableTasks.length === 0 ? (
            <EmptyState
              kicker="No available tasks"
              title="Everything is planned"
              description="All open tasks are already in today's plan, or none exist. Create tasks from a project to plan them here."
            />
          ) : (
            <div className="space-y-2.5">
              {availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="surface-panel flex items-center justify-between gap-3 rounded-2xl p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium text-foreground-primary">
                      {task.title}
                    </p>
                    <p className="truncate font-mono text-caption text-foreground-muted">
                      {task.projectTitle}
                      {task.estimatedDurationSeconds > 0
                        ? ` · ETA ${formatSecondsToHuman(task.estimatedDurationSeconds)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAdd(task)}
                    disabled={busyId === task.id || isCapacityReached}
                  >
                    <Plus size={14} weight="bold" />
                    Plan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
