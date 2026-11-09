"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FolderSimple } from "@phosphor-icons/react";
import { TaskList } from "@/modules/tasks/components/task-list";
import { cn } from "@/shared/utils/cn";
import type { Project } from "@/modules/projects/domain/types";

interface TasksHubViewProps {
  projects: Project[];
}

export function TasksHubView({ projects }: TasksHubViewProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(
    projects[0]?.id ?? "",
  );

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  if (projects.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass-thin flex flex-wrap items-center gap-0.5 rounded-xl p-1">
          {projects.map((project) => {
            const active = selectedProjectId === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-small font-medium transition-all duration-150",
                  active
                    ? "bg-surface-elevated text-foreground-primary shadow-control"
                    : "text-foreground-secondary hover:text-foreground-primary",
                )}
              >
                <FolderSimple size={14} className={active ? "text-accent" : "text-foreground-muted"} />
                {project.title}
              </button>
            );
          })}
        </div>

        {selectedProject && (
          <Link
            href={`/projects/${selectedProject.id}`}
            className="ml-auto inline-flex items-center gap-1 text-small font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Open project
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>

      {selectedProjectId && <TaskList projectId={selectedProjectId} />}
    </div>
  );
}
