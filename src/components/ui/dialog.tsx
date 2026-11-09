"use client";

import * as React from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    if (open) {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      const timer = window.setTimeout(() => {
        const preferred = panelRef.current?.querySelector<HTMLElement>(
          "[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
        );
        (preferred ?? panelRef.current)?.focus();
      }, 20);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
        window.clearTimeout(timer);
        previouslyFocused?.focus();
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="glass-overlay fixed inset-0 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "glass-thick relative z-50 max-h-[92vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl p-6 outline-none sm:max-w-lg sm:rounded-3xl",
          className,
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-6">
          <div className="space-y-1">
            <h2 id={titleId} className="text-heading font-semibold text-foreground-primary">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-body text-foreground-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
