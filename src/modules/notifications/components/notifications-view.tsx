"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRinging,
  CalendarPlus,
  CheckCircle,
  Pause,
  Play,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/state-views";
import { useToast } from "@/components/ui/toast";
import {
  ScheduleFields,
  defaultScheduleDraft,
  schedulePayload,
  type ScheduleDraft,
} from "./schedule-fields";
import type { RecurrenceRule } from "../domain/types";

interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  status: "active" | "paused" | "completed" | "archived";
  taskId: string | null;
  projectId: string | null;
  disciplineId: string | null;
}

interface ScheduleRow {
  id: string;
  sourceId: string;
  timezone: string;
  recurrence: RecurrenceRule;
  status: "active" | "paused" | "ended";
  nextRunAt: string | Date;
}

interface OccurrenceRow {
  id: string;
  scheduleId: string;
  sourceId: string;
  scheduledFor: string | Date;
  snoozedUntil: string | Date | null;
  status: "scheduled" | "completed" | "dismissed" | "cancelled";
}

interface DeliveryRow {
  occurrenceId: string;
  status: string;
  readAt: string | Date | null;
  deliveredAt: string | Date | null;
}

interface NotifyData {
  notifications: NotificationRow[];
  schedules: ScheduleRow[];
  occurrences: OccurrenceRow[];
  deliveries: DeliveryRow[];
  history: Array<{
    id: string;
    sourceId: string;
    eventType: string;
    createdAt: string | Date;
  }>;
}

interface AssociationOption {
  id: string;
  title: string;
}

type FilterType = "all" | "upcoming" | "due" | "completed";

function recurrenceLabel(rule: RecurrenceRule): string {
  if (rule.type === "once") return "One time";
  if (rule.type === "daily") return "Daily";
  if (rule.type === "weekdays") return "Selected weekdays";
  if (rule.type === "weekly") return `Weekly · every ${rule.interval} week${rule.interval === 1 ? "" : "s"}`;
  if (rule.type === "monthly") return `Monthly · day ${rule.dayOfMonth}`;
  return `Every ${rule.interval} ${rule.unit}`;
}

export function NotificationsView({
  initialData,
  disciplines,
  projects,
  tasks,
}: {
  initialData: NotifyData;
  disciplines: AssociationOption[];
  projects: AssociationOption[];
  tasks: AssociationOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState(initialData);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<NotificationRow | null>(null);
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [association, setAssociation] = React.useState("");
  const [scheduleDraft, setScheduleDraft] = React.useState<ScheduleDraft>(defaultScheduleDraft);
  const [isSaving, setIsSaving] = React.useState(false);
  const [workingId, setWorkingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const refresh = React.useCallback(async () => {
    const response = await fetch("/api/notifications");
    if (response.ok) setData(await response.json());
    router.refresh();
  }, [router]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setMessage("");
    setAssociation("");
    setScheduleDraft(defaultScheduleDraft());
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (notification: NotificationRow) => {
    setEditing(notification);
    setTitle(notification.title);
    setMessage(notification.message ?? "");
    setAssociation(
      notification.taskId
        ? `task:${notification.taskId}`
        : notification.projectId
          ? `project:${notification.projectId}`
          : notification.disciplineId
            ? `discipline:${notification.disciplineId}`
            : "",
    );
    const schedule = data.schedules.find(
      (item) => item.sourceId === notification.id && item.status !== "ended",
    );
    const next = schedule ? new Date(schedule.nextRunAt) : new Date();
    setScheduleDraft({
      ...defaultScheduleDraft(),
      timezone: schedule?.timezone ?? defaultScheduleDraft().timezone,
      startDate: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`,
      startTime: `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`,
      recurrence: schedule?.recurrence ?? { type: "once" },
    });
    setError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    const [associationType, associationId] = association
      ? association.split(":")
      : [null, null];
    try {
      const response = await fetch(
        editing ? `/api/notifications/${editing.id}` : "/api/notifications",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            message: message.trim() || undefined,
            associationType,
            associationId,
            schedule: schedulePayload(scheduleDraft),
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save notification");
      setDialogOpen(false);
      toast(editing ? "Notification updated and rescheduled." : "Notification created.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save notification");
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (
    notification: NotificationRow,
    action: "pause" | "resume" | "complete" | "end",
  ) => {
    setWorkingId(notification.id);
    const response = await fetch(`/api/notifications/${notification.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) {
      toast(
        action === "complete"
          ? "Notification completed."
          : action === "end"
            ? "Recurring schedule ended."
            : `Notification ${action}d.`,
      );
      await refresh();
    } else {
      const body = await response.json();
      setError(body.error || "Unable to update notification");
    }
    setWorkingId(null);
  };

  const runOccurrenceAction = async (
    occurrence: OccurrenceRow,
    action: "read" | "snooze" | "complete" | "dismiss",
  ) => {
    setWorkingId(occurrence.id);
    const response = await fetch(`/api/notification-occurrences/${occurrence.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(action === "snooze" ? { minutes: 10 } : {}) }),
    });
    if (response.ok) {
      toast(action === "snooze" ? "Snoozed for 10 minutes." : `Occurrence ${action}.`);
      await refresh();
    } else {
      const body = await response.json();
      setError(body.error || "Unable to update notification");
    }
    setWorkingId(null);
  };

  const deleteNotification = async (notification: NotificationRow) => {
    if (!window.confirm(`Delete “${notification.title}” and its schedule history?`)) return;
    const response = await fetch(`/api/notifications/${notification.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast("Notification deleted.");
      await refresh();
    }
  };

  const now = Date.now();
  const rows = data.notifications.filter((notification) => {
    const occurrences = data.occurrences.filter(
      (occurrence) => occurrence.sourceId === notification.id,
    );
    const due = occurrences.some(
      (occurrence) =>
        occurrence.status === "scheduled" &&
        new Date(occurrence.snoozedUntil ?? occurrence.scheduledFor).getTime() <= now,
    );
    const upcoming = occurrences.some(
      (occurrence) =>
        occurrence.status === "scheduled" &&
        new Date(occurrence.snoozedUntil ?? occurrence.scheduledFor).getTime() > now,
    );
    if (filter === "due") return due;
    if (filter === "upcoming") return upcoming;
    if (filter === "completed") return notification.status === "completed";
    return true;
  });

  const dueCount = data.notifications.filter((notification) =>
    data.occurrences.some(
      (occurrence) =>
        occurrence.sourceId === notification.id &&
        occurrence.status === "scheduled" &&
        new Date(occurrence.snoozedUntil ?? occurrence.scheduledFor).getTime() <= now,
    ),
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Attention"
        title="Notify"
        description="Standalone reminders and scheduled deliveries. Sources stay independent; Cockpit is the current destination."
        badge={
          <Badge variant={dueCount > 0 ? "warning" : "neutral"}>{dueCount} due</Badge>
        }
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={15} weight="bold" />
            Create notification
          </Button>
        }
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-status-error/[0.08] px-4 py-3 text-small text-status-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <SegmentedControl
        options={[
          { value: "all", label: "All", count: data.notifications.length },
          { value: "upcoming", label: "Upcoming" },
          { value: "due", label: "Due", count: dueCount },
          {
            value: "completed",
            label: "Completed",
            count: data.notifications.filter((item) => item.status === "completed").length,
          },
        ]}
        value={filter}
        onChange={setFilter}
        ariaLabel="Filter notifications"
      />

      {rows.length === 0 ? (
        <EmptyState
          kicker={data.notifications.length === 0 ? "No notifications yet" : "No matching notifications"}
          title={data.notifications.length === 0 ? "Create your first reminder" : "Try another filter"}
          description="A notification can be completely standalone or optionally reference a task, project, or discipline."
          actionLabel={data.notifications.length === 0 ? "Create notification" : undefined}
          onAction={data.notifications.length === 0 ? openCreate : undefined}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((notification) => {
            const schedules = data.schedules.filter(
              (schedule) => schedule.sourceId === notification.id,
            );
            const activeSchedule =
              schedules.find((schedule) => schedule.status === "active") ??
              schedules.find((schedule) => schedule.status === "paused");
            const currentSchedule = activeSchedule ?? schedules[0];
            const occurrences = data.occurrences
              .filter((occurrence) => occurrence.sourceId === notification.id)
              .sort(
                (a, b) =>
                  new Date(a.snoozedUntil ?? a.scheduledFor).getTime() -
                  new Date(b.snoozedUntil ?? b.scheduledFor).getTime(),
              );
            const dueOccurrence = occurrences.find(
              (occurrence) =>
                occurrence.status === "scheduled" &&
                new Date(occurrence.snoozedUntil ?? occurrence.scheduledFor).getTime() <= now,
            );
            const nextOccurrence = occurrences.find(
              (occurrence) =>
                occurrence.status === "scheduled" &&
                new Date(occurrence.snoozedUntil ?? occurrence.scheduledFor).getTime() > now,
            );
            const delivery = dueOccurrence
              ? data.deliveries.find((item) => item.occurrenceId === dueOccurrence.id)
              : null;
            const associationLabel = notification.taskId
              ? `Task: ${tasks.find((task) => task.id === notification.taskId)?.title ?? "Unknown"}`
              : notification.projectId
                ? `Project: ${projects.find((project) => project.id === notification.projectId)?.title ?? "Unknown"}`
                : notification.disciplineId
                  ? `Discipline: ${disciplines.find((discipline) => discipline.id === notification.disciplineId)?.title ?? "Unknown"}`
                  : "Standalone";

            return (
              <Card key={notification.id} variant="surface" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-heading font-semibold text-foreground-primary">
                        {notification.title}
                      </h2>
                      <Badge
                        variant={
                          notification.status === "active"
                            ? "accent"
                            : notification.status === "paused"
                              ? "warning"
                              : notification.status === "completed"
                                ? "success"
                                : "neutral"
                        }
                      >
                        {notification.status}
                      </Badge>
                      {dueOccurrence && <Badge variant="warning">Due now</Badge>}
                    </div>
                    {notification.message && (
                      <p className="max-w-3xl whitespace-pre-wrap text-small text-foreground-secondary">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-caption text-foreground-muted">{associationLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(notification)}>
                      Edit / reschedule
                    </Button>
                    {notification.status === "active" && activeSchedule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction(notification, "pause")}
                        disabled={workingId === notification.id}
                      >
                        <Pause size={14} />
                        Pause
                      </Button>
                    )}
                    {notification.status === "paused" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction(notification, "resume")}
                        disabled={workingId === notification.id}
                      >
                        <Play size={14} />
                        Resume
                      </Button>
                    )}
                    {notification.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction(notification, "complete")}
                        disabled={workingId === notification.id}
                      >
                        <CheckCircle size={14} />
                        Complete
                      </Button>
                    )}
                    {activeSchedule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction(notification, "end")}
                        disabled={workingId === notification.id}
                      >
                        End recurrence
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label={`Delete ${notification.title}`}
                      onClick={() => deleteNotification(notification)}
                      className="grid h-9 w-9 place-items-center rounded text-foreground-muted hover:bg-status-error/10 hover:text-status-error"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 border-t border-separator/10 pt-3 text-caption text-foreground-muted sm:grid-cols-3">
                  <span>
                    Schedule:{" "}
                    {currentSchedule ? recurrenceLabel(currentSchedule.recurrence) : "None"}
                  </span>
                  <span>
                    Destination: <strong className="text-foreground-secondary">Cockpit</strong>
                  </span>
                  <span>
                    Delivery:{" "}
                    <strong className="text-foreground-secondary">
                      {delivery?.status ?? "Not due yet"}
                    </strong>
                  </span>
                </div>

                {nextOccurrence && (
                  <p className="font-mono text-caption text-foreground-secondary">
                    Next:{" "}
                    {new Date(
                      nextOccurrence.snoozedUntil ?? nextOccurrence.scheduledFor,
                    ).toLocaleString()}
                  </p>
                )}

                {dueOccurrence && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-status-warning/[0.08] px-3.5 py-3">
                    <span className="mr-auto text-small text-status-warning">
                      Due {new Date(dueOccurrence.snoozedUntil ?? dueOccurrence.scheduledFor).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runOccurrenceAction(dueOccurrence, "read")}
                    >
                      Mark read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runOccurrenceAction(dueOccurrence, "snooze")}
                    >
                      Snooze 10m
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => runOccurrenceAction(dueOccurrence, "complete")}
                    >
                      Complete occurrence
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runOccurrenceAction(dueOccurrence, "dismiss")}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-heading font-semibold text-foreground-primary">
            Notification history
          </h2>
          <p className="text-caption text-foreground-muted">
            Scheduling, edits, reviews, snoozes, and resolutions are retained as events.
          </p>
        </div>
        {data.history.length === 0 ? (
          <Card variant="surface">
            <p className="text-small text-foreground-muted">No notification events yet.</p>
          </Card>
        ) : (
          <Card variant="surface" className="divide-y divide-separator/[0.07] p-0">
            {data.history.slice(0, 15).map((event) => {
              const notification = data.notifications.find(
                (item) => item.id === event.sourceId,
              );
              return (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{event.eventType.replaceAll("_", " ")}</Badge>
                    <span className="text-small text-foreground-primary">
                      {notification?.title ?? "Task Yard recall card"}
                    </span>
                  </div>
                  <span className="font-mono text-caption text-foreground-muted">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit notification" : "Create notification"}
        description="Only Cockpit delivery is available today. Advanced recurrence remains optional."
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What should you remember?"
          />
          <Textarea
            label="Message (optional)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder="Additional context"
          />
          <Select
            label="Related item (optional)"
            value={association}
            onChange={(event) => setAssociation(event.target.value)}
          >
            <option value="">Standalone — no association</option>
            <optgroup label="Tasks">
              {tasks.map((task) => (
                <option key={task.id} value={`task:${task.id}`}>
                  {task.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Projects">
              {projects.map((project) => (
                <option key={project.id} value={`project:${project.id}`}>
                  {project.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Disciplines">
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={`discipline:${discipline.id}`}>
                  {discipline.title}
                </option>
              ))}
            </optgroup>
          </Select>
          <ScheduleFields value={scheduleDraft} onChange={setScheduleDraft} />
          <div className="flex justify-end gap-2 border-t border-separator/10 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={save}
              disabled={isSaving || !title.trim()}
            >
              <CalendarPlus size={15} />
              {isSaving ? "Saving…" : editing ? "Save and reschedule" : "Create notification"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
