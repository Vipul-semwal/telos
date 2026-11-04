"use client";

import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
  username?: string;
}

export function AppShell({ children, username }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile drawer on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-[100dvh] bg-background-primary text-foreground-primary flex flex-col font-sans">
      <Header
        username={username}
        isMobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      <div className="flex flex-1 relative">
        {/* Desktop permanent sidebar */}
        <div className="hidden md:block sticky top-12 h-[calc(100dvh-3rem)] shrink-0">
          <Sidebar />
        </div>

        {/* Mobile slide-over drawer and backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-12 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-12 bg-black/50 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-50 h-full">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Responsive main content container */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
