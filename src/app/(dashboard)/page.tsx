import { getServerSession } from "@/infrastructure/authentication/session";
import { CockpitService } from "@/modules/cockpit/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { H1, Muted, LabelMono } from "@/components/ui/typography";
import { TimerDisplay } from "@/components/ui/timer-display";
import { formatSecondsToHuman } from "@/shared/utils/duration";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CockpitPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const overview = await CockpitService.getOverview(userId);

  return (
    <div className="space-y-6">
      {/* Top Header / Meta bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-accent inline-block" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
              OPERATIONAL TELEMETRY
            </span>
          </div>
          <H1>COCKPIT OVERVIEW</H1>
          <Muted>Unified personal intelligence status for date: {overview.date}</Muted>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral">SYS.STATUS: OPTIMAL</Badge>
          <Badge variant="accent">MODULAR MONOLITH</Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Disciplines Limit Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>ACTIVE DISCIPLINES</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground-primary">
                {overview.disciplines.activeCount}
              </span>
              <span className="font-mono text-xs text-foreground-secondary">
                / {overview.disciplines.maxCapacity} MAX
              </span>
            </div>
            <div className="w-full bg-background-secondary h-1.5 rounded-none overflow-hidden">
              <div
                className="bg-foreground-primary h-full transition-all"
                style={{
                  width: `${(overview.disciplines.activeCount / overview.disciplines.maxCapacity) * 100}%`,
                }}
              />
            </div>
            <Muted className="text-[11px]">Strict capacity constraint enforced at domain layer.</Muted>
          </CardContent>
        </Card>

        {/* Daily Planning Capacity Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>DAILY WORK ALLOCATION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground-primary">
                {formatSecondsToHuman(overview.dailyPlan.capacity.allocatedSeconds)}
              </span>
              <span className="font-mono text-xs text-foreground-secondary">
                / 4h 00m CAP
              </span>
            </div>
            <div className="w-full bg-background-secondary h-1.5 rounded-none overflow-hidden">
              <div
                className="bg-accent h-full transition-all"
                style={{
                  width: `${(overview.dailyPlan.capacity.allocatedSeconds / overview.dailyPlan.capacity.maxSeconds) * 100}%`,
                }}
              />
            </div>
            <Muted className="text-[11px]">
              Remaining capacity: {formatSecondsToHuman(overview.dailyPlan.capacity.remainingSeconds)}
            </Muted>
          </CardContent>
        </Card>

        {/* Active Timer Status Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>ACTIVE TIMER SESSION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.activeTimer ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="font-mono text-xs font-medium text-foreground-primary truncate">
                    {overview.activeTimer.taskTitle}
                  </span>
                </div>
                <TimerDisplay
                  actualSeconds={Math.floor(
                    (Date.now() - new Date(overview.activeTimer.startTime).getTime()) / 1000,
                  )}
                  estimatedSeconds={overview.activeTimer.estimatedDurationSeconds}
                  isRunning={true}
                  size="md"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-mono text-xs text-foreground-secondary block">
                  STANDBY ? NO ACTIVE TIMER
                </span>
                <Muted className="text-[11px]">Only one timer can record at any given time.</Muted>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brain Dump Inbox Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>BRAIN DUMP INBOX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground-primary">
                {overview.inboxCount}
              </span>
              <span className="font-mono text-xs text-foreground-secondary">UNCLASSIFIED</span>
            </div>
            <Muted className="text-[11px]">Quick-captured items awaiting triage or conversion.</Muted>
          </CardContent>
        </Card>
      </div>

      {/* Module Overview Section */}
      <div className="border border-border p-6 rounded-sm bg-background-primary space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-foreground-primary">
              SYSTEM FOUNDATION & ARCHITECTURAL READINESS
            </h2>
            <Muted>
              The core modular monolith foundation, database schemas, and rule boundaries are established.
            </Muted>
          </div>
          <Badge variant="success">FOUNDATION READY</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="border border-border p-3 space-y-1 bg-background-secondary/30">
            <span className="text-foreground-secondary block">01 // HIERARCHY RULE</span>
            <span className="text-foreground-primary font-medium block">
              Discipline ? Project ? Task ? Subtask
            </span>
            <Muted className="text-[10px]">No arbitrary nesting permitted.</Muted>
          </div>

          <div className="border border-border p-3 space-y-1 bg-background-secondary/30">
            <span className="text-foreground-secondary block">02 // DATA OWNERSHIP</span>
            <span className="text-foreground-primary font-medium block">
              Multi-tenant Isolated
            </span>
            <Muted className="text-[10px]">Every query derives identity from authenticated session.</Muted>
          </div>

          <div className="border border-border p-3 space-y-1 bg-background-secondary/30">
            <span className="text-foreground-secondary block">03 // AI INDEPENDENCE</span>
            <span className="text-foreground-primary font-medium block">
              Deterministic Core
            </span>
            <Muted className="text-[10px]">Zero proprietary SDK dependencies in domain layer.</Muted>
          </div>
        </div>
      </div>
    </div>
  );
}
