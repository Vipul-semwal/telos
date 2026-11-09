"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Play, Plus, Stop, Timer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/state-views";
import { TimerDisplay } from "@/components/ui/timer-display";
import { useToast } from "@/components/ui/toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatSecondsToHuman } from "@/shared/utils/duration";

interface TaskOption {
  id: string;
  title: string;
  projectTitle: string;
  estimatedDurationSeconds: number;
}

interface ActiveTimer {
  id: string;
  taskId: string;
  startTime: string | Date;
  taskTitle: string;
  estimatedDurationSeconds: number;
  totalRecordedSeconds: number;
}

interface SessionRow {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string | Date;
  endTime: string | Date | null;
  durationSeconds: number;
  notes: string | null;
  isManualCorrection: boolean;
}

interface TimeTrackingViewProps {
  initialActiveTimer: ActiveTimer | null;
  initialSessions: SessionRow[];
  initialTotals: { totalDurationSeconds: number; sessionCount: number };
  tasks: TaskOption[];
}

interface TrackingResponse {
  activeTimer: ActiveTimer | null;
  sessions: SessionRow[];
  totals: { totalDurationSeconds: number; sessionCount: number };
}

export function TimeTrackingView({
  initialActiveTimer,
  initialSessions,
  initialTotals,
  tasks,
}: TimeTrackingViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTimer, setActiveTimer] = React.useState<ActiveTimer | null>(initialActiveTimer);
  const [sessions, setSessions] = React.useState<SessionRow[]>(initialSessions);
  const [totals, setTotals] = React.useState(initialTotals);
  const [selectedTaskId, setSelectedTaskId] = React.useState(tasks[0]?.id ?? "");
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isBusy, setIsBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = React.useState(false);

  React.useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }
    const compute = () =>
      Math.max(0, Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
    setElapsedSeconds(compute());
    const interval = setInterval(() => setElapsedSeconds(compute()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/time-tracking");
    if (res.ok) {
      const data: TrackingResponse = await res.json();
      setActiveTimer(data.activeTimer);
      setSessions(data.sessions);
      setTotals(data.totals);
    }
    router.refresh();
  }, [router]);

  const handleStart = async () => {
    if (!selectedTaskId) {
      setError("Select a task to start tracking.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/time-tracking/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTaskId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start timer.");
      } else {
        toast("Timer started.");
        await refresh();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/time-tracking/stop", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to stop timer.");
      } else {
        toast("Session recorded. The task was not marked complete.");
        await refresh();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsBusy(false);
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="glass" className="space-y-5 p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <Timer size={20} />
              </span>
              <div>
                <h2 className="text-heading font-semibold text-foreground-primary">
                  Active session
                </h2>
                <p className="text-caption text-foreground-muted">
                  One stopwatch, task-level only.
                </p>
              </div>
            </div>
            <Badge variant={activeTimer ? "success" : "neutral"}>
              {activeTimer ? "Recording" : "Idle"}
            </Badge>
          </div>

          {activeTimer ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-status-success" />
                <span className="text-small font-medium text-foreground-primary">
                  {activeTimer.taskTitle}
                </span>
              </div>
              <TimerDisplay
                actualSeconds={activeTimer.totalRecordedSeconds + elapsedSeconds}
                estimatedSeconds={activeTimer.estimatedDurationSeconds}
                isRunning
                size="lg"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="danger" onClick={handleStop} disabled={isBusy}>
                  <Stop size={15} weight="fill" />
                  {isBusy ? "Stopping…" : "Stop session"}
                </Button>
                <p className="text-caption text-foreground-muted">
                  Stopping records the session and does not complete the task.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-small text-foreground-secondary">
                Select an open task and start the stopwatch. Only one timer may run at a time.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedTaskId}
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  disabled={tasks.length === 0}
                  aria-label="Task to track"
                  className="h-10 min-w-[200px] flex-1 rounded-lg bg-surface-raised/70 px-3 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40"
                >
                  {tasks.length === 0 ? (
                    <option value="">No open tasks available</option>
                  ) : (
                    tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} — {task.projectTitle}
                      </option>
                    ))
                  )}
                </select>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={isBusy || tasks.length === 0}
                >
                  <Play size={15} weight="fill" />
                  {isBusy ? "Starting…" : "Start"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsManualOpen(true)}
                  disabled={tasks.length === 0}
                >
                  <Plus size={15} />
                  Log manual
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card variant="surface" className="space-y-4 p-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-status-success/10 text-status-success">
            <Clock size={18} />
          </span>
          <div className="space-y-1">
            <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
              Total recorded
            </p>
            <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
              {formatSecondsToHuman(totals.totalDurationSeconds)}
            </span>
            <span className="block text-caption text-foreground-muted">
              {totals.sessionCount} session{totals.sessionCount === 1 ? "" : "s"} logged
            </span>
          </div>
          <p className="text-caption leading-relaxed text-foreground-muted">
            Derived from immutable session records. There are no independent project timers.
          </p>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-heading font-semibold text-foreground-primary">Recent sessions</h2>
          <Badge variant="neutral">{sessions.length}</Badge>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            kicker="Time engine idle"
            title="No sessions recorded"
            description="Discrete work intervals are logged in integer seconds. Actual task duration is computed dynamically as the sum of its sessions."
          />
        ) : (
          <div className="surface-panel overflow-hidden rounded-2xl px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-small font-medium text-foreground-primary">
                      {session.taskTitle}
                    </TableCell>
                    <TableCell className="font-mono text-caption text-foreground-secondary">
                      {new Date(session.startTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-small tabular-nums text-foreground-primary">
                      {formatSecondsToHuman(session.durationSeconds)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.isManualCorrection ? "warning" : "neutral"}>
                        {session.isManualCorrection ? "Manual" : "Timer"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ManualSessionDialog
        open={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSuccess={refresh}
        tasks={tasks}
      />
    </div>
  );
}

function ManualSessionDialog({
  open,
  onClose,
  onSuccess,
  tasks,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tasks: TaskOption[];
}) {
  const { toast } = useToast();
  const [taskId, setTaskId] = React.useState(tasks[0]?.id ?? "");
  const [minutes, setMinutes] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTaskId(tasks[0]?.id ?? "");
      setMinutes("");
      setNotes("");
      setError(null);
    }
  }, [open, tasks]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(minutes);
    if (!taskId) {
      setError("Select a task.");
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Duration must be a positive number of minutes.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/time-tracking/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          durationSeconds: Math.round(parsed * 60),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to log session.");
      } else {
        toast("Manual session logged.");
        onSuccess();
        onClose();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log manual session"
      description="Record an auditable work interval. Manual entries are flagged for review."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
            {error}
          </div>
        )}

        <Select
          label="Task"
          value={taskId}
          onChange={(event) => setTaskId(event.target.value)}
        >
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title} — {task.projectTitle}
            </option>
          ))}
        </Select>

        <Input
          label="Duration (minutes)"
          type="number"
          min="1"
          step="1"
          required
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="e.g. 45"
        />

        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="min-h-0 resize-none"
        />

        <div className="flex items-center justify-end gap-2 border-t border-separator/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? "Logging…" : "Log session"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
