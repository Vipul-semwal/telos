"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarBlank,
  CheckSquare,
  Clock,
  PencilSimple,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditProjectDialog } from "@/modules/projects/components/edit-project-dialog";
import { TaskList } from "@/modules/tasks/components/task-list";
import { formatSecondsToHuman } from "@/shared/utils/duration";
import { cn } from "@/shared/utils/cn";
import type { Project, ProjectStatus } from "@/modules/projects/domain/types";

interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedDurationSeconds: number;
  parentTaskId: string | null;
  createdAt: Date;
}

interface ProjectDetailViewProps {
  project: Project & {
    disciplineTitle: string;
    tasks: TaskSummary[];
    taskCount: number;
    completedTaskCount: number;
    totalDurationSeconds: number;
  };
  disciplineActiveCount: number;
  report: {
    taskCount: number;
    completedTaskCount: number;
    totalDurationSeconds: number;
    totalEstimatedSeconds: number;
    varianceSeconds: number;
    sessionCount: number;
  } | null;
  initialTab?: TabType;
}

type TabType =
  | "overview"
  | "tasks"
  | "reports"

const statusBadgeVariant: Record<ProjectStatus, "accent" | "neutral" | "success" | "warning"> = {
  active: "accent",
  paused: "warning",
  completed: "success",
  archived: "neutral",
};

const statusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export function ProjectDetailView({
  project,
  disciplineActiveCount,
  report,
  initialTab = "overview",
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabType>(initialTab);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const refreshData = () => {
    router.refresh();
  };

  const handleStatusTransition = async (newStatus: ProjectStatus) => {
    setActionError(null);
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to transition project status");
      } else {
        refreshData();
      }
    } catch {
      setActionError("Network error attempting status transition");
    } finally {
      setIsActionLoading(false);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: `Tasks (${project.taskCount})` },
    { id: "reports", label: "Reports" },
  ];

  const completionPct =
    project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-1.5 text-caption text-foreground-muted">
        <Link href="/disciplines" className="transition-colors hover:text-foreground-primary">
          Disciplines
        </Link>
        <span className="text-foreground-quaternary">/</span>
        <span className="font-medium text-foreground-secondary">{project.disciplineTitle}</span>
        <span className="text-foreground-quaternary">/</span>
        <Link href="/projects" className="transition-colors hover:text-foreground-primary">
          Projects
        </Link>
        <span className="text-foreground-quaternary">/</span>
        <span className="max-w-52 truncate text-foreground-secondary">{project.title}</span>
      </div>

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-status-error/[0.08] px-4 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="shrink-0 text-caption font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <PageHeader
        moduleCode={project.disciplineTitle}
        title={project.title}
        description={
          project.desiredOutcome ? `Outcome: ${project.desiredOutcome}` : undefined
        }
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant[project.status]}>
              {statusLabels[project.status]}
            </Badge>
            <span className="font-mono text-caption text-foreground-muted">
              {disciplineActiveCount}/3 active
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              disabled={isActionLoading}
            >
              <PencilSimple size={14} />
              Edit
            </Button>

            {project.status === "active" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusTransition("paused")}
                disabled={isActionLoading}
              >
                Pause
              </Button>
            )}

            {project.status === "paused" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusTransition("active")}
                disabled={isActionLoading}
              >
                Resume
              </Button>
            )}

            {project.status !== "completed" && project.status !== "archived" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusTransition("completed")}
                disabled={isActionLoading}
                className="text-status-success"
              >
                Complete
              </Button>
            )}

            {project.status !== "archived" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusTransition("archived")}
                disabled={isActionLoading}
              >
                Archive
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusTransition("active")}
                  disabled={isActionLoading}
                >
                  Restore as active
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusTransition("paused")}
                  disabled={isActionLoading}
                >
                  Restore as paused
                </Button>
              </div>
            )}
          </div>
        }
      />

      <div className="glass-thin flex items-center gap-0.5 overflow-x-auto rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-small font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-surface-elevated text-foreground-primary shadow-control"
                : "text-foreground-secondary hover:text-foreground-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card variant="glass" className="space-y-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                <CheckSquare size={16} />
              </span>
              <div className="space-y-2">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  Task execution
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-title font-semibold tabular-nums text-foreground-primary">
                    {project.completedTaskCount} / {project.taskCount}
                  </span>
                  <span className="text-caption text-foreground-muted">completed</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, completionPct)}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card variant="glass" className="space-y-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-status-success/10 text-status-success">
                <Clock size={16} />
              </span>
              <div className="space-y-0.5">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  Recorded duration
                </p>
                <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                  {formatSecondsToHuman(project.totalDurationSeconds)}
                </span>
                <p className="text-caption text-foreground-muted">
                  Summed dynamically from task sessions.
                </p>
              </div>
            </Card>

            <Card variant="glass" className="space-y-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-status-warning/10 text-status-warning">
                <CalendarBlank size={16} />
              </span>
              <div className="space-y-1.5">
                <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                  Timeline
                </p>
                <div className="flex justify-between text-caption">
                  <span className="text-foreground-muted">Created</span>
                  <span className="font-mono text-foreground-primary">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-caption">
                  <span className="text-foreground-muted">Updated</span>
                  <span className="font-mono text-foreground-primary">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="surface-panel space-y-2 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Desired outcome
              </span>
            </div>
            <p className="text-body leading-relaxed text-foreground-primary">
              {project.desiredOutcome || "No explicit outcome statement documented."}
            </p>
          </div>

          <div className="surface-panel space-y-2 rounded-2xl p-5">
            <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
              Scope & context
            </span>
            <p className="whitespace-pre-wrap text-body leading-relaxed text-foreground-secondary">
              {project.description || "No additional scope or notes provided."}
            </p>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-heading font-semibold text-foreground-primary">
              Tasks in this project
            </h2>
            <Badge variant="neutral">Task → subtask</Badge>
          </div>
          <TaskList projectId={project.id} />
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-heading font-semibold text-foreground-primary">
                Project performance
              </h2>
              <p className="text-small text-foreground-secondary">
                Derived from this project&apos;s tasks and recorded sessions.
              </p>
            </div>
            <Badge variant={report && report.varianceSeconds > 0 ? "error" : "success"}>
              {report && report.varianceSeconds > 0
                ? `${formatSecondsToHuman(report.varianceSeconds)} over estimate`
                : "Within estimate"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="surface" className="space-y-1">
              <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Tracked
              </span>
              <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                {formatSecondsToHuman(report?.totalDurationSeconds ?? 0)}
              </span>
              <span className="text-caption text-foreground-muted">
                {report?.sessionCount ?? 0} sessions
              </span>
            </Card>
            <Card variant="surface" className="space-y-1">
              <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Estimated
              </span>
              <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                {formatSecondsToHuman(report?.totalEstimatedSeconds ?? 0)}
              </span>
              <span className="text-caption text-foreground-muted">Across all tasks</span>
            </Card>
            <Card variant="surface" className="space-y-1">
              <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Completion
              </span>
              <span className="block font-mono text-title font-semibold tabular-nums text-foreground-primary">
                {report?.completedTaskCount ?? 0} / {report?.taskCount ?? 0}
              </span>
              <span className="text-caption text-foreground-muted">Tasks complete</span>
            </Card>
            <Card variant="surface" className="space-y-1">
              <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Variance
              </span>
              <span
                className={cn(
                  "block font-mono text-title font-semibold tabular-nums",
                  report && report.varianceSeconds > 0
                    ? "text-status-error"
                    : "text-status-success",
                )}
              >
                {report && report.varianceSeconds > 0 ? "+" : ""}
                {formatSecondsToHuman(Math.abs(report?.varianceSeconds ?? 0))}
              </span>
              <span className="text-caption text-foreground-muted">Actual vs estimate</span>
            </Card>
          </div>

          <Card variant="glass" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-small font-medium text-foreground-primary">
                Estimate utilization
              </span>
              <span className="font-mono text-caption tabular-nums text-foreground-muted">
                {report && report.totalEstimatedSeconds > 0
                  ? `${Math.round(
                      (report.totalDurationSeconds / report.totalEstimatedSeconds) * 100,
                    )}%`
                  : "No estimate"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  report && report.varianceSeconds > 0
                    ? "bg-status-error"
                    : "bg-status-success",
                )}
                style={{
                  width: `${
                    report && report.totalEstimatedSeconds > 0
                      ? Math.min(
                          100,
                          (report.totalDurationSeconds / report.totalEstimatedSeconds) * 100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </Card>
        </div>
      )}

      <EditProjectDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={refreshData}
        project={project}
      />
    </div>
  );
}
