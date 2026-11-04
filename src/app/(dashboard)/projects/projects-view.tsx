"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";
import { CreateProjectDialog } from "@/modules/projects/components/create-project-dialog";
import type { Project, ProjectStatus } from "@/modules/projects/domain/types";

interface DisciplineOption {
  id: string;
  title: string;
  activeCount: number;
}

interface ProjectsViewProps {
  initialProjects: (Project & { disciplineTitle?: string })[];
  disciplines: DisciplineOption[];
}

export function ProjectsView({ initialProjects, disciplines }: ProjectsViewProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState(initialProjects);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [selectedDisciplineId, setSelectedDisciplineId] = React.useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const refreshData = () => {
    router.refresh();
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to update project status");
      } else {
        refreshData();
      }
    } catch {
      setActionError("Failed to communicate with server");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = filterStatus === "all" ? true : p.status === filterStatus;
    const matchesDiscipline =
      selectedDisciplineId === "all" ? true : p.disciplineId === selectedDisciplineId;
    return matchesStatus && matchesDiscipline;
  });

  const activeProjectsCount = projects.filter((p) => p.status === "active").length;

  const statusBadgeVariant: Record<ProjectStatus, "accent" | "neutral" | "success" | "warning"> = {
    active: "accent",
    paused: "warning",
    completed: "success",
    archived: "neutral",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 04 // INITIATIVES"
        title="PROJECTS"
        description="Defined initiatives with measurable outcomes. Strict invariant: maximum 3 active projects per discipline."
        badge={
          <Badge variant={activeProjectsCount > 0 ? "accent" : "neutral"}>
            {activeProjectsCount} ACTIVE INITIATIVES
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            disabled={disciplines.length === 0}
          >
            + NEW PROJECT
          </Button>
        }
      />

      {actionError && (
        <div className="p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-status-error underline ml-2">
            DISMISS
          </button>
        </div>
      )}

      {/* Filter and Telemetry Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-[10px] text-foreground-secondary uppercase tracking-wider mr-1">
            STATUS:
          </span>
          {["all", "active", "paused", "completed", "archived"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-sm transition-colors ${
                filterStatus === st
                  ? "bg-foreground-primary text-background-primary font-medium"
                  : "bg-background-secondary text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Discipline Scope Selector */}
        {disciplines.length > 1 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[10px] text-foreground-secondary uppercase tracking-wider shrink-0">
              DISCIPLINE:
            </span>
            <select
              value={selectedDisciplineId}
              onChange={(e) => setSelectedDisciplineId(e.target.value)}
              className="h-7 bg-background-primary border border-border px-2 text-[11px] font-mono text-foreground-primary rounded-sm focus-visible:outline-none"
            >
              <option value="all">All Disciplines</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.activeCount}/3 active)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Discipline Active Capacity Breakdown */}
      {disciplines.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {disciplines.map((d) => (
            <div
              key={d.id}
              className="border border-border p-3 bg-background-primary rounded-sm space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-foreground-primary font-medium truncate max-w-[160px]">
                  {d.title}
                </span>
                <span
                  className={`text-[11px] ${
                    d.activeCount >= 3 ? "text-status-warning font-semibold" : "text-foreground-secondary"
                  }`}
                >
                  {d.activeCount} / 3 ACTIVE
                </span>
              </div>
              <div className="w-full bg-background-secondary h-1 rounded-none overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    d.activeCount >= 3 ? "bg-status-warning" : "bg-accent"
                  }`}
                  style={{ width: `${(d.activeCount / 3) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          kicker="PROJECTS // EMPTY"
          title={filterStatus === "all" ? "NO PROJECTS DEFINED" : `NO ${filterStatus.toUpperCase()} PROJECTS`}
          description={
            disciplines.length === 0
              ? "You must define at least one active Discipline before creating Project initiatives."
              : "Create a Project with a defined outcome to begin organizing tasks under your pursuits."
          }
          actionLabel={disciplines.length > 0 ? "+ CREATE FIRST PROJECT" : undefined}
          onAction={disciplines.length > 0 ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredProjects.map((p) => (
            <Card key={p.id} variant="bordered" className="flex flex-col justify-between hover:border-foreground-primary/40 transition-colors">
              <div className="space-y-3">
                <CardHeader className="pb-2 mb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted truncate">
                      {p.disciplineTitle || "DISCIPLINE"}
                    </span>
                    <Badge variant={statusBadgeVariant[p.status]} className="shrink-0">
                      {p.status}
                    </Badge>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group-hover:text-accent font-mono text-sm font-semibold uppercase tracking-wider text-foreground-primary line-clamp-1 hover:underline pt-1"
                  >
                    {p.title}
                  </Link>
                </CardHeader>

                <CardContent className="space-y-2.5">
                  {p.desiredOutcome && (
                    <div className="bg-background-secondary/40 border-l border-accent p-2 text-xs">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-foreground-muted block mb-0.5">
                        OUTCOME:
                      </span>
                      <p className="text-foreground-primary font-sans text-xs line-clamp-2">
                        {p.desiredOutcome}
                      </p>
                    </div>
                  )}

                  {p.description && (
                    <p className="text-xs text-foreground-secondary line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-border pt-3 mt-3 flex items-center justify-between text-xs font-mono">
                <Link
                  href={`/projects/${p.id}`}
                  className="text-foreground-primary hover:text-accent font-mono text-[11px] underline uppercase"
                >
                  OPEN DETAILS ?
                </Link>

                <div className="flex items-center gap-1">
                  {p.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(p.id, "paused")}
                      title="Pause project"
                      className="px-1.5 py-0.5 text-[10px] uppercase font-mono text-foreground-secondary hover:text-foreground-primary border border-border rounded-sm hover:bg-background-secondary"
                    >
                      PAUSE
                    </button>
                  )}
                  {p.status === "paused" && (
                    <button
                      onClick={() => handleStatusChange(p.id, "active")}
                      title="Activate project"
                      className="px-1.5 py-0.5 text-[10px] uppercase font-mono text-accent hover:text-white border border-accent/40 rounded-sm hover:bg-accent"
                    >
                      ACTIVATE
                    </button>
                  )}
                  {p.status !== "completed" && p.status !== "archived" && (
                    <button
                      onClick={() => handleStatusChange(p.id, "completed")}
                      title="Mark project completed"
                      className="px-1.5 py-0.5 text-[10px] uppercase font-mono text-status-success hover:text-white border border-status-success/40 rounded-sm hover:bg-status-success"
                    >
                      COMPLETE
                    </button>
                  )}
                  {p.status !== "archived" && (
                    <button
                      onClick={() => handleStatusChange(p.id, "archived")}
                      title="Archive project"
                      className="px-1.5 py-0.5 text-[10px] uppercase font-mono text-foreground-muted hover:text-foreground-primary border border-border rounded-sm hover:bg-background-secondary"
                    >
                      ARCHIVE
                    </button>
                  )}
                  {p.status === "archived" && (
                    <button
                      onClick={() => handleStatusChange(p.id, "active")}
                      title="Restore project"
                      className="px-1.5 py-0.5 text-[10px] uppercase font-mono text-accent border border-accent/40 rounded-sm hover:bg-accent hover:text-white"
                    >
                      RESTORE
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshData}
        disciplines={disciplines}
      />
    </div>
  );
}
