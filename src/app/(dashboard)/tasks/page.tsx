import { getServerSession } from "@/infrastructure/authentication/session";
import { TasksService } from "@/modules/tasks/service";
import { ProjectsService } from "@/modules/projects/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";
import { TasksHubView } from "./tasks-hub-view";
import type { Project } from "@/modules/projects/domain/types";

export default async function TasksPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const projects = await ProjectsService.list(userId, undefined, "active");
  const allTasks = await TasksService.list(userId, { parentTaskId: null });

  const totalCount = allTasks.length;
  const completedCount = allTasks.filter((task) => task.status === "completed").length;
  const inProgressCount = allTasks.filter((task) => task.status === "in_progress").length;

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Execution"
        title="Tasks"
        description="Discrete work items within projects. The hierarchy is Project → Task → Subtask, with nesting depth enforced server-side."
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{totalCount} tasks</Badge>
            {inProgressCount > 0 && <Badge variant="warning">{inProgressCount} in progress</Badge>}
            {completedCount > 0 && <Badge variant="success">{completedCount} done</Badge>}
          </div>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          kicker="No active projects"
          title="Create a project first"
          description="Tasks live inside projects. Create an active project under a discipline, then manage its tasks from the project detail page."
        />
      ) : (
        <TasksHubView projects={projects as Project[]} />
      )}
    </div>
  );
}
