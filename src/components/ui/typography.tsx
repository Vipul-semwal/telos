import * as React from "react";
import { cn } from "@/shared/utils/cn";

export function H1({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-balance text-title font-semibold tracking-tight text-foreground-primary", className)}
      {...props}
    />
  );
}

export function H2({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-subheading font-semibold text-foreground-primary", className)}
      {...props}
    />
  );
}

export function Muted({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body text-foreground-secondary", className)} {...props} />;
}

export function LabelMono({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted", className)}
      {...props}
    />
  );
}
