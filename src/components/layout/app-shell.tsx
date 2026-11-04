import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
  username?: string;
}

export function AppShell({ children, username }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background-primary text-foreground-primary flex flex-col font-sans">
      <Header username={username} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
