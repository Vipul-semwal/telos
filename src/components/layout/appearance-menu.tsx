"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun, SunDim } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { Tooltip } from "@/components/ui/tooltip";

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={16} /> },
  { value: "dark", label: "Dark", icon: <Moon size={16} /> },
  { value: "system", label: "System", icon: <Monitor size={16} /> },
];

export function AppearanceMenu() {
  const { theme, resolvedTheme, reduceTransparency, setTheme, setReduceTransparency } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Appearance" side="bottom">
        <button
          type="button"
          aria-label="Appearance settings"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground-secondary transition-colors hover:bg-surface-hover/70 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <TriggerIcon size={17} />
        </button>
      </Tooltip>

      {open && (
        <div
          role="menu"
          className="glass-thick absolute right-0 top-full z-50 mt-2 w-56 animate-scale-in rounded-2xl p-1.5"
        >
          <p className="px-2.5 pb-1.5 pt-1 font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
            Appearance
          </p>
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-small transition-colors hover:bg-surface-hover/70",
                theme === option.value
                  ? "text-foreground-primary"
                  : "text-foreground-secondary",
              )}
            >
              <span className="text-foreground-muted">{option.icon}</span>
              <span className="flex-1 text-left">{option.label}</span>
              {theme === option.value && <Check size={14} weight="bold" className="text-accent" />}
            </button>
          ))}

          <div className="mx-2 my-1.5 h-px bg-separator/10" />

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={reduceTransparency}
            onClick={() => setReduceTransparency(!reduceTransparency)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-small text-foreground-secondary transition-colors hover:bg-surface-hover/70 hover:text-foreground-primary"
          >
            <span className="text-foreground-muted">
              <SunDim size={16} />
            </span>
            <span className="flex-1 text-left">Reduce transparency</span>
            <span
              className={cn(
                "relative h-4 w-7 rounded-full transition-colors",
                reduceTransparency ? "bg-accent" : "bg-surface-hover",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  reduceTransparency ? "translate-x-3.5" : "translate-x-0.5",
                )}
              />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
