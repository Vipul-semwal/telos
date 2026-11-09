import { getServerSession } from "@/infrastructure/authentication/session";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { TasksService } from "@/modules/tasks/service";
import { ProjectsService } from "@/modules/projects/service";
import { getTodayDateString } from "@/shared/utils/date";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DailyPlanView } from "@/modules/daily-planning/components/daily-plan-view";
import type { PlanItemRow } from "@/modules/daily-planning/components/daily-plan-view";

export default async function DailyPlanningPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const today = getTodayDateString();

  const [planData, allTasks, projects] = await Promise.all([
    DailyPlanningService.getPlanWithItems(userId, today),
    TasksService.list(userId),
    ProjectsService.list(userId),
  ]);

  const projectTitles = new Map(projects.map((p) => [p.id, p.title]));

  const candidateTasks = allTasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .map((t) => ({
      id: t.id,
      title: t.title,
      projectTitle: projectTitles.get(t.projectId) ?? "PROJECT",
      estimatedDurationSeconds: t.estimatedDurationSeconds,
    }));

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Today"
        title="Daily planning"
        description="Daily task selection and capacity management. A maximum of four hours (14,400 seconds) of planned work is enforced per day."
        badge={
          <Badge variant={planData.capacity.isCapacityReached ? "error" : "neutral"}>
            {planData.capacity.allocatedSeconds > 0
              ? `${Math.round(planData.capacity.allocatedSeconds / 60)}m / 240m allocated`
              : "0m / 240m allocated"}
          </Badge>
        }
      />

      <DailyPlanView
        date={today}
        initialItems={planData.items as PlanItemRow[]}
        candidateTasks={candidateTasks}
      />
    </div>
  );
}
