"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      title="NEW PROJECT INITIATIVE"
      description="Define a measurable project outcome under an active discipline."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Parent Discipline
          </label>
          <select
            value={disciplineId}
            onChange={(e) => setDisciplineId(e.target.value)}
            disabled={Boolean(preselectedDisciplineId)}
            className="h-9 w-full bg-background-primary border border-border px-3 text-xs text-foreground-primary rounded-sm font-mono focus-visible:outline-none focus-visible:border-foreground-primary disabled:opacity-50"
          >
            {disciplines.length === 0 ? (
              <option value="">No disciplines available</option>
            ) : (
              disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))
            )}
          </select>
        </div>

        <Input
          label="Project Name"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Master Linux System Administration"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Desired Outcome
          </label>
          <textarea
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            placeholder="Define the specific measurable end state for this project..."
            rows={2}
            className="w-full bg-background-primary border border-border p-2.5 text-xs text-foreground-primary rounded-sm font-sans focus-visible:outline-none focus-visible:border-foreground-primary resize-none placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Scope & Notes (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key milestones, context, or reference boundaries..."
            rows={2}
            className="w-full bg-background-primary border border-border p-2.5 text-xs text-foreground-primary rounded-sm font-sans focus-visible:outline-none focus-visible:border-foreground-primary resize-none placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            Initial Activation Status
          </label>
          <div className="flex items-center gap-4 text-xs font-mono">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="initialStatus"
                value="active"
                checked={initialStatus === "active"}
                onChange={() => setInitialStatus("active")}
                className="accent-accent"
              />
              Active (Consumes 1 of 3 slots)
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="initialStatus"
                value="paused"
                checked={initialStatus === "paused"}
                onChange={() => setInitialStatus("paused")}
                className="accent-accent"
              />
              Paused (Does not consume quota)
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            CANCEL
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? "SAVING..." : "CREATE PROJECT"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
