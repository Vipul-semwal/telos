"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Brain,
  CheckCircle,
  Eye,
  Notebook,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export interface CockpitDueNotification {
  occurrenceId: string;
  sourceType: string;
  sourceId: string;
  cardType?: string;
  title: string;
  message: string | null;
  prompt?: string | null;
  answer?: string | null;
  taskId?: string;
  sourceHref: string | null;
  taskYardHref: string | null;
  dueAt: string;
  readAt: string | null;
}

export function CockpitNotificationQueue({
  initialItems,
}: {
  initialItems: CockpitDueNotification[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState(initialItems);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [working, setWorking] = React.useState(false);

  React.useEffect(() => setItems(initialItems), [initialItems]);
  const current = items[index] ?? null;

  const removeCurrent = () => {
    if (!current) return;
    const occurrenceId = current.occurrenceId;
    setItems((currentItems) =>
      currentItems.filter((item) => item.occurrenceId !== occurrenceId),
    );
    setIndex(0);
    setRevealed(false);
    router.refresh();
  };

  const markRead = async () => {
    if (!current) return;
    setWorking(true);
    const response = await fetch(`/api/notification-occurrences/${current.occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
    if (response.ok) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.occurrenceId === current.occurrenceId
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      toast("Marked read. The source remains unresolved.");
    }
    setWorking(false);
  };

  const snooze = async (minutes: number) => {
    if (!current) return;
    setWorking(true);
    const response = await fetch(`/api/notification-occurrences/${current.occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "snooze", minutes }),
    });
    if (response.ok) {
      toast(`Snoozed for ${minutes} minutes.`);
      removeCurrent();
    }
    setWorking(false);
  };

  const resolveStandalone = async (action: "complete" | "dismiss") => {
    if (!current) return;
    setWorking(true);
    const response = await fetch(`/api/notification-occurrences/${current.occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) {
      toast(action === "complete" ? "Notification completed." : "Notification dismissed.");
      removeCurrent();
      router.refresh();
    }
    setWorking(false);
  };

  const reviewRecall = async (result: "remembered" | "forgotten" | "completed") => {
    if (!current?.taskId) return;
    setWorking(true);
    const response = await fetch(
      `/api/tasks/${current.taskId}/yard/cards/${current.sourceId}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, occurrenceId: current.occurrenceId }),
      },
    );
    if (response.ok) {
      toast(result === "forgotten" ? "Card marked forgotten." : "Recall resolved.");
      removeCurrent();
      router.refresh();
    }
    setWorking(false);
  };

  if (!current) {
    return (
      <Card variant="surface" className="flex items-center gap-3 p-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-hover text-foreground-muted">
          <Bell size={17} />
        </span>
        <div>
          <p className="text-small font-medium text-foreground-primary">No due notifications</p>
          <p className="text-caption text-foreground-muted">
            Notify and scheduled recall cards will appear here when due.
          </p>
        </div>
      </Card>
    );
  }

  const isRecallCard = current.sourceType.startsWith("task_yard_");
  const isFlashcard = current.sourceType === "task_yard_flashcard";

  return (
    <Card variant="glass" className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isRecallCard ? (
              <Brain size={18} className="text-accent" />
            ) : (
              <Bell size={18} className="text-accent" />
            )}
            <span className="font-mono text-micro uppercase tracking-[0.14em] text-foreground-muted">
              Due now · {index + 1} of {items.length}
            </span>
          </div>
          <h2 className="text-title font-semibold tracking-tight text-foreground-primary">
            {current.title}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {current.readAt && <Badge variant="neutral">Read</Badge>}
          <Badge variant={isRecallCard ? "accent" : "warning"}>
            {isRecallCard ? (current.cardType ?? "Recall") : "Notify"}
          </Badge>
        </div>
      </div>

      {isFlashcard ? (
        <div className="space-y-3">
          <div className="surface-inset rounded-xl p-4 text-body leading-relaxed text-foreground-primary">
            {current.prompt}
          </div>
          {revealed ? (
            <div className="rounded-xl bg-status-success/[0.08] p-4 text-body leading-relaxed text-foreground-primary">
              {current.answer}
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setRevealed(true)}>
              <Eye size={15} />
              Reveal answer
            </Button>
          )}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-body leading-relaxed text-foreground-secondary">
          {current.message || "This notification is due."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-separator/10 pt-4">
        {current.sourceHref && (
          <Link
            href={current.sourceHref}
            className="inline-flex h-9 items-center gap-1.5 rounded px-3 text-caption font-medium text-accent hover:bg-accent/10"
          >
            <Notebook size={14} />
            Open source
          </Link>
        )}
        {current.taskYardHref && (
          <Link
            href={current.taskYardHref}
            className="inline-flex h-9 items-center gap-1.5 rounded px-3 text-caption font-medium text-foreground-secondary hover:bg-surface-hover"
          >
            <ArrowRight size={14} />
            Open Task Yard
          </Link>
        )}
        {!current.readAt && (
          <Button variant="ghost" size="sm" onClick={markRead} disabled={working}>
            Mark read
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => snooze(10)} disabled={working}>
          Snooze 10m
        </Button>
        <Button variant="ghost" size="sm" onClick={() => snooze(60)} disabled={working}>
          Snooze 1h
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIndex((currentIndex) => (currentIndex + 1) % items.length);
            setRevealed(false);
          }}
          disabled={items.length < 2}
        >
          Next
        </Button>

        <div className="ml-auto flex flex-wrap gap-2">
          {isFlashcard && revealed && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reviewRecall("forgotten")}
                disabled={working}
              >
                Forgotten
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => reviewRecall("remembered")}
                disabled={working}
              >
                Remembered
              </Button>
            </>
          )}
          {isRecallCard && !isFlashcard && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => reviewRecall("completed")}
              disabled={working}
            >
              <CheckCircle size={15} />
              Resolve reminder
            </Button>
          )}
          {!isRecallCard && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => resolveStandalone("complete")}
                disabled={working}
              >
                Complete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resolveStandalone("dismiss")}
                disabled={working}
              >
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
