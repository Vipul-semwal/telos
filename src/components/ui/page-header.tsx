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
        "flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {moduleCode && (
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-accent inline-block rounded-none" />
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-foreground-secondary">
              {moduleCode}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <H1 className="text-lg sm:text-xl">{title}</H1>
          {badge}
        </div>
        {description && <Muted className="text-xs max-w-2xl">{description}</Muted>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
