"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("glass-thin inline-flex items-center gap-0.5 rounded-lg p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-caption font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              active
                ? "bg-surface-elevated text-foreground-primary shadow-control"
                : "text-foreground-secondary hover:text-foreground-primary",
            )}
          >
            {option.label}
            {typeof option.count === "number" && (
              <span className="font-mono text-micro tabular-nums text-foreground-muted">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
