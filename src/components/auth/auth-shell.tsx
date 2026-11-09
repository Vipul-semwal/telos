import * as React from "react";
import Link from "next/link";
import { ChartLine, ShieldCheck, Sparkle, Timer } from "@phosphor-icons/react/dist/ssr";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const highlights = [
  {
    icon: Timer,
    title: "Evidence over intention",
    description: "Auditable working sessions and honest time telemetry.",
  },
  {
    icon: ChartLine,
    title: "Long-term signal",
    description: "Velocity and focus trends without gamified noise.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description: "Username-only identity. No email, no tracking.",
  },
];

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div className="hidden space-y-10 px-6 lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-white shadow-control">
              <Sparkle size={20} weight="fill" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-heading font-semibold tracking-tight text-foreground-primary">
                Telos
              </span>
              <span className="mt-1 font-mono text-micro uppercase tracking-[0.18em] text-foreground-muted">
                Intelligence system
              </span>
            </span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-balance text-display font-semibold tracking-tight text-foreground-primary">
              A quieter way to run long-term work.
            </h1>
            <p className="max-w-md text-body leading-relaxed text-foreground-secondary">
              Telos turns sustained pursuits into measurable execution — disciplines, projects,
              planned days, and verified working sessions.
            </p>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-raised/70 text-accent shadow-control">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-small font-medium text-foreground-primary">{item.title}</p>
                    <p className="text-caption text-foreground-muted">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-thick w-full rounded-3xl p-6 sm:p-8">
          <div className="mb-6 space-y-2">
            <span className="font-mono text-micro uppercase tracking-[0.16em] text-foreground-muted">
              {eyebrow}
            </span>
            <h2 className="text-title font-semibold tracking-tight text-foreground-primary">
              {title}
            </h2>
            <p className="text-small text-foreground-secondary">{description}</p>
          </div>

          {children}

          <div className="mt-6 border-t border-separator/10 pt-5 text-center">{footer}</div>
        </div>
      </div>
    </div>
  );
}
