"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/infrastructure/authentication/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,32}$/.test(cleanUsername)) {
      setError("Username must be 3-32 characters (letters, numbers, hyphens, underscores)");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Internal synthetic email satisfying library database requirement without user PII
      const internalEmail = `${cleanUsername}@telos.internal`;

      const res = await signUp.email({
        name: username.trim(),
        email: internalEmail,
        password,
        username: cleanUsername,
      });

      if (res.error) {
        setError(res.error.message || "Failed to register account");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during registration");
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
              TELOS // REGISTRATION
            </h1>
          </div>
          <p className="text-xs text-foreground-secondary">
            Create an independent personal intelligence workspace.
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
            placeholder="Minimum 8 characters"
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
          />

          <div className="p-2.5 bg-background-secondary border border-border text-[11px] font-mono text-foreground-secondary leading-relaxed">
            <strong>NOTICE:</strong> Telos enforces a strict username-only privacy standard. No email address is collected. Please preserve your credentials securely, as automated password recovery via email is not supported.
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
            {isLoading ? "PROVISIONING WORKSPACE..." : "CREATE WORKSPACE"}
          </Button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-xs text-foreground-secondary">
            Already registered?{" "}
            <Link href="/login" className="text-foreground-primary underline font-mono text-[11px]">
              LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
