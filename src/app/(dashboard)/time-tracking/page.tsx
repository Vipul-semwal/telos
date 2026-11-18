import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { getTodayDateString } from "@/shared/utils/date";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { TimeTrackingView } from "@/modules/time-tracking/components/time-tracking-view";

export default async function TimeTrackingPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const today = getTodayDateString();

  const [activeTimer, sessions, totals, planData] = await Promise.all([
    TimeTrackingService.getActiveTimer(userId),
    TimeTrackingService.listRecentSessions(userId),
    TimeTrackingService.getTotalRecorded(userId),
    DailyPlanningService.getPlanWithItems(userId, today),
  ]);

  const todaysTasks = planData.items
    .filter(
      (item) =>
        (item.status === "planned" || item.status === "in_progress") &&
        item.taskStatus !== "completed" &&
        item.taskStatus !== "cancelled",
    )
    .map((item) => ({
      id: item.taskId,
      title: item.taskTitle,
      projectTitle: item.projectTitle,
      estimatedDurationSeconds: item.taskEstimatedSeconds,
    }));

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Recording"
        title="Time tracking"
        description="Stopwatch tracking at the task level for tasks in today's plan. Exactly one active timer is permitted per user. Stopping a timer records the session without completing the task."
        badge={
          <Badge variant={activeTimer ? "accent" : "neutral"}>
            {activeTimer ? "Active session" : "Idle"}
          </Badge>
        }
      />

      <TimeTrackingView
        initialActiveTimer={activeTimer}
        initialSessions={sessions}
        initialTotals={totals}
        tasks={todaysTasks}
      />
    </div>
  );
}
