"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";
import { EditProjectDialog } from "@/modules/projects/components/edit-project-dialog";
import { formatSecondsToHuman, formatSecondsToClock } from "@/shared/utils/duration";
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
}

type TabType =
  | "overview"
  | "tasks"
  | "warehouse"
  | "resolution"
  | "reports"
  | "knowledge"
  | "decisions";

export function ProjectDetailView({
  project,
  disciplineActiveCount,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabType>("overview");
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

  const statusBadgeVariant: Record<ProjectStatus, "accent" | "neutral" | "success" | "warning"> = {
    active: "accent",
    paused: "warning",
    completed: "success",
    archived: "neutral",
  };

  const tabs: { id: TabType; label: string; code: string; isPlaceholder?: boolean }[] = [
    { id: "overview", label: "OVERVIEW", code: "01" },
    { id: "tasks", label: `TASKS (${project.taskCount})`, code: "02" },
    { id: "warehouse", label: "WAREHOUSE", code: "03", isPlaceholder: true },
    { id: "resolution", label: "RESOLUTION", code: "04", isPlaceholder: true },
    { id: "reports", label: "REPORTS", code: "05", isPlaceholder: true },
    { id: "knowledge", label: "KNOWLEDGE", code: "06", isPlaceholder: true },
    { id: "decisions", label: "DECISIONS", code: "07", isPlaceholder: true },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb path */}
      <div className="flex items-center gap-2 text-xs font-mono text-foreground-secondary border-b border-border pb-2.5">
        <Link href="/disciplines" className="hover:text-foreground-primary underline">
          DISCIPLINES
        </Link>
        <span>/</span>
        <span className="text-foreground-primary uppercase font-medium">
          {project.disciplineTitle}
        </span>
        <span>/</span>
        <Link href="/projects" className="hover:text-foreground-primary underline">
          PROJECTS
        </Link>
        <span>/</span>
        <span className="text-foreground-muted truncate max-w-[200px]">{project.title}</span>
      </div>

      {actionError && (
        <div className="p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="underline text-status-error ml-2">
            DISMISS
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        moduleCode={`DISCIPLINE // ${project.disciplineTitle}`}
        title={project.title}
        description={project.desiredOutcome ? `Outcome: ${project.desiredOutcome}` : undefined}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant[project.status]}>{project.status}</Badge>
            <span className="text-[11px] font-mono text-foreground-secondary">
              Discipline: {disciplineActiveCount}/3 active
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
              EDIT
            </Button>

            {project.status === "active" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusTransition("paused")}
                disabled={isActionLoading}
              >
                PAUSE
              </Button>
            )}

            {project.status === "paused" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusTransition("active")}
                disabled={isActionLoading}
              >
                RESUME
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
                COMPLETE
              </Button>
            )}

            {project.status !== "archived" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusTransition("archived")}
                disabled={isActionLoading}
              >
                ARCHIVE
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusTransition("active")}
                  disabled={isActionLoading}
                >
                  RESTORE AS ACTIVE
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusTransition("paused")}
                  disabled={isActionLoading}
                >
                  RESTORE AS PAUSED
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Tab Navigation (Dieter Rams technical tabs) */}
      <div className="border-b border-border flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-mono transition-colors shrink-0 flex items-center gap-1.5 border-b-2 -mb-px rounded-t-sm ${
              activeTab === tab.id
                ? "border-accent text-foreground-primary font-medium bg-background-secondary/30"
                : "border-transparent text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary/20"
            }`}
          >
            <span className="text-[10px] text-foreground-muted">{tab.code}</span>
            <span>{tab.label}</span>
            {tab.isPlaceholder && (
              <span className="text-[9px] uppercase tracking-widest text-foreground-muted bg-background-secondary px-1 py-0.2 rounded-none">
                FUTURE
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>TASK EXECUTION</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-semibold tabular-nums text-foreground-primary">
                    {project.completedTaskCount} / {project.taskCount}
                  </span>
                  <span className="font-mono text-xs text-foreground-secondary">
                    COMPLETED
                  </span>
                </div>
                <div className="w-full bg-background-secondary h-1.5 rounded-none overflow-hidden mt-2">
                  <div
                    className="bg-accent h-full transition-all"
                    style={{
                      width: `${
                        project.taskCount > 0
                          ? (project.completedTaskCount / project.taskCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>RECORDED DURATION</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <span className="font-mono text-2xl font-semibold tabular-nums text-foreground-primary">
                  {formatSecondsToHuman(project.totalDurationSeconds)}
                </span>
                <p className="text-[11px] font-mono text-foreground-secondary">
                  Summed dynamically from task sessions.
                </p>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>INITIATIVE TIMELINE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">CREATED:</span>
                  <span className="text-foreground-primary">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">UPDATED:</span>
                  <span className="text-foreground-primary">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desired Outcome Box */}
          <div className="border border-border p-4 bg-background-primary rounded-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent inline-block" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-foreground-secondary">
                DEFINED DESIRED OUTCOME
              </span>
            </div>
            <p className="text-sm text-foreground-primary leading-relaxed font-sans">
              {project.desiredOutcome || "No explicit outcome statement documented."}
            </p>
          </div>

          {/* Description & Scope */}
          <div className="border border-border p-4 bg-background-primary rounded-sm space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-foreground-secondary block">
              SCOPE & CONTEXT
            </span>
            <p className="text-xs text-foreground-secondary leading-relaxed font-sans whitespace-pre-wrap">
              {project.description || "No additional scope or notes provided."}
            </p>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-foreground-secondary">
              TASKS IN PROJECT ({project.tasks.length})
            </span>
            <Badge variant="neutral">HIERARCHY: PROJECT ? TASK ? SUBTASK</Badge>
          </div>

          {project.tasks.length === 0 ? (
            <EmptyState
              kicker="TASKS // EMPTY"
              title="NO TASKS ALLOCATED"
              description="This project has no tasks defined yet. Tasks and subtasks represent actionable work items with estimated duration."
            />
          ) : (
            <div className="border border-border rounded-sm divide-y divide-border overflow-hidden bg-background-primary">
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 flex items-center justify-between text-xs font-mono hover:bg-background-secondary/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {task.parentTaskId && (
                        <span className="text-[10px] text-foreground-muted">? SUBTASK</span>
                      )}
                      <span className="font-medium text-foreground-primary uppercase">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-foreground-secondary">
                      <span>ESTIMATE: {formatSecondsToClock(task.estimatedDurationSeconds)}</span>
                      <span>PRIORITY: {task.priority.toUpperCase()}</span>
                    </div>
                  </div>

                  <Badge variant={task.status === "completed" ? "success" : "neutral"}>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear architectural placeholders for future planned sections */}
      {activeTab === "warehouse" && (
        <EmptyState
          kicker="SECTION 03 // WAREHOUSE (ARCHITECTURAL PLACEHOLDER)"
          title="PROJECT WAREHOUSE & ARTIFACTS"
          description="Reserved for project deliverables, assets, generated output, and source materials. Ready for future module integration."
        />
      )}

      {activeTab === "resolution" && (
        <EmptyState
          kicker="SECTION 04 // RESOLUTION ENGINE (ARCHITECTURAL PLACEHOLDER)"
          title="RESOLUTION ENGINE"
          description="Reserved for blockers, friction points, empirical impediments, and solution strategies."
        />
      )}

      {activeTab === "reports" && (
        <EmptyState
          kicker="SECTION 05 // REPORTS (ARCHITECTURAL PLACEHOLDER)"
          title="PROJECT PERFORMANCE REPORT"
          description="Will display detailed velocity, ETA variance, session timelines, and duration aggregations derived from underlying task sessions."
        />
      )}

      {activeTab === "knowledge" && (
        <EmptyState
          kicker="SECTION 06 // KNOWLEDGE (ARCHITECTURAL PLACEHOLDER)"
          title="PROJECT KNOWLEDGE & NOTES"
          description="Reserved for contextual insights, documentation, and conceptual pursuit linkages."
        />
      )}

      {activeTab === "decisions" && (
        <EmptyState
          kicker="SECTION 07 // DECISIONS (ARCHITECTURAL PLACEHOLDER)"
          title="ARCHITECTURE & PROJECT DECISION LOG"
          description="Reserved for architectural and strategic decisions recorded throughout the lifecycle of this initiative."
        />
      )}

      {/* Edit Dialog */}
      <EditProjectDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={refreshData}
        project={project}
      />
    </div>
  );
}
