import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";

export default async function TimeTrackingPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const activeTimer = await TimeTrackingService.getActiveTimer(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 07 // RECORDING"
        title="TIME TRACKING"
        description="Stopwatch tracking at task level. Strict domain invariant: exactly one active timer per user. Stopping a timer pauses recording without completing the task."
        badge={
          <Badge variant={activeTimer ? "accent" : "neutral"}>
            {activeTimer ? "ACTIVE SESSION" : "IDLE"}
          </Badge>
        }
      />

      <EmptyState
        kicker="TIME ENGINE // STANDBY"
        title="TIME RECORDING SUBSYSTEM"
        description="Discrete work intervals are logged in integer seconds. Actual task duration is computed dynamically as the sum of its sessions."
      />
    </div>
  );
}
