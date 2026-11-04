import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "h-9 w-full bg-background-primary border border-border px-3 text-xs text-foreground-primary placeholder:text-foreground-muted focus-visible:outline-none focus-visible:border-foreground-primary rounded-sm transition-colors font-mono disabled:opacity-40 disabled:cursor-not-allowed",
            error && "border-status-error focus-visible:border-status-error",
            className,
          )}
          {...props}
        />
        {error && <span className="text-[11px] font-mono text-status-error">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
