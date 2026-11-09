import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { TasksService } from "@/modules/tasks/service";
import { ProjectsService } from "@/modules/projects/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { TimeTrackingView } from "@/modules/time-tracking/components/time-tracking-view";

export default async function TimeTrackingPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const [activeTimer, sessions, totals, allTasks, projects] = await Promise.all([
    TimeTrackingService.getActiveTimer(userId),
    TimeTrackingService.listRecentSessions(userId),
    TimeTrackingService.getTotalRecorded(userId),
    TasksService.list(userId),
    ProjectsService.list(userId),
  ]);

  const projectTitles = new Map(projects.map((p) => [p.id, p.title]));
  const openTasks = allTasks
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
        moduleCode="Recording"
        title="Time tracking"
        description="Stopwatch tracking at the task level. Exactly one active timer is permitted per user. Stopping a timer records the session without completing the task."
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
        tasks={openTasks}
      />
    </div>
  );
}
