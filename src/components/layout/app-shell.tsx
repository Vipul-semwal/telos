"use client";

import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";

interface AppShellProps {
  children: React.ReactNode;
  username?: string;
}

export function AppShell({ children, username }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-[100dvh] flex-col font-sans text-foreground-primary">
      <Header
        username={username}
        isMobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onOpenCommand={() => setCommandOpen(true)}
      />

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-5 px-3 pb-6 pt-4 sm:px-4 lg:gap-6 lg:px-6">
        <div className="sticky top-[4.75rem] hidden h-[calc(100dvh-6rem)] shrink-0 lg:block">
          <Sidebar />
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-50 flex lg:hidden">
            <div
              className="glass-overlay fixed inset-0"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 h-full animate-[slide-in-left_var(--duration-slow)_var(--ease-emphasized)] p-3">
              <Sidebar
                onNavigate={() => setMobileMenuOpen(false)}
                className="h-full w-72 rounded-3xl"
              />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-content py-1 sm:py-2">{children}</div>
        </main>
      </div>
    </div>
  );
}
