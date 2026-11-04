import { getServerSession } from "@/infrastructure/authentication/session";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { getTodayDateString } from "@/shared/utils/date";
import { formatSecondsToHuman } from "@/shared/utils/duration";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export default async function DailyPlanningPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const today = getTodayDateString();
  const planData = await DailyPlanningService.getPlanWithItems(userId, today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 02 // TODAY
          </span>
          <H1>DAILY PLANNING</H1>
          <Muted>Planned work limit: 4 hours (14,400s) per day. Actual work may exceed planned duration.</Muted>
        </div>
        <Badge variant={planData.capacity.isCapacityReached ? "warning" : "neutral"}>
          {formatSecondsToHuman(planData.capacity.allocatedSeconds)} / 4h ALLOCATED
        </Badge>
      </div>

      <div className="border border-dashed border-border p-8 text-center rounded-sm">
        <p className="font-mono text-xs text-foreground-secondary mb-1">DAILY PLANNING ENGINE ACTIVE</p>
        <Muted>Date isolation, planned allocation cap, and rollover preservation ready.</Muted>
      </div>
    </div>
  );
}
