"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CalendarBlank,
  CaretDown,
  CaretRight,
  Check,
  CircleNotch,
  Clock,
  ListChecks,
  MagnifyingGlass,
  Minus,
  Notebook,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/state-views";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/shared/utils/cn";
import { CreateTaskDialog } from "./create-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import type { TaskWithSubtasks, Task } from "@/modules/tasks/domain/types";
import type { TaskStatus, TaskPriority } from "@/modules/tasks/validation";

function formatEstimate(seconds: number): string {
  if (seconds === 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Done",
  cancelled: "Cancelled",
};

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "completed",
  completed: "todo",
  cancelled: "todo",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_BADGE: Record<TaskPriority, "neutral" | "warning" | "error"> = {
  low: "neutral",
  medium: "warning",
  high: "error",
};

const selectClass =
  "h-9 rounded-lg bg-surface-raised/70 px-2.5 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent/40";

function StatusButton({
  status,
  onClick,
  disabled,
  size = "md",
}: {
  status: TaskStatus;
  onClick: () => void;
  disabled: boolean;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Mark as ${STATUS_LABEL[STATUS_CYCLE[status]].toLowerCase()}`}
      aria-label={`Mark as ${STATUS_LABEL[STATUS_CYCLE[status]].toLowerCase()}`}
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition-all duration-150 disabled:opacity-40",
        dimension,
        status === "completed" && "bg-status-success text-white",
        status === "in_progress" && "border-[1.5px] border-status-warning",
        status === "cancelled" && "bg-foreground-quaternary text-background-primary",
        status === "todo" &&
          "border-[1.5px] border-foreground-quaternary hover:border-accent hover:bg-accent/5",
      )}
    >
      {status === "completed" && <Check size={size === "sm" ? 10 : 12} weight="bold" />}
      {status === "in_progress" && (
        <span className="h-2 w-2 rounded-full bg-status-warning" />
      )}
      {status === "cancelled" && <Minus size={size === "sm" ? 10 : 12} weight="bold" />}
    </button>
  );
}

function ConfirmDeleteDialog({
  open,
  taskTitle,
  isSubtask,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  taskTitle: string;
  isSubtask: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Delete task"
      description="This action cannot be undone."
    >
      <div className="space-y-5">
        <p className="text-body text-foreground-secondary">
          Delete <span className="font-medium text-foreground-primary">&quot;{taskTitle}&quot;</span>?
        </p>
        {!isSubtask && (
          <p className="rounded-xl bg-status-error/[0.07] px-3.5 py-3 text-small text-status-error">
            All subtasks will also be deleted. A deletion record is preserved in history.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function SubtaskRow({
  subtask,
  onStatusCycle,
  onEdit,
  onDelete,
  isLoading,
}: {
  subtask: Task;
  onStatusCycle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isLoading: boolean;
}) {
  const isDone = subtask.status === "completed" || subtask.status === "cancelled";

  return (
    <div className="group flex items-center gap-3 border-t border-separator/[0.06] py-2.5 pl-11 pr-4 transition-colors hover:bg-surface-hover/25">
      <StatusButton
        status={subtask.status as TaskStatus}
        onClick={() => onStatusCycle(subtask)}
        disabled={isLoading}
        size="sm"
      />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={cn(
            "truncate text-small",
            isDone ? "text-foreground-muted line-through" : "text-foreground-primary",
          )}
        >
          {subtask.title}
        </span>
        {subtask.estimatedDurationSeconds > 0 && (
          <span className="shrink-0 font-mono text-micro tabular-nums text-foreground-muted">
            {formatEstimate(subtask.estimatedDurationSeconds)}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <Link
          href={`/tasks/${subtask.id}/yard`}
          aria-label={`Open Task Yard for ${subtask.title}`}
          className="grid h-8 w-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <Notebook size={14} />
        </Link>
        <button
          type="button"
          onClick={() => onEdit(subtask)}
          aria-label="Edit subtask"
          className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary"
        >
          <PencilSimple size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(subtask)}
          aria-label="Delete subtask"
          className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-status-error/10 hover:text-status-error"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onStatusCycle,
  onEdit,
  onDelete,
  onAddSubtask,
  onMove,
  canMoveUp,
  canMoveDown,
  isLoading,
}: {
  task: TaskWithSubtasks;
  onStatusCycle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (parentTask: Task) => void;
  onMove: (task: Task, direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLoading: boolean;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const hasSubtasks = task.subtasks.length > 0;
  const completedSubtaskCount = task.subtasks.filter(
    (subtask) => subtask.status === "completed" || subtask.status === "cancelled",
  ).length;
  const isDone = task.status === "completed" || task.status === "cancelled";

  return (
    <div className="surface-panel overflow-hidden rounded-2xl">
      <div className="group flex items-start gap-3 p-4 transition-colors hover:bg-surface-hover/25">
        <div className="pt-0.5">
          <StatusButton
            status={task.status as TaskStatus}
            onClick={() => onStatusCycle(task)}
            disabled={isLoading}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-small font-medium",
                isDone ? "text-foreground-muted line-through" : "text-foreground-primary",
              )}
            >
              {task.title}
            </span>
            {task.allSubtasksCompleted && task.status !== "completed" && (
              <Badge variant="success">All subtasks done</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-foreground-muted">
            {task.estimatedDurationSeconds > 0 && (
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock size={12} />
                {formatEstimate(task.estimatedDurationSeconds)}
              </span>
            )}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 font-mono">
                <CalendarBlank size={12} />
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {hasSubtasks && (
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <ListChecks size={12} />
                {completedSubtaskCount}/{task.subtasks.length} subtasks
              </span>
            )}
            <Badge variant={PRIORITY_BADGE[task.priority as TaskPriority]}>
              {PRIORITY_LABEL[task.priority as TaskPriority]}
            </Badge>
            <Badge
              variant={
                task.status === "completed"
                  ? "success"
                  : task.status === "in_progress"
                    ? "warning"
                    : "neutral"
              }
            >
              {STATUS_LABEL[task.status as TaskStatus]}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(task, "up")}
            disabled={isLoading || !canMoveUp}
            aria-label={`Move ${task.title} up`}
            className="grid h-8 w-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary disabled:opacity-25"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(task, "down")}
            disabled={isLoading || !canMoveDown}
            aria-label={`Move ${task.title} down`}
            className="grid h-8 w-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary disabled:opacity-25"
          >
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => onAddSubtask(task)}
            disabled={isLoading}
            aria-label="Add subtask"
            className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
          <Link
            href={`/tasks/${task.id}/yard`}
            aria-label={`Open Task Yard for ${task.title}`}
            className="grid h-8 w-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-accent/10 hover:text-accent"
          >
            <Notebook size={14} />
          </Link>
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary"
          >
            <PencilSimple size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-status-error/10 hover:text-status-error"
          >
            <Trash size={14} />
          </button>
          {hasSubtasks && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
              className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary"
            >
              {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
            </button>
          )}
        </div>
      </div>

      {hasSubtasks && expanded && (
        <div>
          {task.subtasks.map((subtask) => (
            <SubtaskRow
              key={subtask.id}
              subtask={subtask}
              onStatusCycle={onStatusCycle}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAddBar({ projectId, onSuccess }: { projectId: string; onSuccess: () => void }) {
  const [title, setTitle] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add task.");
      } else {
        setTitle("");
        toast("Task added.");
        onSuccess();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Plus
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
        />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Quick add a task and press Enter"
          disabled={isLoading}
          className="h-10 w-full rounded-xl bg-surface-raised/60 pl-9 pr-3 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-all placeholder:text-foreground-quaternary hover:bg-surface-raised focus-visible:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40"
        />
      </div>
      {title.trim() && (
        <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
          {isLoading ? "Adding…" : "Add"}
        </Button>
      )}
      {error && <span className="text-caption text-status-error">{error}</span>}
    </form>
  );
}

interface TaskListProps {
  projectId: string;
  initialTasks?: TaskWithSubtasks[];
}

export function TaskList({ projectId, initialTasks = [] }: TaskListProps) {
  const [tasks, setTasks] = React.useState<TaskWithSubtasks[]>(initialTasks);
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "all">("all");
  const [search, setSearch] = React.useState("");
  const [showCompleted, setShowCompleted] = React.useState(false);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createSubtaskParent, setCreateSubtaskParent] = React.useState<Task | null>(null);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = React.useState<Task | null>(null);

  const [parentSuggestion, setParentSuggestion] = React.useState<{
    parentTask: Task;
    message: string;
  } | null>(null);

  const fetchTasks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        withSubtasks: "true",
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, statusFilter, priorityFilter, search]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusCycle = async (task: Task) => {
    const nextStatus = STATUS_CYCLE[task.status as TaskStatus];
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.suggestParentCompletion && data.parentTask) {
          setParentSuggestion({
            parentTask: data.parentTask,
            message: `All subtasks of "${data.parentTask.title}" are done. Mark the parent complete?`,
          });
        }
        await fetchTasks();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteParent = async () => {
    if (!parentSuggestion) return;
    setActionLoading(true);
    try {
      await fetch(`/api/tasks/${parentSuggestion.parentTask.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      await fetchTasks();
    } finally {
      setActionLoading(false);
      setParentSuggestion(null);
    }
  };

  const handleDelete = async (task: Task) => {
    setActionLoading(true);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      await fetchTasks();
    } finally {
      setActionLoading(false);
      setDeletingTask(null);
    }
  };

  const displayedTasks = showCompleted
    ? tasks
    : tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled");

  const completedCount = tasks.filter(
    (task) => task.status === "completed" || task.status === "cancelled",
  ).length;

  const handleMove = async (task: Task, direction: "up" | "down") => {
    const currentIds = displayedTasks.map((item) => item.id);
    const currentIndex = currentIds.indexOf(task.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentIds.length) return;

    const reorderedIds = tasks.map((item) => item.id);
    const fullCurrentIndex = reorderedIds.indexOf(task.id);
    const fullTargetIndex = reorderedIds.indexOf(currentIds[targetIndex]);
    [reorderedIds[fullCurrentIndex], reorderedIds[fullTargetIndex]] = [
      reorderedIds[fullTargetIndex],
      reorderedIds[fullCurrentIndex],
    ];

    setActionLoading(true);
    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          items: reorderedIds.map((id, orderIndex) => ({ id, orderIndex })),
        }),
      });
      if (response.ok) await fetchTasks();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <input
            type="text"
            placeholder="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg bg-surface-raised/70 pl-9 pr-3 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-colors placeholder:text-foreground-quaternary hover:bg-surface-raised focus-visible:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "all")}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | "all")}
          aria-label="Filter by priority"
          className={selectClass}
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <Button variant="primary" size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus size={15} weight="bold" />
          Task
        </Button>
      </div>

      <QuickAddBar projectId={projectId} onSuccess={fetchTasks} />

      {parentSuggestion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-status-success/[0.08] px-4 py-3 text-small text-status-success shadow-[inset_0_0_0_1px_rgb(var(--status-success)/0.16)]">
          <span>{parentSuggestion.message}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCompleteParent}
              disabled={actionLoading}
              className="font-medium underline underline-offset-2 disabled:opacity-40"
            >
              Mark complete
            </button>
            <button
              type="button"
              onClick={() => setParentSuggestion(null)}
              className="text-caption text-foreground-muted transition-colors hover:text-foreground-secondary"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-small text-foreground-muted">
          <CircleNotch size={14} className="animate-spin" />
          Loading tasks…
        </div>
      )}

      {!isLoading && displayedTasks.length === 0 && (
        <EmptyState
          kicker="No tasks yet"
          title="Add the first task"
          description="Use the quick-add bar above, or open the full task dialog for estimates, priority, and due dates."
        />
      )}

      {!isLoading && displayedTasks.length > 0 && (
        <div className="space-y-2.5">
          {displayedTasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusCycle={handleStatusCycle}
              onEdit={(selected) => setEditingTask(selected)}
              onDelete={(selected) => setDeletingTask(selected)}
              onAddSubtask={(parent) => setCreateSubtaskParent(parent)}
              onMove={handleMove}
              canMoveUp={index > 0}
              canMoveDown={index < displayedTasks.length - 1}
              isLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {completedCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCompleted((value) => !value)}
          className="text-foreground-secondary"
        >
          {showCompleted ? <CaretDown size={14} /> : <CaretRight size={14} />}
          {showCompleted ? "Hide" : "Show"} {completedCount} completed
        </Button>
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchTasks}
        projectId={projectId}
      />

      <CreateTaskDialog
        open={Boolean(createSubtaskParent)}
        onClose={() => setCreateSubtaskParent(null)}
        onSuccess={fetchTasks}
        projectId={projectId}
        parentTaskId={createSubtaskParent?.id}
        parentTaskTitle={createSubtaskParent?.title}
      />

      {editingTask && (
        <EditTaskDialog
          open={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          onSuccess={fetchTasks}
          task={editingTask}
        />
      )}

      {deletingTask && (
        <ConfirmDeleteDialog
          open={Boolean(deletingTask)}
          taskTitle={deletingTask.title}
          isSubtask={Boolean(deletingTask.parentTaskId)}
          onConfirm={() => handleDelete(deletingTask)}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
