"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { navigationItems } from "./sidebar";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return navigationItems;
    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(normalized) ||
        item.href.toLowerCase().includes(normalized),
    );
  }, [query]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = React.useCallback(
    (href: string) => {
      router.push(href);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length ? (index - 1 + results.length) % results.length : 0,
      );
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex].href);
    }
  };

  if (!open) return null;

  return (
    <div className="glass-overlay fixed inset-0 z-[70] flex animate-fade-in items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="glass-thick relative z-10 w-full max-w-xl animate-scale-in rounded-3xl p-2"
      >
        <div className="flex items-center gap-3 px-3">
          <MagnifyingGlass size={18} className="shrink-0 text-foreground-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search modules and navigate…"
            aria-label="Search modules"
            className="h-12 w-full bg-transparent text-body text-foreground-primary outline-none placeholder:text-foreground-quaternary"
          />
          <kbd className="hidden shrink-0 rounded-md bg-surface-hover px-1.5 py-0.5 font-mono text-micro text-foreground-muted sm:block">
            ESC
          </kbd>
        </div>

        <div className="mx-2 h-px bg-separator/10" />

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-small text-foreground-muted">
              No matching modules.
            </p>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;
              return (
                <button
                  key={item.href}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    active ? "bg-surface-hover/80" : "hover:bg-surface-hover/50",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      active
                        ? "bg-accent/[0.12] text-accent"
                        : "bg-surface-hover/70 text-foreground-secondary",
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="flex-1 text-small font-medium text-foreground-primary">
                    {item.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className={cn(
                      "transition-opacity",
                      active ? "text-foreground-muted opacity-100" : "opacity-0",
                    )}
                  />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-separator/[0.07] px-3 py-2 text-caption text-foreground-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-hover px-1 py-0.5 font-mono text-micro">↑</kbd>
            <kbd className="rounded bg-surface-hover px-1 py-0.5 font-mono text-micro">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-hover px-1 py-0.5 font-mono text-micro">↵</kbd>
            open
          </span>
        </div>
      </div>
    </div>
  );
}
