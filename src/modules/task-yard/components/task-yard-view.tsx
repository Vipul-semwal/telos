"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  CalendarPlus,
  CheckCircle,
  ClockCounterClockwise,
  NotePencil,
  Plus,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/state-views";
import { useToast } from "@/components/ui/toast";
import { RichTextEditor } from "./rich-text-editor";
import {
  ScheduleFields,
  defaultScheduleDraft,
  schedulePayload,
  type ScheduleDraft,
} from "../../notifications/components/schedule-fields";
import { cn } from "@/shared/utils/cn";

interface NoteRow {
  id: string;
  title: string | null;
  contentHtml: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface CardRow {
  id: string;
  cardType: "flashcard" | "reminder" | "custom";
  title: string;
  prompt: string | null;
  answer: string | null;
  content: string | null;
  status: "active" | "completed" | "archived";
  lastReviewedAt: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ReviewRow {
  id: string;
  cardId: string;
  occurrenceId: string | null;
  result: string;
  reviewedAt: string | Date;
}

interface ScheduleRow {
  id: string;
  sourceId: string;
  sourceType: string;
  timezone: string;
  recurrence: unknown;
  status: "active" | "paused" | "ended";
  nextRunAt: string | Date;
}

interface OccurrenceRow {
  id: string;
  sourceId: string;
  sourceType: string;
  scheduledFor: string | Date;
  snoozedUntil: string | Date | null;
  status: string;
}

export interface TaskYardWorkspace {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    projectId: string;
  };
  project: { id: string; title: string };
  yard: { id: string; tldr: string | null };
  notes: NoteRow[];
  cards: CardRow[];
  reviews: ReviewRow[];
  schedules: ScheduleRow[];
  occurrences: OccurrenceRow[];
}

const CARD_LABEL: Record<CardRow["cardType"], string> = {
  flashcard: "Flashcard",
  reminder: "Reminder",
  custom: "Custom",
};

export function TaskYardView({ initialWorkspace }: { initialWorkspace: TaskYardWorkspace }) {
  const router = useRouter();
  const { toast } = useToast();
  const [workspace, setWorkspace] = React.useState(initialWorkspace);
  const [tldr, setTldr] = React.useState(initialWorkspace.yard.tldr ?? "");
  const [savedTldr, setSavedTldr] = React.useState(initialWorkspace.yard.tldr ?? "");
  const [isSavingTldr, setIsSavingTldr] = React.useState(false);

  const [noteDialogOpen, setNoteDialogOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<NoteRow | null>(null);
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteHtml, setNoteHtml] = React.useState("");
  const [noteDirty, setNoteDirty] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);

  const [cardDialogOpen, setCardDialogOpen] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<CardRow | null>(null);
  const [cardType, setCardType] = React.useState<CardRow["cardType"]>("flashcard");
  const [cardTitle, setCardTitle] = React.useState("");
  const [cardPrompt, setCardPrompt] = React.useState("");
  const [cardAnswer, setCardAnswer] = React.useState("");
  const [cardContent, setCardContent] = React.useState("");
  const [savingCard, setSavingCard] = React.useState(false);

  const [studyingCard, setStudyingCard] = React.useState<CardRow | null>(null);
  const [answerRevealed, setAnswerRevealed] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);

  const [schedulingCard, setSchedulingCard] = React.useState<CardRow | null>(null);
  const [scheduleDraft, setScheduleDraft] = React.useState<ScheduleDraft>(defaultScheduleDraft);
  const [savingSchedule, setSavingSchedule] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const tldrDirty = tldr !== savedTldr;

  React.useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!tldrDirty && !noteDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [tldrDirty, noteDirty]);

  const refresh = React.useCallback(async () => {
    const response = await fetch(`/api/tasks/${workspace.task.id}/yard`);
    if (response.ok) {
      const data = await response.json();
      setWorkspace(data);
      setTldr(data.yard.tldr ?? "");
      setSavedTldr(data.yard.tldr ?? "");
    }
    router.refresh();
  }, [router, workspace.task.id]);

  const saveTldr = async () => {
    setIsSavingTldr(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${workspace.task.id}/yard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tldr }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save TL;DR");
      setSavedTldr(data.yard.tldr ?? "");
      toast("TL;DR saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save TL;DR");
    } finally {
      setIsSavingTldr(false);
    }
  };

  const openNote = (note?: NoteRow) => {
    setEditingNote(note ?? null);
    setNoteTitle(note?.title ?? "");
    setNoteHtml(note?.contentHtml ?? "");
    setNoteDirty(false);
    setError(null);
    setNoteDialogOpen(true);
  };

  const closeNote = () => {
    if (noteDirty && !window.confirm("Discard unsaved note changes?")) return;
    setNoteDialogOpen(false);
    setEditingNote(null);
  };

  const saveNote = async () => {
    if (!noteHtml.replace(/<[^>]*>/g, "").trim()) {
      setError("Note content is required.");
      return;
    }
    setSavingNote(true);
    setError(null);
    try {
      const url = editingNote
        ? `/api/tasks/${workspace.task.id}/yard/notes/${editingNote.id}`
        : `/api/tasks/${workspace.task.id}/yard/notes`;
      const response = await fetch(url, {
        method: editingNote ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle.trim() || undefined,
          contentHtml: noteHtml,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save note");
      setNoteDirty(false);
      setNoteDialogOpen(false);
      toast("Note saved.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (note: NoteRow) => {
    if (!window.confirm(`Delete note “${note.title || "Untitled note"}”?`)) return;
    const response = await fetch(
      `/api/tasks/${workspace.task.id}/yard/notes/${note.id}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      toast("Note deleted.");
      await refresh();
    }
  };

  const openCard = (card?: CardRow) => {
    setEditingCard(card ?? null);
    setCardType(card?.cardType ?? "flashcard");
    setCardTitle(card?.title ?? "");
    setCardPrompt(card?.prompt ?? "");
    setCardAnswer(card?.answer ?? "");
    setCardContent(card?.content ?? "");
    setError(null);
    setCardDialogOpen(true);
  };

  const saveCard = async () => {
    setSavingCard(true);
    setError(null);
    try {
      const url = editingCard
        ? `/api/tasks/${workspace.task.id}/yard/cards/${editingCard.id}`
        : `/api/tasks/${workspace.task.id}/yard/cards`;
      const response = await fetch(url, {
        method: editingCard ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingCard ? {} : { cardType }),
          title: cardTitle,
          prompt: cardPrompt || null,
          answer: cardAnswer || null,
          content: cardContent || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save card");
      setCardDialogOpen(false);
      toast(editingCard ? "Card updated." : "Card created.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save card");
    } finally {
      setSavingCard(false);
    }
  };

  const deleteCard = async (card: CardRow) => {
    if (!window.confirm(`Delete “${card.title}” and preserve its review history?`)) return;
    const response = await fetch(
      `/api/tasks/${workspace.task.id}/yard/cards/${card.id}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      toast("Recall card deleted.");
      await refresh();
    }
  };

  const reviewCard = async (card: CardRow, result: "remembered" | "forgotten") => {
    setReviewing(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tasks/${workspace.task.id}/yard/cards/${card.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record review");
      setStudyingCard(null);
      setAnswerRevealed(false);
      toast(result === "remembered" ? "Marked remembered." : "Marked forgotten.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record review");
    } finally {
      setReviewing(false);
    }
  };

  const openSchedule = (card: CardRow) => {
    setSchedulingCard(card);
    setScheduleDraft(defaultScheduleDraft());
    setError(null);
  };

  const saveSchedule = async () => {
    if (!schedulingCard) return;
    setSavingSchedule(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tasks/${workspace.task.id}/yard/cards/${schedulingCard.id}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schedulePayload(scheduleDraft)),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to schedule card");
      setSchedulingCard(null);
      toast("Card scheduled for Cockpit.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to schedule card");
    } finally {
      setSavingSchedule(false);
    }
  };

  const upcoming = workspace.occurrences
    .filter((occurrence) => occurrence.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.snoozedUntil ?? a.scheduledFor).getTime() -
        new Date(b.snoozedUntil ?? b.scheduledFor).getTime(),
    )
    .slice(0, 8);
  const completedReviews = workspace.reviews.slice(0, 10);
  const activeCards = workspace.cards.filter((card) => card.status === "active");
  const scheduledCardIds = new Set(
    workspace.schedules
      .filter((schedule) => schedule.status === "active")
      .map((schedule) => schedule.sourceId),
  );

  return (
    <div className="space-y-7">
      <Link
        href={`/projects/${workspace.project.id}?tab=tasks`}
        className="inline-flex items-center gap-1.5 text-small font-medium text-foreground-secondary transition-colors hover:text-foreground-primary"
      >
        <ArrowLeft size={14} />
        Back to {workspace.project.title}
      </Link>

      <PageHeader
        moduleCode={`${workspace.project.title} / Task Yard`}
        title={workspace.task.title}
        description="A focused workspace for understanding, reference, and recall."
        badge={
          <Badge variant={workspace.task.status === "completed" ? "success" : "accent"}>
            {workspace.task.status.replace("_", " ")}
          </Badge>
        }
      />

      {error && (
        <div className="rounded-xl bg-status-error/[0.08] px-4 py-3 text-small text-status-error">
          {error}
        </div>
      )}

      <Card variant="glass" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-heading font-semibold text-foreground-primary">TL;DR</h2>
            <p className="text-caption text-foreground-muted">
              The shortest useful explanation of this task. Written by you, never generated.
            </p>
          </div>
          {tldrDirty && <Badge variant="warning">Unsaved</Badge>}
        </div>
        <Textarea
          aria-label="Task Yard TL;DR"
          value={tldr}
          onChange={(event) => setTldr(event.target.value)}
          placeholder="What matters most about this task?"
          rows={4}
          maxLength={5000}
        />
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={saveTldr}
            disabled={!tldrDirty || isSavingTldr}
          >
            {isSavingTldr ? "Saving…" : "Save TL;DR"}
          </Button>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-heading font-semibold text-foreground-primary">Notes</h2>
            <p className="text-caption text-foreground-muted">
              Formatted working context and references.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => openNote()}>
            <NotePencil size={15} />
            New note
          </Button>
        </div>
        {workspace.notes.length === 0 ? (
          <EmptyState
            kicker="No notes yet"
            title="Add context when it becomes useful"
            description="Notes are optional. Use them for decisions, references, or working details specific to this task."
            actionLabel="Write a note"
            onAction={() => openNote()}
          />
        ) : (
          <div className="space-y-2.5">
            {workspace.notes.map((note) => (
              <div key={note.id} className="surface-panel rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-subheading font-semibold text-foreground-primary">
                      {note.title || "Untitled note"}
                    </h3>
                    <p className="font-mono text-caption text-foreground-muted">
                      Updated {new Date(note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openNote(note)}>
                      Edit
                    </Button>
                    <button
                      type="button"
                      aria-label={`Delete ${note.title || "note"}`}
                      onClick={() => deleteNote(note)}
                      className="grid h-9 w-9 place-items-center rounded text-foreground-muted hover:bg-status-error/10 hover:text-status-error"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
                <div
                  className="mt-3 text-body leading-relaxed text-foreground-secondary [&_a]:text-accent [&_a]:underline [&_h2]:mt-3 [&_h2]:text-heading [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-surface-inset [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-heading font-semibold text-foreground-primary">Recall cards</h2>
            <p className="text-caption text-foreground-muted">
              Study here at any time. Scheduled cards also appear in Cockpit.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => openCard()}>
            <Plus size={15} weight="bold" />
            New card
          </Button>
        </div>
        {workspace.cards.length === 0 ? (
          <EmptyState
            kicker="No recall cards"
            title="Add a card when repetition matters"
            description="Flashcards, reminders, and custom recall cards stay attached to this task."
            actionLabel="Create a card"
            onAction={() => openCard()}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {workspace.cards.map((card) => (
              <Card key={card.id} variant="surface" className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={
                      card.cardType === "flashcard"
                        ? "accent"
                        : card.cardType === "reminder"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {CARD_LABEL[card.cardType]}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {scheduledCardIds.has(card.id) && (
                      <Badge variant="success">Scheduled</Badge>
                    )}
                    <Badge variant={card.status === "active" ? "neutral" : "success"}>
                      {card.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-subheading font-semibold text-foreground-primary">
                    {card.title}
                  </h3>
                  <p className="line-clamp-3 whitespace-pre-wrap text-small text-foreground-secondary">
                    {card.prompt || card.content || "No content"}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-separator/10 pt-3">
                  {card.cardType === "flashcard" && card.status === "active" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setStudyingCard(card);
                        setAnswerRevealed(false);
                      }}
                    >
                      Study
                    </Button>
                  )}
                  {card.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => openSchedule(card)}>
                      <CalendarPlus size={14} />
                      Schedule
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openCard(card)}>
                    Edit
                  </Button>
                  <button
                    type="button"
                    aria-label={`Delete ${card.title}`}
                    onClick={() => deleteCard(card)}
                    className="ml-auto grid h-9 w-9 place-items-center rounded text-foreground-muted hover:bg-status-error/10 hover:text-status-error"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card variant="surface" className="space-y-3">
          <div className="flex items-center gap-2">
            <ClockCounterClockwise size={17} className="text-accent" />
            <h2 className="text-subheading font-semibold text-foreground-primary">
              Upcoming recall
            </h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-small text-foreground-muted">No scheduled appearances.</p>
          ) : (
            upcoming.map((occurrence) => {
              const card = workspace.cards.find((item) => item.id === occurrence.sourceId);
              return (
                <div
                  key={occurrence.id}
                  className="flex items-center justify-between gap-3 border-t border-separator/[0.07] pt-2.5"
                >
                  <span className="truncate text-small text-foreground-primary">
                    {card?.title ?? "Recall card"}
                  </span>
                  <span className="shrink-0 font-mono text-caption text-foreground-muted">
                    {new Date(occurrence.snoozedUntil ?? occurrence.scheduledFor).toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </Card>

        <Card variant="surface" className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={17} className="text-status-success" />
            <h2 className="text-subheading font-semibold text-foreground-primary">
              Review history
            </h2>
          </div>
          {completedReviews.length === 0 ? (
            <p className="text-small text-foreground-muted">No reviews recorded.</p>
          ) : (
            completedReviews.map((review) => {
              const card = workspace.cards.find((item) => item.id === review.cardId);
              return (
                <div
                  key={review.id}
                  className="flex items-center justify-between gap-3 border-t border-separator/[0.07] pt-2.5"
                >
                  <Badge
                    variant={review.result === "forgotten" ? "warning" : "success"}
                  >
                    {review.result}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-small text-foreground-primary">
                    {card?.title ?? "Recall card"}
                  </span>
                  <span className="shrink-0 font-mono text-caption text-foreground-muted">
                    {new Date(review.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })
          )}
        </Card>
      </section>

      <Dialog
        open={noteDialogOpen}
        onClose={closeNote}
        title={editingNote ? "Edit note" : "New note"}
        description="Formatting is preserved. Save explicitly to keep your changes."
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Title (optional)"
            value={noteTitle}
            onChange={(event) => {
              setNoteTitle(event.target.value);
              setNoteDirty(true);
            }}
            placeholder="Reference, decision, or context"
          />
          <RichTextEditor
            value={noteHtml}
            onChange={(html) => {
              setNoteHtml(html);
              setNoteDirty(true);
            }}
          />
          <div className="flex items-center justify-between gap-3 border-t border-separator/10 pt-4">
            <span className="text-caption text-foreground-muted">
              {noteDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={closeNote}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={saveNote} disabled={savingNote}>
                {savingNote ? "Saving…" : "Save note"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={cardDialogOpen}
        onClose={() => setCardDialogOpen(false)}
        title={editingCard ? "Edit recall card" : "New recall card"}
        description="Cards remain attached to this task and can be reviewed independently of schedules."
      >
        <div className="space-y-4">
          {!editingCard && (
            <Select
              label="Card type"
              value={cardType}
              onChange={(event) => setCardType(event.target.value as CardRow["cardType"])}
            >
              <option value="flashcard">Flashcard</option>
              <option value="reminder">Reminder</option>
              <option value="custom">Custom</option>
            </Select>
          )}
          <Input
            label="Title"
            value={cardTitle}
            onChange={(event) => setCardTitle(event.target.value)}
            placeholder="Short, recognizable name"
          />
          {cardType === "flashcard" ? (
            <>
              <Textarea
                label="Front / question"
                value={cardPrompt}
                onChange={(event) => setCardPrompt(event.target.value)}
                rows={3}
              />
              <Textarea
                label="Back / answer"
                value={cardAnswer}
                onChange={(event) => setCardAnswer(event.target.value)}
                rows={3}
              />
            </>
          ) : (
            <Textarea
              label={cardType === "reminder" ? "Reminder message" : "Card content"}
              value={cardContent}
              onChange={(event) => setCardContent(event.target.value)}
              rows={4}
            />
          )}
          <div className="flex justify-end gap-2 border-t border-separator/10 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveCard}
              disabled={savingCard || !cardTitle.trim()}
            >
              {savingCard ? "Saving…" : "Save card"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(studyingCard)}
        onClose={() => {
          setStudyingCard(null);
          setAnswerRevealed(false);
        }}
        title={studyingCard?.title ?? "Study card"}
        description="Review the prompt, reveal the answer, then record what you remembered."
      >
        {studyingCard && (
          <div className="space-y-5">
            <div className="surface-inset rounded-2xl p-5 text-body leading-relaxed text-foreground-primary">
              {studyingCard.prompt}
            </div>
            {answerRevealed ? (
              <div className="rounded-2xl bg-status-success/[0.08] p-5 text-body leading-relaxed text-foreground-primary">
                {studyingCard.answer}
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setAnswerRevealed(true)}
              >
                Reveal answer
              </Button>
            )}
            {answerRevealed && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => reviewCard(studyingCard, "forgotten")}
                  disabled={reviewing}
                >
                  Forgotten
                </Button>
                <Button
                  variant="primary"
                  onClick={() => reviewCard(studyingCard, "remembered")}
                  disabled={reviewing}
                >
                  Remembered
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(schedulingCard)}
        onClose={() => setSchedulingCard(null)}
        title={`Schedule ${schedulingCard?.title ?? "card"}`}
        description="Scheduled occurrences appear in Cockpit while the card remains in Task Yard."
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <ScheduleFields value={scheduleDraft} onChange={setScheduleDraft} />
          <div className="flex justify-end gap-2 border-t border-separator/10 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setSchedulingCard(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveSchedule}
              disabled={savingSchedule}
            >
              {savingSchedule ? "Scheduling…" : "Schedule for Cockpit"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
