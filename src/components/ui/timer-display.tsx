import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { formatSecondsToClock, calculateEtaStatus } from "@/shared/utils/duration";

export interface TimerDisplayProps {
  actualSeconds: number;
  estimatedSeconds?: number;
  isRunning?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TimerDisplay({
  actualSeconds,
  estimatedSeconds = 0,
  isRunning = false,
  size = "md",
  className,
}: TimerDisplayProps) {
  const etaStatus = calculateEtaStatus(actualSeconds, estimatedSeconds);

  const sizeStyles = {
    sm: "text-caption",
    md: "text-base",
    lg: "text-3xl font-semibold tracking-tight",
  };

  const statusColors = {
    green: "text-status-success",
    red: "text-status-error",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 font-mono tabular-nums", className)}>
      <span className={cn(sizeStyles[size], statusColors[etaStatus])}>
        {formatSecondsToClock(actualSeconds)}
      </span>
      {estimatedSeconds > 0 && (
        <span className="font-mono text-caption text-foreground-tertiary">
          / {formatSecondsToClock(estimatedSeconds)}
        </span>
      )}
      {isRunning && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
      )}
    </div>
  );
}
