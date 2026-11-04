"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-none transition-opacity"
        onClick={onClose}
      />
      {/* Dialog box */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg bg-background-primary border border-border p-6 shadow-none rounded-sm",
          className,
        )}
      >
        <div className="flex flex-col gap-1 border-b border-border pb-3 mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-foreground-primary font-medium">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-foreground-secondary">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
