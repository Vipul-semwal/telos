import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "surface" | "bordered" | "glass";
}

export function Card({ className, variant = "surface", ...props }: CardProps) {
  const variantStyles = {
    default: "bg-transparent",
    surface: "surface-panel rounded-2xl",
    bordered: "bg-surface-raised/60 rounded-2xl shadow-[inset_0_0_0_1px_rgb(var(--separator)/0.08)]",
    glass: "glass rounded-2xl",
  };

  return <div className={cn(variantStyles[variant], "p-5", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-subheading font-semibold text-foreground-primary", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-body text-foreground-secondary", className)} {...props} />;
}
