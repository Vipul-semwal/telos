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
    sm: "text-xs tracking-normal",
    md: "text-base tracking-wider",
    lg: "text-2xl font-semibold tracking-widest",
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
        <span className="text-[11px] text-foreground-secondary font-mono">
          / {formatSecondsToClock(estimatedSeconds)}
        </span>
      )}
      {isRunning && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
      )}
    </div>
  );
}
