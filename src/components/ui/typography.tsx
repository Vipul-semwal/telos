import * as React from "react";
import { cn } from "@/shared/utils/cn";

export function H1({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-xl font-medium tracking-tight text-foreground-primary uppercase font-mono",
        className,
      )}
      {...props}
    />
  );
}

export function H2({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-sm font-medium tracking-normal text-foreground-primary uppercase font-mono",
        className,
      )}
      {...props}
    />
  );
}

export function Muted({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-foreground-secondary", className)} {...props} />;
}

export function LabelMono({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-[11px] font-mono uppercase tracking-wider text-foreground-secondary", className)}
      {...props}
    />
  );
}
