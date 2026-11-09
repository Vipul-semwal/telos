import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  className?: string;
}

const sideStyles = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

export function Tooltip({ content, side = "bottom", children, className }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-56 rounded-md bg-foreground-primary px-2 py-1 text-caption font-medium text-background-primary opacity-0 shadow-popover transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          sideStyles[side],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
