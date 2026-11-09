"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/infrastructure/authentication/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    } catch {
      setError("An unexpected error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New workspace"
      title="Create your Telos"
      description="One private space for your disciplines, projects, and measured execution."
      footer={
        <p className="text-small text-foreground-secondary">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-5 rounded-xl bg-status-error/[0.08] px-3.5 py-3 text-small text-status-error shadow-[inset_0_0_0_1px_rgb(var(--status-error)/0.16)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          type="text"
          required
          autoFocus
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="your-handle"
          hint="3-32 characters. Letters, numbers, hyphens, underscores."
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
        />

        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat password"
        />

        <div className="rounded-xl bg-surface-hover/45 p-3.5 text-caption leading-relaxed text-foreground-secondary">
          <strong className="font-medium text-foreground-primary">Privacy notice.</strong> Telos
          uses a strict username-only standard. No email address is collected, so automated
          password recovery is not available. Keep your credentials safe.
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </AuthShell>
  );
}
