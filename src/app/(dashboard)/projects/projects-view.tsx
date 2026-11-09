"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  Check,
  FolderSimple,
  Pause,
  Play,
  Plus,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-views";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
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

const statusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export function ProjectsView({ initialProjects, disciplines }: ProjectsViewProps) {
  const router = useRouter();
  const { toast } = useToast();
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
        toast(`Project marked ${statusLabels[newStatus].toLowerCase()}.`);
        refreshData();
      }
    } catch {
      setActionError("Failed to communicate with server");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = filterStatus === "all" ? true : project.status === filterStatus;
    const matchesDiscipline =
      selectedDisciplineId === "all" ? true : project.disciplineId === selectedDisciplineId;
    return matchesStatus && matchesDiscipline;
  });

  const activeProjectsCount = projects.filter((project) => project.status === "active").length;

  const statusBadgeVariant: Record<ProjectStatus, "accent" | "neutral" | "success" | "warning"> = {
    active: "accent",
    paused: "warning",
    completed: "success",
    archived: "neutral",
  };

  const statusOptions = [
    { value: "all", label: "All", count: projects.length },
    {
      value: "active",
      label: "Active",
      count: projects.filter((project) => project.status === "active").length,
    },
    {
      value: "paused",
      label: "Paused",
      count: projects.filter((project) => project.status === "paused").length,
    },
    {
      value: "completed",
      label: "Completed",
      count: projects.filter((project) => project.status === "completed").length,
    },
    {
      value: "archived",
      label: "Archived",
      count: projects.filter((project) => project.status === "archived").length,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Initiatives"
        title="Projects"
        description="Defined initiatives with measurable outcomes. A maximum of three active projects is permitted per discipline."
        badge={
          <Badge variant={activeProjectsCount > 0 ? "accent" : "neutral"}>
            {activeProjectsCount} active
          </Badge>
        }
        actions={
          <Button
            variant={disciplines.length === 0 ? "primary" : "secondary"}
            size="sm"
            onClick={() =>
              disciplines.length === 0 ? router.push("/disciplines") : setIsCreateOpen(true)
            }
          >
            <Plus size={16} weight="bold" />
            {disciplines.length === 0 ? "Create discipline" : "New project"}
          </Button>
        }
      />

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

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          options={statusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          ariaLabel="Filter projects by status"
        />

        {disciplines.length > 1 && (
          <select
            value={selectedDisciplineId}
            onChange={(event) => setSelectedDisciplineId(event.target.value)}
            aria-label="Filter projects by discipline"
            className="h-9 rounded-lg bg-surface-raised/70 px-3 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <option value="all">All disciplines</option>
            {disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.title} ({discipline.activeCount}/3 active)
              </option>
            ))}
          </select>
        )}
      </div>

      {disciplines.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {disciplines.map((discipline) => (
            <div key={discipline.id} className="surface-panel space-y-2 rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-small font-medium text-foreground-primary">
                  {discipline.title}
                </span>
                <span
                  className={`shrink-0 font-mono text-caption tabular-nums ${
                    discipline.activeCount >= 3
                      ? "font-semibold text-status-warning"
                      : "text-foreground-muted"
                  }`}
                >
                  {discipline.activeCount} / 3
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-hover">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    discipline.activeCount >= 3 ? "bg-status-warning" : "bg-accent"
                  }`}
                  style={{ width: `${(discipline.activeCount / 3) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <EmptyState
          kicker={filterStatus === "all" ? "No projects yet" : `No ${filterStatus} projects`}
          title={filterStatus === "all" ? "Start an initiative" : "Nothing in this view"}
          description={
            disciplines.length === 0
              ? "Define at least one active discipline before creating project initiatives."
              : "Create a project with a defined outcome to begin organizing tasks under your pursuits."
          }
          actionLabel={disciplines.length > 0 ? "Create first project" : "Create a discipline"}
          onAction={
            disciplines.length > 0
              ? () => setIsCreateOpen(true)
              : () => router.push("/disciplines")
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              variant="glass"
              className="flex flex-col justify-between gap-5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <FolderSimple size={20} />
                  </span>
                  <Badge variant={statusBadgeVariant[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <p className="truncate font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                    {project.disciplineTitle || "Discipline"}
                  </p>
                  <Link
                    href={`/projects/${project.id}`}
                    className="block text-heading font-semibold text-foreground-primary transition-colors hover:text-accent"
                  >
                    {project.title}
                  </Link>
                </div>

                {project.desiredOutcome && (
                  <div className="rounded-xl bg-accent/[0.06] px-3 py-2.5">
                    <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                      Outcome
                    </p>
                    <p className="mt-1 line-clamp-2 text-small text-foreground-primary">
                      {project.desiredOutcome}
                    </p>
                  </div>
                )}

                {project.description && (
                  <p className="line-clamp-2 text-small text-foreground-secondary">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-small font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  Open
                  <ArrowRight size={14} />
                </Link>

                <div className="flex items-center gap-0.5">
                  {project.status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(project.id, "paused")}
                      title="Pause project"
                      aria-label="Pause project"
                      className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary"
                    >
                      <Pause size={14} />
                    </button>
                  )}
                  {project.status === "paused" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(project.id, "active")}
                      title="Activate project"
                      aria-label="Activate project"
                      className="grid h-7 w-7 place-items-center rounded-md text-accent transition-colors hover:bg-accent/10"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  {project.status !== "completed" && project.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(project.id, "completed")}
                      title="Mark project completed"
                      aria-label="Mark project completed"
                      className="grid h-7 w-7 place-items-center rounded-md text-status-success transition-colors hover:bg-status-success/10"
                    >
                      <Check size={14} weight="bold" />
                    </button>
                  )}
                  {project.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(project.id, "archived")}
                      title="Archive project"
                      aria-label="Archive project"
                      className="grid h-7 w-7 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                  {project.status === "archived" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(project.id, "active")}
                      title="Restore project"
                      aria-label="Restore project"
                      className="grid h-7 w-7 place-items-center rounded-md text-accent transition-colors hover:bg-accent/10"
                    >
                      <Play size={14} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshData}
        disciplines={disciplines}
      />
    </div>
  );
}
