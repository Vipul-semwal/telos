"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/infrastructure/authentication/client";
import { Button } from "../ui/button";

interface HeaderProps {
  username?: string;
}

export function Header({ username }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="h-12 border-b border-border bg-background-primary px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 bg-accent rounded-none inline-block" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground-primary">
            TELOS
          </span>
          <span className="text-[10px] font-mono text-foreground-secondary border-l border-border pl-2">
            PERSONAL INTELLIGENCE SYSTEM
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {username ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-foreground-secondary">
              ID: <span className="text-foreground-primary">{username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              LOGOUT
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">LOGIN</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="sm">REGISTER</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
