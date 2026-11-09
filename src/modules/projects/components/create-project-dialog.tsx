"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";

interface DisciplineOption {
  id: string;
  title: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  disciplines: DisciplineOption[];
  preselectedDisciplineId?: string;
}

export function CreateProjectDialog({
  open,
  onClose,
  onSuccess,
  disciplines,
  preselectedDisciplineId,
}: CreateProjectDialogProps) {
  const [disciplineId, setDisciplineId] = React.useState(
    preselectedDisciplineId || disciplines[0]?.id || "",
  );
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [desiredOutcome, setDesiredOutcome] = React.useState("");
  const [initialStatus, setInitialStatus] = React.useState<"active" | "paused">("active");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (preselectedDisciplineId) {
      setDisciplineId(preselectedDisciplineId);
    } else if (disciplines.length > 0 && !disciplineId) {
      setDisciplineId(disciplines[0].id);
    }
  }, [preselectedDisciplineId, disciplines, disciplineId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!disciplineId) {
      setError("Please select a parent discipline.");
      return;
    }

    if (!title.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId,
          title: title.trim(),
          description: description.trim() || undefined,
          desiredOutcome: desiredOutcome.trim() || undefined,
          initialStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create project");
      } else {
        setTitle("");
        setDescription("");
        setDesiredOutcome("");
        onSuccess();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred while saving the project.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New project"
      description="Define a measurable outcome under an active discipline."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
            {error}
          </div>
        )}

        <Select
          label="Parent discipline"
          value={disciplineId}
          onChange={(event) => setDisciplineId(event.target.value)}
          disabled={Boolean(preselectedDisciplineId)}
        >
          {disciplines.length === 0 ? (
            <option value="">No disciplines available</option>
          ) : (
            disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.title}
              </option>
            ))
          )}
        </Select>

        <Input
          label="Project name"
          required
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Master Linux system administration"
        />

        <Textarea
          label="Desired outcome"
          value={desiredOutcome}
          onChange={(event) => setDesiredOutcome(event.target.value)}
          placeholder="Define the specific, measurable end state for this project."
          rows={2}
          className="min-h-0 resize-none"
        />

        <Textarea
          label="Scope and notes (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Key milestones, context, or reference boundaries."
          rows={2}
          className="min-h-0 resize-none"
        />

        <div className="space-y-2">
          <span className="text-small font-medium text-foreground-secondary">
            Initial activation
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                {
                  value: "active",
                  title: "Active",
                  hint: "Consumes 1 of 3 slots",
                },
                {
                  value: "paused",
                  title: "Paused",
                  hint: "Does not consume quota",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-xl px-3.5 py-3 transition-all",
                  initialStatus === option.value
                    ? "bg-accent/[0.07] shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.45)]"
                    : "bg-surface-raised/50 shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.08)] hover:bg-surface-raised",
                )}
              >
                <input
                  type="radio"
                  name="initialStatus"
                  value={option.value}
                  checked={initialStatus === option.value}
                  onChange={() => setInitialStatus(option.value)}
                  className="sr-only"
                />
                <span className="block text-small font-medium text-foreground-primary">
                  {option.title}
                </span>
                <span className="text-caption text-foreground-muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-separator/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create project"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
