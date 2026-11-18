"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDots,
  CaretLeft,
  Clock,
  MagnifyingGlass,
  Plus,
  Trash,
} from "@phosphor-icons/react";
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

export interface CandidateTask {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
  parentTaskId: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress";
  estimatedDurationSeconds: number;
  orderIndex: number;
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

type PriorityFilter = "all" | "high" | "medium" | "low";
type TypeFilter = "all" | "task" | "subtask";
type SortMode = "recommended" | "priority" | "shortest" | "longest" | "title";

interface CandidateProject {
  id: string;
  title: string;
  tasks: CandidateTask[];
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export function DailyPlanView({ date, initialItems, candidateTasks }: DailyPlanViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<PlanItemRow[]>(initialItems);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [addMinutes, setAddMinutes] = React.useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [sortMode, setSortMode] = React.useState<SortMode>("recommended");

  const allocatedSeconds = items.reduce((sum, item) => sum + item.plannedDurationSeconds, 0);
  const remainingSeconds = Math.max(0, MAX_DAILY_PLANNED_SECONDS - allocatedSeconds);
  const isCapacityReached = allocatedSeconds >= MAX_DAILY_PLANNED_SECONDS;
  const plannedTaskIds = React.useMemo(
    () => new Set(items.map((item) => item.taskId)),
    [items],
  );
  const availableTasks = React.useMemo(
    () => candidateTasks.filter((task) => !plannedTaskIds.has(task.id)),
    [candidateTasks, plannedTaskIds],
  );
  const candidateProjects = React.useMemo<CandidateProject[]>(() => {
    const grouped = new Map<string, CandidateProject>();
    for (const task of availableTasks) {
      const existing = grouped.get(task.projectId);
      if (existing) {
        existing.tasks.push(task);
      } else {
        grouped.set(task.projectId, {
          id: task.projectId,
          title: task.projectTitle,
          tasks: [task],
        });
      }
    }
    return [...grouped.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [availableTasks]);
  const selectedProject =
    candidateProjects.find((project) => project.id === selectedProjectId) ?? null;
  const filteredProjectTasks = React.useMemo(() => {
    if (!selectedProject) return [];
    const query = search.trim().toLowerCase();
    const filtered = selectedProject.tasks.filter((task) => {
      const matchesSearch = !query || task.title.toLowerCase().includes(query);
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "subtask" ? Boolean(task.parentTaskId) : !task.parentTaskId);
      return matchesSearch && matchesPriority && matchesType;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "priority") {
        return (
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          a.title.localeCompare(b.title)
        );
      }
      if (sortMode === "shortest" || sortMode === "longest") {
        if (!a.estimatedDurationSeconds && !b.estimatedDurationSeconds) {
          return a.title.localeCompare(b.title);
        }
        if (!a.estimatedDurationSeconds) return 1;
        if (!b.estimatedDurationSeconds) return -1;
        return sortMode === "shortest"
          ? a.estimatedDurationSeconds - b.estimatedDurationSeconds ||
              a.title.localeCompare(b.title)
          : b.estimatedDurationSeconds - a.estimatedDurationSeconds ||
              a.title.localeCompare(b.title);
      }
      if (sortMode === "title") {
        return a.title.localeCompare(b.title);
      }
      return a.orderIndex - b.orderIndex || a.title.localeCompare(b.title);
    });
  }, [priorityFilter, search, selectedProject, sortMode, typeFilter]);

  React.useEffect(() => {
    if (selectedProjectId && !candidateProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [candidateProjects, selectedProjectId]);

  const openProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearch("");
    setPriorityFilter("all");
    setTypeFilter("all");
    setSortMode("recommended");
  };

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
            <div>
              <h2 className="text-heading font-semibold text-foreground-primary">
                {selectedProject ? selectedProject.title : "Choose a project"}
              </h2>
              <p className="text-caption text-foreground-muted">
                {selectedProject
                  ? `${filteredProjectTasks.length} matching task${filteredProjectTasks.length === 1 ? "" : "s"}`
                  : `${candidateProjects.length} project${candidateProjects.length === 1 ? "" : "s"} with open work`}
              </p>
            </div>
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

          {!selectedProject ? (
            candidateProjects.length === 0 ? (
              <EmptyState
                kicker="No available work"
                title="Nothing left to plan"
                description="Open tasks from active projects that are not already in today's plan will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {candidateProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => openProject(project.id)}
                    className="surface-panel group flex min-h-24 flex-col justify-between rounded-2xl p-4 text-left transition-colors hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <span className="line-clamp-2 text-small font-medium text-foreground-primary">
                      {project.title}
                    </span>
                    <span className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-mono text-caption tabular-nums text-foreground-muted">
                        {project.tasks.length} available
                      </span>
                      <span className="text-caption font-medium text-accent transition-transform group-hover:translate-x-0.5">
                        Open
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="inline-flex items-center gap-1.5 text-caption font-medium text-foreground-secondary transition-colors hover:text-foreground-primary"
              >
                <CaretLeft size={13} />
                All projects
              </button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="relative col-span-1 sm:col-span-2">
                  <span className="sr-only">Search tasks in {selectedProject.title}</span>
                  <MagnifyingGlass
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search this project's tasks"
                    className="h-9 w-full rounded-lg bg-surface-raised/70 pl-9 pr-3 text-caption text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none placeholder:text-foreground-quaternary focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                </label>
                <select
                  aria-label="Filter tasks by priority"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
                  className={selectClass}
                >
                  <option value="all">All priorities</option>
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
                <select
                  aria-label="Filter tasks by type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                  className={selectClass}
                >
                  <option value="all">Tasks and subtasks</option>
                  <option value="task">Tasks only</option>
                  <option value="subtask">Subtasks only</option>
                </select>
                <select
                  aria-label="Sort tasks"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className={`${selectClass} sm:col-span-2`}
                >
                  <option value="recommended">Project order</option>
                  <option value="priority">Priority first</option>
                  <option value="shortest">Shortest first</option>
                  <option value="longest">Longest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>

              {filteredProjectTasks.length === 0 ? (
                <EmptyState
                  kicker="No matches"
                  title="No tasks match these filters"
                  description="Clear the search or choose different priority and task-type filters."
                />
              ) : (
                <div className="space-y-2.5">
                  {filteredProjectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="surface-panel flex items-center justify-between gap-3 rounded-2xl p-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-small font-medium text-foreground-primary">
                            {task.title}
                          </p>
                          {task.parentTaskId && (
                            <Badge variant="neutral">Subtask</Badge>
                          )}
                        </div>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-caption text-foreground-muted">
                          <span>{task.priority} priority</span>
                          <span aria-hidden="true">·</span>
                          <span>{task.status === "in_progress" ? "In progress" : "To do"}</span>
                          {task.estimatedDurationSeconds > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>ETA {formatSecondsToHuman(task.estimatedDurationSeconds)}</span>
                            </>
                          )}
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
