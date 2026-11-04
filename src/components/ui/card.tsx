import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "surface" | "bordered";
}

export function Card({
  className,
  variant = "bordered",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-background-primary",
    surface: "bg-background-secondary",
    bordered: "bg-background-primary border border-border rounded-sm",
  };

  return <div className={cn(variantStyles[variant], "p-4", className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 border-b border-border pb-3 mb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-mono text-xs uppercase tracking-wider text-foreground-primary font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-xs text-foreground-secondary", className)} {...props} />;
}
