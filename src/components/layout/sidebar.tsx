"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Bell,
  CalendarDots,
  ChartLine,
  CheckSquare,
  Compass,
  FolderSimple,
  SquaresFour,
  Timer,
} from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

export const navigationItems = [
  { href: "/", label: "Cockpit", icon: SquaresFour },
  { href: "/daily-planning", label: "Today's plan", icon: CalendarDots },
  { href: "/disciplines", label: "Disciplines", icon: Compass },
  { href: "/projects", label: "Projects", icon: FolderSimple },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/brain-dump", label: "Brain dump", icon: Brain },
  { href: "/notify", label: "Notify", icon: Bell },
  { href: "/time-tracking", label: "Time tracking", icon: Timer },
  { href: "/reporting", label: "Reports", icon: ChartLine },
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "glass-chrome flex h-full w-60 shrink-0 select-none flex-col justify-between rounded-3xl p-3",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="px-3 pb-2 pt-1.5">
          <span className="font-mono text-micro uppercase tracking-[0.14em] text-foreground-muted">
            Workspace
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-small font-medium transition-all duration-150",
                  isActive
                    ? "bg-surface-elevated/80 text-foreground-primary shadow-control"
                    : "text-foreground-secondary hover:bg-surface-hover/50 hover:text-foreground-primary",
                )}
              >
                <Icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-foreground-muted group-hover:text-foreground-secondary",
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-2xl bg-surface-hover/40 p-3">
        <div className="flex items-center gap-2 text-caption text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
          <span>Local workspace</span>
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-micro text-foreground-quaternary">
          <span>TELOS</span>
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
