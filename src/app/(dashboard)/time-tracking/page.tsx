import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export default async function TimeTrackingPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const activeTimer = await TimeTrackingService.getActiveTimer(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 07 // RECORDING
          </span>
          <H1>TIME TRACKING</H1>
          <Muted>Strict rule: Exactly one active timer per user. Stop pauses recording without completing the task.</Muted>
        </div>
        <Badge variant={activeTimer ? "accent" : "neutral"}>
          {activeTimer ? "ACTIVE SESSION" : "IDLE"}
        </Badge>
      </div>

      <div className="border border-dashed border-border p-8 text-center rounded-sm">
        <p className="font-mono text-xs text-foreground-secondary mb-1">TIME TRACKING ENGINE READY</p>
        <Muted>Sessions logged in integer seconds, auditable corrections supported, ETA tracking ready.</Muted>
      </div>
    </div>
  );
}
