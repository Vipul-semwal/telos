import * as React from "react";
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
  kicker = "INVENTORY // EMPTY",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "w-full border border-dashed border-border p-8 sm:p-12 text-center rounded-sm bg-background-primary select-none",
        className,
      )}
    >
      <div className="max-w-md mx-auto space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted block">
          {kicker}
        </span>
        <h3 className="font-mono text-sm uppercase tracking-wider text-foreground-primary font-medium">
          {title}
        </h3>
        <Muted className="text-xs leading-relaxed">{description}</Muted>
        {actionLabel && onAction && (
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={onAction}>
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

export function LoadingState({
  label = "LOADING TELEMETRY...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "w-full border border-border p-8 sm:p-12 text-center rounded-sm bg-background-secondary/30",
        className,
      )}
    >
      <div className="inline-flex items-center gap-3">
        <span className="h-2 w-2 bg-accent animate-ping rounded-none" />
        <span className="font-mono text-xs uppercase tracking-widest text-foreground-secondary">
          {label}
        </span>
      </div>
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
  title = "SYSTEM FAULT",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "w-full border border-status-error/40 bg-status-error/5 p-4 sm:p-6 rounded-sm space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 bg-status-error rounded-none" />
        <h4 className="font-mono text-xs uppercase tracking-wider text-status-error font-medium">
          {title}
        </h4>
      </div>
      <p className="font-mono text-xs text-foreground-secondary">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          RETRY OPERATION
        </Button>
      )}
    </div>
  );
}
