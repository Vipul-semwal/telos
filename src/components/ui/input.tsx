import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      hint,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const message = error ?? hint;
    const messageId = message ? `${inputId}-message` : undefined;
    const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-small font-medium text-foreground-secondary"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full rounded bg-surface-raised/70 px-3 text-body text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] transition-all duration-150 placeholder:text-foreground-quaternary hover:bg-surface-raised focus-visible:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40",
            error && "ring-2 ring-status-error/40",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <span id={messageId} className="text-caption text-foreground-muted">
            {hint}
          </span>
        )}
        {error && (
          <span id={messageId} className="text-caption text-status-error">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const messageId = error ? `${textareaId}-error` : undefined;
    const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-small font-medium text-foreground-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-24 w-full resize-y rounded bg-surface-raised/70 px-3 py-2.5 text-body text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.09)] transition-all duration-150 placeholder:text-foreground-quaternary hover:bg-surface-raised focus-visible:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40",
            error && "ring-2 ring-status-error/40",
            className,
          )}
          {...props}
        />
        {error && (
          <span id={messageId} className="text-caption text-status-error">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
