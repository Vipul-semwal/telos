"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";

const navigationItems = [
  { href: "/", label: "COCKPIT", code: "01" },
  { href: "/daily-planning", label: "TODAY'S PLAN", code: "02" },
  { href: "/disciplines", label: "DISCIPLINES", code: "03" },
  { href: "/projects", label: "PROJECTS", code: "04" },
  { href: "/tasks", label: "TASKS & SUBTASKS", code: "05" },
  { href: "/brain-dump", label: "BRAIN DUMP", code: "06" },
  { href: "/time-tracking", label: "TIME TRACKING", code: "07" },
  { href: "/reporting", label: "REPORTS", code: "08" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-background-primary h-[calc(100vh-3rem)] sticky top-12 p-3 flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col gap-1">
        <div className="px-2 py-1.5 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
            MODULES
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 text-xs font-mono transition-colors rounded-sm",
                  isActive
                    ? "bg-background-secondary text-foreground-primary font-medium border-l-2 border-accent pl-2"
                    : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary/50",
                )}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-foreground-muted">{item.code}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-border">
        <div className="flex items-center justify-between text-[10px] font-mono text-foreground-muted">
          <span>SYS.VER</span>
          <span>v0.1.0-ALPHA</span>
        </div>
      </div>
    </aside>
  );
}
