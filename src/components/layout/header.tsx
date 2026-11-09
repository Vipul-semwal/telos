"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  List,
  MagnifyingGlass,
  SignOut,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { signOut } from "@/infrastructure/authentication/client";
import { Tooltip } from "@/components/ui/tooltip";
import { AppearanceMenu } from "./appearance-menu";

interface HeaderProps {
  username?: string;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onOpenCommand?: () => void;
}

export function Header({
  username,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  onOpenCommand,
}: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initial = (username ?? "T").trim().charAt(0).toUpperCase();

  return (
    <header className="glass-chrome sticky top-0 z-40 flex h-14 select-none items-center justify-between gap-3 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        {username && onToggleMobileMenu && (
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={onToggleMobileMenu}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground-secondary transition-colors hover:bg-surface-hover/70 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 lg:hidden"
          >
            {isMobileMenuOpen ? <X size={18} /> : <List size={18} />}
          </button>
        )}

        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-control">
            <Sparkle size={16} weight="fill" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-subheading font-semibold tracking-tight text-foreground-primary">
              Telos
            </span>
            <span className="hidden font-mono text-micro uppercase tracking-[0.16em] text-foreground-muted sm:block">
              Intelligence system
            </span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenCommand && (
          <>
            <button
              type="button"
              onClick={onOpenCommand}
              className="hidden h-9 items-center gap-2 rounded-full bg-surface-raised/60 px-3 text-caption text-foreground-muted shadow-control transition-colors hover:bg-surface-raised hover:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:flex"
            >
              <MagnifyingGlass size={15} />
              <span>Search</span>
              <kbd className="ml-1 rounded bg-surface-hover px-1.5 py-0.5 font-mono text-micro text-foreground-muted">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={onOpenCommand}
              aria-label="Open search"
              className="grid h-9 w-9 place-items-center rounded-full text-foreground-secondary transition-colors hover:bg-surface-hover/70 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:hidden"
            >
              <MagnifyingGlass size={17} />
            </button>
          </>
        )}

        <AppearanceMenu />

        {username && (
          <>
            <span className="mx-0.5 hidden h-5 w-px bg-separator/10 sm:block" />
            <div className="flex items-center gap-2 rounded-full bg-surface-raised/60 py-1 pl-1 pr-1 shadow-control sm:pr-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/[0.12] font-mono text-caption font-semibold text-accent">
                {initial}
              </span>
              <span className="hidden max-w-32 truncate text-caption font-medium text-foreground-secondary sm:block">
                {username}
              </span>
            </div>
            <Tooltip content="Sign out" side="bottom">
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover/70 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <SignOut size={17} />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}
