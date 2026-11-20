"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Pause, Play, Plus, Repeat } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/state-views";
import { useToast } from "@/components/ui/toast";
import { formatSecondsToHuman } from "@/shared/utils/duration";

interface ProjectOption {
  id: string;
  title: string;
}

interface RoutineVariant {
  id: string;
  weekday: number;
  weekdayLabel: string;
  taskId: string;
  title: string;
  description: string | null;
  plannedDurationSeconds: number;
}

interface RoutineRow {
  id: string;
  title: string;
  status: string;
  projectId: string;
  projectTitle: string;
  startDate: string;
  endDate: string | null;
  variants: RoutineVariant[];
}

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;

type VariantDraft = {
  enabled: boolean;
  title: string;
  minutes: string;
};

function defaultVariants(): Record<number, VariantDraft> {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [
      day.value,
      {
        enabled: day.value !== 7,
        title: "",
        minutes: "45",
      },
    ]),
  );
}

export function RoutineView({
  initialRoutines,
  projects,
  today,
}: {
  initialRoutines: RoutineRow[];
  projects: ProjectOption[];
  today: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const updateStatus = async (routine: RoutineRow, status: "active" | "paused") => {
    setBusyId(routine.id);
    setError(null);
    try {
      const response = await fetch(`/api/routines/${routine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to update routine.");
      } else {
        toast(status === "active" ? "Routine resumed." : "Routine paused.");
        router.refresh();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-status-error/[0.08] px-4 py-3 text-small text-status-error">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-small text-foreground-secondary">
          Create one recurring plan and assign a different exercise to each weekday.
        </p>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={15} weight="bold" />
          New routine
        </Button>
      </div>

      {initialRoutines.length === 0 ? (
        <EmptyState
          kicker="No routines"
          title="Create your first routine"
          description="Choose the weekdays, name each day's exercise, and give it an ETA. Telos will add the correct variant to Today's Plan automatically."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {initialRoutines.map((routine) => (
            <Card key={routine.id} variant="surface" className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Repeat size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-subheading font-semibold text-foreground-primary">
                      {routine.title}
                    </h2>
                    <p className="truncate text-caption text-foreground-muted">
                      {routine.projectTitle}
                    </p>
                  </div>
                </div>
                <Badge variant={routine.status === "active" ? "success" : "neutral"}>
                  {routine.status}
                </Badge>
              </div>

              <div className="divide-y divide-separator/[0.08] rounded-xl bg-surface-raised/45 px-3">
                {routine.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-caption font-medium text-foreground-secondary">
                        {variant.weekdayLabel}
                      </p>
                      <p className="truncate text-small text-foreground-primary">
                        {variant.title}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-caption tabular-nums text-foreground-muted">
                      <Clock size={12} />
                      {formatSecondsToHuman(variant.plannedDurationSeconds)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-caption text-foreground-muted">
                  {routine.variants.length} day{routine.variants.length === 1 ? "" : "s"} per week
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === routine.id || routine.status === "archived"}
                  onClick={() =>
                    updateStatus(
                      routine,
                      routine.status === "active" ? "paused" : "active",
                    )
                  }
                >
                  {routine.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                  {routine.status === "active" ? "Pause" : "Resume"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateRoutineDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projects={projects}
        today={today}
        onSuccess={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function CreateRoutineDialog({
  open,
  onClose,
  onSuccess,
  projects,
  today,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: ProjectOption[];
  today: string;
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("Exercise");
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "");
  const [startDate, setStartDate] = React.useState(today);
  const [variants, setVariants] =
    React.useState<Record<number, VariantDraft>>(defaultVariants);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle("Exercise");
    setProjectId(projects[0]?.id ?? "");
    setStartDate(today);
    setVariants(defaultVariants());
    setError(null);
  }, [open, projects, today]);

  const updateVariant = (
    weekday: number,
    field: keyof VariantDraft,
    value: string | boolean,
  ) => {
    setVariants((current) => ({
      ...current,
      [weekday]: {
        ...current[weekday],
        [field]: value,
      },
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!projectId) {
      setError("Select an active project.");
      return;
    }

    const selected = WEEKDAYS.map((day) => ({
      weekday: day.value,
      ...variants[day.value],
    })).filter((variant) => variant.enabled);

    if (selected.length === 0) {
      setError("Select at least one weekday.");
      return;
    }
    if (selected.some((variant) => !variant.title.trim())) {
      setError("Name the exercise for every selected weekday.");
      return;
    }
    if (
      selected.some(
        (variant) =>
          !Number.isFinite(Number(variant.minutes)) || Number(variant.minutes) <= 0,
      )
    ) {
      setError("Every selected weekday needs a positive duration.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          startDate,
          variants: selected.map((variant) => ({
            weekday: variant.weekday,
            title: variant.title.trim(),
            plannedDurationSeconds: Math.round(Number(variant.minutes) * 60),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to create routine.");
      } else {
        toast("Routine created.");
        onSuccess();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New routine"
      description="Assign the exercise and ETA for each weekday you want included."
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error">
            {error}
          </div>
        )}

        <Input
          label="Routine name"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Exercise"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            {projects.length === 0 ? (
              <option value="">No active projects</option>
            ) : (
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))
            )}
          </Select>
          <Input
            label="Start date"
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-small font-medium text-foreground-secondary">
            Weekly exercises
          </p>
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const draft = variants[day.value];
              return (
                <div
                  key={day.value}
                  className="grid grid-cols-[1fr_72px] items-center gap-2 rounded-xl bg-surface-raised/45 p-2.5 sm:grid-cols-[140px_1fr_82px]"
                >
                  <label className="flex items-center gap-2 text-small text-foreground-primary">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(event) =>
                        updateVariant(day.value, "enabled", event.target.checked)
                      }
                      className="h-4 w-4 accent-[rgb(var(--accent))]"
                    />
                    {day.label}
                  </label>
                  <input
                    aria-label={`${day.label} exercise`}
                    value={draft.title}
                    disabled={!draft.enabled}
                    onChange={(event) =>
                      updateVariant(day.value, "title", event.target.value)
                    }
                    placeholder={day.value === 1 ? "Push-ups" : "Exercise name"}
                    className="col-span-2 h-9 rounded-lg bg-background-primary/45 px-2.5 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none placeholder:text-foreground-quaternary focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40 sm:col-span-1"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={`${day.label} duration in minutes`}
                      type="number"
                      min="1"
                      value={draft.minutes}
                      disabled={!draft.enabled}
                      onChange={(event) =>
                        updateVariant(day.value, "minutes", event.target.value)
                      }
                      className="h-9 w-14 rounded-lg bg-background-primary/45 px-2 text-right text-small tabular-nums text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40"
                    />
                    <span className="text-caption text-foreground-muted">min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-separator/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving || projects.length === 0}
          >
            {isSaving ? "Creating…" : "Create routine"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
