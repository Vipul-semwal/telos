"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project, ProjectStatus } from "../domain/types";

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project;
}

export function EditProjectDialog({
  open,
  onClose,
  onSuccess,
  project,
}: EditProjectDialogProps) {
  const [title, setTitle] = React.useState(project.title);
  const [description, setDescription] = React.useState(project.description || "");
  const [desiredOutcome, setDesiredOutcome] = React.useState(project.desiredOutcome || "");
  const [status, setStatus] = React.useState<ProjectStatus>(project.status);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setTitle(project.title);
    setDescription(project.description || "");
    setDesiredOutcome(project.desiredOutcome || "");
    setStatus(project.status);
    setError(null);
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          desiredOutcome: desiredOutcome.trim() || undefined,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update project");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred while updating the project.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="EDIT PROJECT INITIATIVE"
      description="Update project parameters and status lifecycle."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-sm">
            {error}
          </div>
        )}

        <Input
          label="Project Name"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Desired Outcome
          </label>
          <textarea
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            rows={2}
            className="w-full bg-background-primary border border-border p-2.5 text-xs text-foreground-primary rounded-sm font-sans focus-visible:outline-none focus-visible:border-foreground-primary resize-none placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Scope & Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-background-primary border border-border p-2.5 text-xs text-foreground-primary rounded-sm font-sans focus-visible:outline-none focus-visible:border-foreground-primary resize-none placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Status Lifecycle
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="h-9 w-full bg-background-primary border border-border px-3 text-xs text-foreground-primary rounded-sm font-mono focus-visible:outline-none focus-visible:border-foreground-primary"
          >
            <option value="active">Active (Consumes 1 of 3 slots)</option>
            <option value="paused">Paused (Free slot, paused execution)</option>
            <option value="completed">Completed (Outcome achieved, preserved)</option>
            <option value="archived">Archived (Inactive, preserved history)</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? "SAVING..." : "UPDATE PROJECT"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
