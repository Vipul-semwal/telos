"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
          description: description.trim(),
          desiredOutcome: desiredOutcome.trim(),
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
      title="Edit project"
      description="Update project parameters and status lifecycle."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
            {error}
          </div>
        )}

        <Input
          label="Project name"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <Textarea
          label="Desired outcome"
          value={desiredOutcome}
          onChange={(event) => setDesiredOutcome(event.target.value)}
          rows={2}
          className="min-h-0 resize-none"
        />

        <Textarea
          label="Scope and notes"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="min-h-0 resize-none"
        />

        <Select
          label="Status lifecycle"
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus)}
        >
          <option value="active">Active — consumes 1 of 3 slots</option>
          <option value="paused">Paused — free slot, paused execution</option>
          <option value="completed">Completed — outcome achieved</option>
          <option value="archived">Archived — preserved history</option>
        </Select>

        <div className="flex items-center justify-end gap-2 border-t border-separator/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
