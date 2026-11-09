import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "accent" | "success" | "warning" | "error";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variantStyles = {
    neutral: "bg-surface-hover text-foreground-secondary",
    accent: "bg-accent/10 text-accent",
    success: "bg-status-success/10 text-status-success",
    warning: "bg-status-warning/10 text-status-warning",
    error: "bg-status-error/10 text-status-error",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-caption font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
