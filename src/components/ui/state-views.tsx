import * as React from "react";
import { CircleNotch, Tray, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";
import { Button } from "./button";
import { Muted } from "./typography";

export interface EmptyStateProps {
  kicker?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  kicker = "Nothing here yet",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-panel w-full select-none rounded-3xl px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mx-auto max-w-md space-y-4">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Tray size={22} weight="regular" />
        </span>
        <span className="block font-mono text-micro uppercase tracking-[0.14em] text-foreground-muted">
          {kicker}
        </span>
        <h3 className="text-heading font-semibold text-foreground-primary">{title}</h3>
        <Muted className="mx-auto max-w-sm text-small leading-relaxed">{description}</Muted>
        {actionLabel && onAction && (
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading", className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "surface-panel flex w-full items-center justify-center gap-3 rounded-3xl px-6 py-14",
        className,
      )}
    >
      <CircleNotch size={16} weight="bold" className="animate-spin text-accent" />
      <span className="text-small text-foreground-secondary">{label}</span>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl bg-status-error/[0.07] p-5 shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <WarningCircle size={18} weight="fill" className="text-status-error" />
        <h4 className="text-subheading font-semibold text-status-error">{title}</h4>
      </div>
      <p className="text-small text-foreground-secondary">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
