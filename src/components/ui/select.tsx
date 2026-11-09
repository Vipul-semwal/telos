import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      children,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const messageId = error ? `${selectId}-error` : undefined;
    const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-small font-medium text-foreground-secondary"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full rounded bg-surface-raised/70 px-3 text-body text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] outline-none transition-all duration-150 hover:bg-surface-raised focus-visible:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-2 ring-status-error/40",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <span id={messageId} className="text-caption text-status-error">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
