"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/infrastructure/authentication/client";
import { Button } from "../ui/button";

interface HeaderProps {
  username?: string;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({
  username,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="h-12 border-b border-border bg-background-primary px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu trigger */}
        {username && onToggleMobileMenu && (
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={onToggleMobileMenu}
            className="md:hidden flex items-center justify-center h-8 w-8 border border-border bg-background-secondary text-foreground-primary rounded-sm font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground-primary"
          >
            {isMobileMenuOpen ? "?" : "?"}
          </button>
        )}

        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 bg-accent rounded-none inline-block shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground-primary">
            TELOS
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-foreground-secondary border-l border-border pl-2">
            INTELLIGENCE SYSTEM
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {username ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-xs font-mono text-foreground-secondary truncate max-w-[120px] sm:max-w-none">
              ID: <span className="text-foreground-primary font-medium">{username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-7 px-2 text-[10px] sm:text-[11px]">
              LOGOUT
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">LOGIN</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="sm" className="h-7 px-2.5 text-[11px]">REGISTER</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
