import {
  ArrowRight,
  CalendarDots,
  Compass,
  ShieldCheck,
  Sparkle,
  Timer,
  Tray,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getServerSession } from "@/infrastructure/authentication/session";
import { CockpitService } from "@/modules/cockpit/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { TimerDisplay } from "@/components/ui/timer-display";
import { formatSecondsToHuman } from "@/shared/utils/duration";
import { CockpitNotificationQueue } from "@/components/cockpit-notification-queue";

export default async function CockpitPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const overview = await CockpitService.getOverview(userId);

  const disciplinePct =
    (overview.disciplines.activeCount / overview.disciplines.maxCapacity) * 100;
  const planPct =
    (overview.dailyPlan.capacity.allocatedSeconds / overview.dailyPlan.capacity.maxSeconds) * 100;

  return (
    <div className="space-y-8">
      <PageHeader
        moduleCode="Overview"
        title="Cockpit"
        description={`Unified operational telemetry for ${overview.date}.`}
        badge={
          <Badge variant={overview.overdueTaskCount > 0 ? "warning" : "success"}>
            {overview.overdueTaskCount > 0
              ? `${overview.overdueTaskCount} overdue`
              : "Next action ready"}
          </Badge>
        }
      />

      <Card variant="glass" className="overflow-hidden p-0">
        <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-mono text-micro uppercase tracking-[0.14em] text-foreground-muted">
                Next action
              </span>
            </div>
            <h2 className="text-title font-semibold tracking-tight text-foreground-primary">
              {overview.nextAction.title}
            </h2>
            <p className="max-w-3xl text-small leading-relaxed text-foreground-secondary">
              {overview.nextAction.description}
            </p>
          </div>
          <Link
            href={overview.nextAction.href}
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-accent px-5 text-small font-medium text-white shadow-control transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary"
          >
            {overview.nextAction.label}
            <ArrowRight size={15} />
          </Link>
        </div>
      </Card>

      <CockpitNotificationQueue
        initialItems={overview.dueNotifications as React.ComponentProps<typeof CockpitNotificationQueue>["initialItems"]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <Compass size={18} />
            </span>
            <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
              Disciplines
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-display font-semibold tabular-nums text-foreground-primary">
                {overview.disciplines.activeCount}
              </span>
              <span className="text-small text-foreground-muted">
                / {overview.disciplines.maxCapacity} active
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, disciplinePct)}%` }}
              />
            </div>
            <Muted className="text-caption">Capacity enforced at the domain layer.</Muted>
          </div>
        </Card>

        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-status-warning/10 text-status-warning">
              <CalendarDots size={18} />
            </span>
            <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
              Today&apos;s plan
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-display font-semibold tabular-nums text-foreground-primary">
                {formatSecondsToHuman(overview.dailyPlan.capacity.allocatedSeconds)}
              </span>
              <span className="text-small text-foreground-muted">/ 4h cap</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-status-warning transition-all duration-500"
                style={{ width: `${Math.min(100, planPct)}%` }}
              />
            </div>
            <Muted className="text-caption">
              {formatSecondsToHuman(overview.dailyPlan.capacity.remainingSeconds)} remaining.
            </Muted>
          </div>
        </Card>

        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-status-success/10 text-status-success">
              <Timer size={18} />
            </span>
            <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
              Active timer
            </span>
          </div>
          {overview.activeTimer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-status-success" />
                <span className="truncate text-small font-medium text-foreground-primary">
                  {overview.activeTimer.taskTitle}
                </span>
              </div>
              <TimerDisplay
                actualSeconds={
                  overview.activeTimer.totalRecordedSeconds +
                  Math.floor(
                    (Date.now() - new Date(overview.activeTimer.startTime).getTime()) / 1000,
                  )
                }
                estimatedSeconds={overview.activeTimer.estimatedDurationSeconds}
                isRunning={true}
                size="md"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="block text-small text-foreground-secondary">
                Standby — no active session.
              </span>
              <Muted className="text-caption">Only one timer may record at a time.</Muted>
            </div>
          )}
        </Card>

        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <Tray size={18} />
            </span>
            <span className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
              Inbox
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-display font-semibold tabular-nums text-foreground-primary">
                {overview.inboxCount}
              </span>
              <span className="text-small text-foreground-muted">unclassified</span>
            </div>
            <Muted className="text-caption">Quick captures awaiting triage or conversion.</Muted>
          </div>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-heading font-semibold text-foreground-primary">
              System foundation
            </h2>
            <Muted className="text-small">
              Core architecture, ownership boundaries, and deterministic rules are in place.
            </Muted>
          </div>
          <Badge variant="success" className="self-start sm:self-auto">
            Foundation ready
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card variant="surface" className="space-y-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
              <Sparkle size={16} />
            </span>
            <div className="space-y-1">
              <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Hierarchy rule
              </p>
              <p className="text-small font-medium text-foreground-primary">
                Discipline → Project → Task → Subtask
              </p>
            </div>
            <Muted className="text-caption">Strict hierarchy. No deeper nesting.</Muted>
          </Card>

          <Card variant="surface" className="space-y-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-status-success/10 text-status-success">
              <ShieldCheck size={16} />
            </span>
            <div className="space-y-1">
              <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                Data ownership
              </p>
              <p className="text-small font-medium text-foreground-primary">Multi-tenant isolated</p>
            </div>
            <Muted className="text-caption">
              Identity is derived from the authenticated session on every query.
            </Muted>
          </Card>

          <Card variant="surface" className="space-y-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-status-warning/10 text-status-warning">
              <Compass size={16} />
            </span>
            <div className="space-y-1">
              <p className="font-mono text-micro uppercase tracking-[0.12em] text-foreground-muted">
                AI independence
              </p>
              <p className="text-small font-medium text-foreground-primary">Deterministic core</p>
            </div>
            <Muted className="text-caption">
              No proprietary SDK is a dependency of the domain layer.
            </Muted>
          </Card>
        </div>
      </section>
    </div>
  );
}
