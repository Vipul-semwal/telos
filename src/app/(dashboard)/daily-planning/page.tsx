import { getServerSession } from "@/infrastructure/authentication/session";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { getTodayDateString } from "@/shared/utils/date";
import { formatSecondsToHuman } from "@/shared/utils/duration";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";

export default async function DailyPlanningPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const today = getTodayDateString();
  const planData = await DailyPlanningService.getPlanWithItems(userId, today);

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 02 // TODAY"
        title="DAILY PLANNING"
        description="Daily task selection and capacity management. Strict domain invariant: maximum 4 hours (14,400s) of planned work per day."
        badge={
          <Badge variant={planData.capacity.isCapacityReached ? "warning" : "neutral"}>
            {formatSecondsToHuman(planData.capacity.allocatedSeconds)} / 4h ALLOCATED
          </Badge>
        }
      />

      <EmptyState
        kicker="DAILY PLANNING // ENGINE READY"
        title="TODAY'S EXECUTION QUEUE"
        description="Tasks selected into today's queue are constrained by the 4-hour planned work limit. Unfinished tasks do not vanish or become overdue backlogs."
      />
    </div>
  );
}
