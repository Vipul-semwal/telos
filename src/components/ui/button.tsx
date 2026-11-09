import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex select-none items-center justify-center gap-2 rounded font-medium transition-all duration-150 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

    const variantStyles = {
      primary:
        "bg-accent text-white shadow-control hover:bg-accent-hover active:bg-accent-pressed",
      secondary:
        "bg-surface-raised/80 text-foreground-primary shadow-control hover:bg-surface-hover",
      outline:
        "bg-transparent text-foreground-primary shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.14)] hover:bg-surface-hover/60",
      ghost: "text-foreground-secondary hover:bg-surface-hover/60 hover:text-foreground-primary",
      danger: "bg-status-error text-white shadow-control hover:opacity-90",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-caption",
      md: "h-10 px-4 text-small",
      lg: "h-11 px-5 text-body",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
