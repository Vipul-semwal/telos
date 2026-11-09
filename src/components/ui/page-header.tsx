import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { H1, Muted } from "./typography";

export interface PageHeaderProps {
  moduleCode?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  moduleCode,
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 pb-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {moduleCode && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-micro uppercase tracking-[0.16em] text-foreground-muted">
              {moduleCode}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <H1>{title}</H1>
          {badge}
        </div>
        {description && <Muted className="max-w-2xl text-small">{description}</Muted>}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">{actions}</div>
      )}
    </div>
  );
}
