"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/infrastructure/authentication/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn.username({
        username: username.toLowerCase().trim(),
        password,
      });

      if (res.error) {
        setError(res.error.message || "Invalid credentials");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border p-6 bg-background-primary rounded-sm space-y-6">
        <div className="border-b border-border pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-accent" />
            <h1 className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground-primary">
              TELOS // AUTHENTICATION
            </h1>
          </div>
          <p className="text-xs text-foreground-secondary">
            Sign in to access your personal intelligence cockpit.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="????????"
          />

          <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
            {isLoading ? "AUTHENTICATING..." : "ENTER COCKPIT"}
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-xs text-foreground-secondary">
            Need an account?{" "}
            <Link href="/register" className="text-foreground-primary underline font-mono text-[11px]">
              REGISTER (USERNAME ONLY)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
