"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Task } from "@/modules/tasks/domain/types";

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task;
}

export function EditTaskDialog({ open, onClose, onSuccess, task }: EditTaskDialogProps) {
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(
    task.estimatedDurationSeconds > 0
      ? String(Math.round(task.estimatedDurationSeconds / 60))
      : "",
  );
  const [priority, setPriority] = React.useState(task.priority);
  const [dueDate, setDueDate] = React.useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  );
  const [notes, setNotes] = React.useState(task.notes ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setEstimatedMinutes(
      task.estimatedDurationSeconds > 0
        ? String(Math.round(task.estimatedDurationSeconds / 60))
        : "",
    );
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setNotes(task.notes ?? "");
    setError(null);
  }, [task]);

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
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setError(data.error || "Failed to update task.");
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

  const isSubtask = Boolean(task.parentTaskId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isSubtask ? "Edit subtask" : "Edit task"}
      description="Update task details. Status transitions are available from the task list."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
            {error}
          </div>
        )}

        <Input
          label="Title"
          required
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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
            placeholder="0"
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
          <>
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
              rows={2}
              className="min-h-0 resize-none"
            />
          </>
        )}

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
