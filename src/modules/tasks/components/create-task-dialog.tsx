"use client";

import * as React from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  parentTaskId?: string | null;
  parentTaskTitle?: string;
}

export function CreateTaskDialog({
  open,
  onClose,
  onSuccess,
  projectId,
  parentTaskId,
  parentTaskTitle,
}: CreateTaskDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const isSubtask = Boolean(parentTaskId);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setEstimatedMinutes("");
      setPriority("medium");
      setDueDate("");
      setNotes("");
      setShowAdvanced(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const estimatedSecs =
      estimatedMinutes && Number(estimatedMinutes) > 0
        ? Math.round(Number(estimatedMinutes) * 60)
        : 0;

    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          parentTaskId: parentTaskId ?? null,
          title: title.trim(),
          description: description.trim() || null,
          estimatedDurationSeconds: estimatedSecs,
          priority,
          dueDate: dueDate || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create task.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isSubtask ? "New subtask" : "New task"}
      description={
        isSubtask
          ? "A focused action under the parent task. No further nesting is permitted."
          : "A discrete work item. Add subtasks from the task list."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
            {error}
          </div>
        )}

        {isSubtask && (
          <div className="rounded-xl bg-surface-hover/50 px-3 py-2 text-small text-foreground-secondary">
            Subtask of{" "}
            <span className="font-medium text-foreground-primary">{parentTaskTitle}</span>
          </div>
        )}

        <Input
          label="Title"
          required
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={isSubtask ? "e.g. Write test cases" : "e.g. Set up CI pipeline"}
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Context, acceptance criteria, or references."
          rows={2}
          className="min-h-0 resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Estimate (minutes)"
            type="number"
            min="0"
            step="1"
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(event.target.value)}
            placeholder="e.g. 90"
          />

          {!isSubtask && (
            <Select
              label="Priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as "low" | "medium" | "high")
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          )}
        </div>

        {!isSubtask && (
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              className="inline-flex items-center gap-1.5 text-small font-medium text-foreground-secondary transition-colors hover:text-foreground-primary"
            >
              {showAdvanced ? <CaretDown size={14} /> : <CaretRight size={14} />}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 border-l border-separator/10 pl-4">
                <Input
                  label="Due date (optional)"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />

                <Textarea
                  label="Notes (optional)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Working notes, blockers, or references."
                  rows={2}
                  className="min-h-0 resize-none"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-separator/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? "Saving…" : isSubtask ? "Add subtask" : "Add task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
