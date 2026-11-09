"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/state-views";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/shared/utils/cn";
import type {
  BrainDumpItem,
  BrainDumpKind,
  BrainDumpStatus,
} from "@/modules/brain-dump/domain/types";
import { BRAIN_DUMP_KINDS } from "@/modules/brain-dump/domain/types";

interface ProjectOption {
  id: string;
  title: string;
  disciplineTitle?: string;
}

interface DisciplineOption {
  id: string;
  title: string;
}

interface BrainDumpViewProps {
  initialItems: BrainDumpItem[];
  projects: ProjectOption[];
  disciplines: DisciplineOption[];
}

type TriageAction = "task" | "project" | "link-project" | "link-discipline" | "note";

const STATUS_VARIANT: Record<
  BrainDumpStatus,
  "neutral" | "accent" | "success" | "warning"
> = {
  inbox: "warning",
  converted: "success",
  archived: "neutral",
  dismissed: "neutral",
};

const KIND_LABEL: Record<BrainDumpKind, string> = {
  note: "Note",
  idea: "Idea",
  task: "Task",
  question: "Question",
  reference: "Reference",
  project_idea: "Project idea",
  research: "Research",
  problem: "Problem",
  info: "Info",
};

const STATUS_LABEL: Record<BrainDumpStatus, string> = {
  inbox: "Inbox",
  converted: "Converted",
  archived: "Archived",
  dismissed: "Dismissed",
};

const TRIAGE_LABEL: Record<TriageAction, string> = {
  task: "Task",
  project: "New project",
  "link-project": "Link project",
  "link-discipline": "Discipline",
  note: "Keep as note",
};

const selectClass =
  "h-9 rounded-lg bg-surface-raised/70 px-2.5 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent/40";

export function BrainDumpView({
  initialItems,
  projects,
  disciplines,
}: BrainDumpViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [content, setContent] = React.useState("");
  const [captureKind, setCaptureKind] = React.useState<BrainDumpKind | "">("");
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<BrainDumpStatus | "all">("all");
  const [kindFilter, setKindFilter] = React.useState<BrainDumpKind | "all">("all");
  const [search, setSearch] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [editKind, setEditKind] = React.useState<BrainDumpKind | "">("");
  const [isSaving, setIsSaving] = React.useState(false);

  const [triagingId, setTriagingId] = React.useState<string | null>(null);
  const [triageAction, setTriageAction] = React.useState<TriageAction>("task");
  const [targetId, setTargetId] = React.useState("");
  const [isWorking, setIsWorking] = React.useState(false);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/brain-dump");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    router.refresh();
  }, [router]);

  const handleCapture = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim()) return;

    setIsCapturing(true);
    setError(null);
    try {
      const res = await fetch("/api/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          ...(captureKind ? { kind: captureKind } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to capture item.");
      } else {
        setContent("");
        setCaptureKind("");
        await refresh();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsCapturing(false);
    }
  };

  const openEdit = (item: BrainDumpItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditKind((item.kind as BrainDumpKind | null) ?? "");
    setError(null);
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editContent.trim()) {
      setError("Content cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/brain-dump/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          kind: editKind === "" ? null : editKind,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update item.");
      } else {
        setEditingId(null);
        await refresh();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLifecycle = async (
    itemId: string,
    action: "archive" | "dismiss" | "restore",
  ) => {
    setIsWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/brain-dump/${itemId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${action} item.`);
      } else {
        if (triagingId === itemId) setTriagingId(null);
        await refresh();
      }
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsWorking(false);
    }
  };

  const openTriage = (item: BrainDumpItem) => {
    setTriagingId(item.id);
    setTriageAction("task");
    setTargetId(
      projects[0]?.id ?? "",
    );
    setError(null);
  };

  const selectTriageAction = (action: TriageAction) => {
    setTriageAction(action);
    if (action === "task" || action === "link-project") {
      setTargetId(projects[0]?.id ?? "");
    } else if (action === "project" || action === "link-discipline") {
      setTargetId(disciplines[0]?.id ?? "");
    } else {
      setTargetId("");
    }
  };

  const handleTriage = async (item: BrainDumpItem) => {
    setError(null);

    if (triageAction !== "note" && !targetId) {
      setError(
        triageAction === "task"
          ? "Select a valid parent Project before converting to a Task."
          : "Select a target before continuing.",
      );
      return;
    }

    setIsWorking(true);
    try {
      let url = "";
      let body: Record<string, unknown> = {};

      if (triageAction === "task") {
        url = `/api/brain-dump/${item.id}/convert-task`;
        body = { projectId: targetId };
      } else if (triageAction === "project") {
        url = `/api/brain-dump/${item.id}/convert-project`;
        body = { disciplineId: targetId };
      } else if (triageAction === "link-project") {
        url = `/api/brain-dump/${item.id}/associate`;
        body = { projectId: targetId };
      } else if (triageAction === "link-discipline") {
        url = `/api/brain-dump/${item.id}/associate`;
        body = { disciplineId: targetId };
      } else {
        url = `/api/brain-dump/${item.id}/associate`;
        body = { keepAsNote: true };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resolve item.");
        return;
      }

      setTriagingId(null);
      await refresh();
    } catch {
      setError("Failed to communicate with server.");
    } finally {
      setIsWorking(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
    const matchesKind = kindFilter === "all" ? true : item.kind === kindFilter;
    const matchesSearch =
      search.trim().length === 0
        ? true
        : item.content.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesKind && matchesSearch;
  });

  const unresolvedCount = items.filter((i) => i.status === "inbox").length;
  const convertedCount = items.filter((i) => i.status === "converted").length;

  const triageTargets =
    triageAction === "task" || triageAction === "link-project"
      ? projects.map((p) => ({
          id: p.id,
          label: p.disciplineTitle ? `${p.title} — ${p.disciplineTitle}` : p.title,
        }))
      : triageAction === "project" || triageAction === "link-discipline"
        ? disciplines.map((d) => ({ id: d.id, label: d.title }))
        : [];

  return (
    <div className="space-y-6">
      <form onSubmit={handleCapture} className="surface-panel space-y-3 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <Lightbulb size={18} />
          </span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                handleCapture();
              }
            }}
            placeholder="Capture anything — an idea, task, question, or reference. Press Ctrl/Cmd + Enter to save."
            rows={3}
            autoFocus
            className="min-h-20 w-full resize-none bg-transparent pt-1.5 text-body leading-relaxed text-foreground-primary outline-none placeholder:text-foreground-quaternary"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-caption tabular-nums text-foreground-muted">
              {content.length} / 5000
            </span>
            <select
              value={captureKind}
              onChange={(event) => setCaptureKind(event.target.value as BrainDumpKind | "")}
              aria-label="Optional kind"
              className="h-8 rounded-lg bg-surface-hover/60 px-2 text-caption text-foreground-secondary outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value="">Unclassified</option>
              {BRAIN_DUMP_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isCapturing || !content.trim()}
          >
            <Plus size={15} weight="bold" />
            {isCapturing ? "Capturing…" : "Capture"}
          </Button>
        </div>
      </form>

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

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          options={[
            { value: "all", label: "All", count: items.length },
            {
              value: "inbox",
              label: "Inbox",
              count: items.filter((item) => item.status === "inbox").length,
            },
            {
              value: "converted",
              label: "Converted",
              count: items.filter((item) => item.status === "converted").length,
            },
            {
              value: "archived",
              label: "Archived",
              count: items.filter((item) => item.status === "archived").length,
            },
            {
              value: "dismissed",
              label: "Dismissed",
              count: items.filter((item) => item.status === "dismissed").length,
            },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Filter by status"
        />

        <div className="flex items-center gap-2">
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as BrainDumpKind | "all")}
            aria-label="Filter by kind"
            className={selectClass}
          >
            <option value="all">All kinds</option>
            {BRAIN_DUMP_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
          <div className="w-48">
            <Input
              placeholder="Search inbox"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">{unresolvedCount} unresolved</Badge>
        <Badge variant="success">{convertedCount} processed</Badge>
        <span className="text-caption text-foreground-muted">
          {filteredItems.length} shown of {items.length}
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          kicker={items.length === 0 ? "Nothing captured yet" : "No matching items"}
          title={items.length === 0 ? "Start with a thought" : "Try different filters"}
          description={
            items.length === 0
              ? "Type anything into the capture bar above. It stays unclassified until you decide what it is."
              : "Adjust the status, kind, or search filters to see other captured items."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const isTriaging = triagingId === item.id;
            const isResolved = item.status === "converted";
            const isClosed = item.status === "archived" || item.status === "dismissed";

            return (
              <div key={item.id} className="surface-panel overflow-hidden rounded-2xl">
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-hover/60 text-foreground-secondary">
                    <Lightbulb size={16} />
                  </span>

                  <div className="min-w-0 flex-1 space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(event) => setEditContent(event.target.value)}
                          rows={3}
                          className="w-full resize-none rounded-xl bg-surface-raised/60 p-3 text-small text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={editKind}
                            onChange={(event) =>
                              setEditKind(event.target.value as BrainDumpKind | "")
                            }
                            aria-label="Kind"
                            className="h-8 rounded-lg bg-surface-raised/70 px-2 text-caption text-foreground-secondary outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <option value="">Unclassified</option>
                            {BRAIN_DUMP_KINDS.map((kind) => (
                              <option key={kind} value={kind}>
                                {KIND_LABEL[kind]}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-body leading-relaxed text-foreground-primary">
                        {item.content}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-caption text-foreground-muted">
                      <Badge variant={STATUS_VARIANT[item.status]}>
                        {STATUS_LABEL[item.status]}
                      </Badge>
                      {item.kind && <Badge variant="neutral">{KIND_LABEL[item.kind]}</Badge>}
                      <span>
                        {new Date(item.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.convertedToType && (
                        <span className="inline-flex items-center gap-1 text-status-success">
                          <ArrowRight size={12} />
                          {item.convertedToType.replace("_", " ")}
                        </span>
                      )}
                      {item.projectId && (
                        <Link
                          href={`/projects/${item.projectId}`}
                          className="font-medium text-accent transition-colors hover:text-accent-hover"
                        >
                          View project
                        </Link>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex max-w-[190px] shrink-0 flex-wrap items-center justify-end gap-0.5">
                      {!isResolved && !isClosed && (
                        <button
                          type="button"
                          onClick={() => openTriage(item)}
                          className="rounded-md px-2 py-1 text-caption font-medium text-accent transition-colors hover:bg-accent/10"
                        >
                          Triage
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-md px-2 py-1 text-caption font-medium text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground-primary"
                      >
                        Edit
                      </button>
                      {isClosed ? (
                        <button
                          type="button"
                          onClick={() => handleLifecycle(item.id, "restore")}
                          disabled={isWorking}
                          className="rounded-md px-2 py-1 text-caption font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleLifecycle(item.id, "archive")}
                            disabled={isWorking}
                            className="rounded-md px-2 py-1 text-caption font-medium text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground-primary disabled:opacity-40"
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLifecycle(item.id, "dismiss")}
                            disabled={isWorking}
                            className="rounded-md px-2 py-1 text-caption font-medium text-foreground-muted transition-colors hover:bg-status-error/10 hover:text-status-error disabled:opacity-40"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isTriaging && (
                  <div className="space-y-3 border-t border-separator/[0.07] bg-surface-hover/20 p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-caption font-medium text-foreground-secondary">
                        Resolve as
                      </span>
                      {(
                        [
                          "task",
                          "project",
                          "link-project",
                          "link-discipline",
                          "note",
                        ] as TriageAction[]
                      ).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => selectTriageAction(action)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-caption font-medium transition-all",
                            triageAction === action
                              ? "bg-surface-elevated text-foreground-primary shadow-control"
                              : "text-foreground-secondary hover:text-foreground-primary",
                          )}
                        >
                          {TRIAGE_LABEL[action]}
                        </button>
                      ))}
                    </div>

                    {triageAction === "note" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="flex-1 text-small text-foreground-secondary">
                          Keep this item as a classified note. It remains searchable and is not
                          deleted.
                        </p>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleTriage(item)}
                          disabled={isWorking}
                        >
                          {isWorking ? "Saving…" : "Keep as note"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTriagingId(null)}
                          disabled={isWorking}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : triageTargets.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={targetId}
                          onChange={(event) => setTargetId(event.target.value)}
                          aria-label="Target"
                          className={cn(selectClass, "min-w-[180px] flex-1")}
                        >
                          {triageTargets.map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleTriage(item)}
                          disabled={isWorking}
                        >
                          {isWorking ? "Working…" : "Confirm"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTriagingId(null)}
                          disabled={isWorking}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="text-small text-status-warning">
                        {triageAction === "task" || triageAction === "link-project"
                          ? "No projects available. Create a project under a discipline first."
                          : "No disciplines available. Create a discipline first."}
                      </p>
                    )}

                    {triageAction === "task" && (
                      <p className="text-caption text-foreground-muted">
                        A task must belong to a valid project. The original capture is preserved
                        and linked to the new task.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
