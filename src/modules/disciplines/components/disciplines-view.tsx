"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Compass,
  PencilSimple,
  Plus,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/state-views";
import { useToast } from "@/components/ui/toast";
import { Muted } from "@/components/ui/typography";
import type { Discipline } from "@/modules/disciplines/domain/types";

interface DisciplinesViewProps {
  initialDisciplines: Discipline[];
  maxActive: number;
}

interface DisciplineDialogProps {
  open: boolean;
  discipline: Discipline | null;
  onClose: () => void;
  onSaved: (discipline: Discipline) => void;
}

function DisciplineDialog({ open, discipline, onClose, onSaved }: DisciplineDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(discipline?.title ?? "");
      setDescription(discipline?.description ?? "");
      setError(null);
    }
  }, [discipline, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        discipline ? `/api/disciplines/${discipline.id}` : "/api/disciplines",
        {
          method: discipline ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to save discipline.");
        return;
      }

      onSaved(data.discipline);
      onClose();
    } catch {
      setError("Unable to communicate with the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={discipline ? "Edit discipline" : "New discipline"}
      description={
        discipline
          ? "Update the long-horizon area of pursuit."
          : "Name the first area of sustained pursuit. You can add projects after it is created."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
            {error}
          </div>
        )}
        <Input
          label="Discipline name"
          required
          autoFocus
          maxLength={255}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Systems engineering"
        />
        <Textarea
          label="Description (optional)"
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What long-term capability or domain does this pursuit develop?"
          rows={3}
        />
        <div className="flex items-center justify-end gap-2 border-t border-separator/10 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isLoading || !title.trim()}>
            {isLoading ? "Saving…" : discipline ? "Save changes" : "Create discipline"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function DisciplinesView({ initialDisciplines, maxActive }: DisciplinesViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [disciplines, setDisciplines] = React.useState(initialDisciplines);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingDiscipline, setEditingDiscipline] = React.useState<Discipline | null>(null);
  const [workingId, setWorkingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDisciplines(initialDisciplines);
  }, [initialDisciplines]);

  const activeCount = disciplines.filter((discipline) => discipline.status === "active").length;
  const atCapacity = activeCount >= maxActive;

  const refresh = async () => {
    const response = await fetch("/api/disciplines");
    if (response.ok) {
      const data = await response.json();
      setDisciplines(data.disciplines);
    }
    router.refresh();
  };

  const openCreate = () => {
    setEditingDiscipline(null);
    setDialogOpen(true);
  };

  const changeStatus = async (discipline: Discipline, status: "active" | "archived") => {
    setWorkingId(discipline.id);
    setError(null);
    try {
      const response = await fetch(`/api/disciplines/${discipline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to update discipline.");
        return;
      }
      toast(status === "active" ? "Discipline restored." : "Discipline archived.");
      await refresh();
    } catch {
      setError("Unable to communicate with the server.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Pursuits"
        title="Disciplines"
        description={`Sustained areas of core pursuit. A maximum of ${maxActive} active disciplines is enforced by the domain layer.`}
        badge={
          <Badge variant={atCapacity ? "warning" : "neutral"}>
            {activeCount} / {maxActive} active
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            disabled={atCapacity}
            title={atCapacity ? "Archive an active discipline before creating another." : undefined}
          >
            <Plus size={16} weight="bold" />
            {atCapacity ? "Capacity reached" : "New discipline"}
          </Button>
        }
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-status-error/[0.08] px-4 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-caption font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {disciplines.length === 0 ? (
        <EmptyState
          kicker="No disciplines yet"
          title="Define your first pursuit"
          description="Disciplines are the long-horizon areas you intend to sustain. Create one now, then add a project and break it into actionable tasks."
          actionLabel="Create first discipline"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((discipline) => (
            <Card key={discipline.id} variant="glass" className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Compass size={20} />
                </span>
                <Badge variant={discipline.status === "active" ? "accent" : "neutral"}>
                  {discipline.status === "active" ? "Active" : "Archived"}
                </Badge>
              </div>
              <div className="flex-1 space-y-1.5">
                <h2 className="break-words text-heading font-semibold text-foreground-primary">
                  {discipline.title}
                </h2>
                <Muted className="line-clamp-3 text-small leading-relaxed">
                  {discipline.description || "No description provided."}
                </Muted>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-separator/10 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingDiscipline(discipline);
                    setDialogOpen(true);
                  }}
                  disabled={workingId === discipline.id}
                >
                  <PencilSimple size={15} />
                  Edit
                </Button>
                {discipline.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changeStatus(discipline, "archived")}
                    disabled={workingId === discipline.id}
                  >
                    <Archive size={15} />
                    Archive
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeStatus(discipline, "active")}
                    disabled={workingId === discipline.id || atCapacity}
                    title={atCapacity ? "Archive an active discipline first." : undefined}
                  >
                    <ArrowCounterClockwise size={15} />
                    Restore
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <DisciplineDialog
        open={dialogOpen}
        discipline={editingDiscipline}
        onClose={() => setDialogOpen(false)}
        onSaved={async (saved) => {
          toast(editingDiscipline ? "Discipline updated." : "Discipline created.");
          setDisciplines((current) => {
            const exists = current.some((item) => item.id === saved.id);
            return exists
              ? current.map((item) => (item.id === saved.id ? saved : item))
              : [...current, saved];
          });
          await refresh();
        }}
      />
    </div>
  );
}
