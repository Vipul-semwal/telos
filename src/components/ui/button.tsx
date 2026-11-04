import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground-primary disabled:opacity-40 disabled:cursor-not-allowed rounded-sm select-none";

    const variantStyles = {
      primary: "bg-accent text-white hover:bg-accent-hover",
      secondary: "bg-background-secondary text-foreground-primary border border-border hover:bg-background-tertiary",
      outline: "border border-border text-foreground-primary hover:bg-background-secondary",
      ghost: "text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary",
      danger: "bg-status-error text-white hover:opacity-90",
    };

    const sizeStyles = {
      sm: "h-7 px-2.5 text-[11px]",
      md: "h-9 px-4 text-xs",
      lg: "h-11 px-6 text-sm",
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
