import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "accent" | "success" | "warning" | "error";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variantStyles = {
    neutral: "bg-background-secondary text-foreground-secondary border-border",
    accent: "bg-accent/10 text-accent border-accent/30",
    success: "bg-status-success/10 text-status-success border-status-success/30",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/30",
    error: "bg-status-error/10 text-status-error border-status-error/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
