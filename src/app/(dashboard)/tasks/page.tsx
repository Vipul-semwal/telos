import { getServerSession } from "@/infrastructure/authentication/session";
import { TasksService } from "@/modules/tasks/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";

export default async function TasksPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const taskList = await TasksService.list(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 05 // EXECUTION"
        title="TASKS & SUBTASKS"
        description="Discrete work items with estimated duration (ETA). Strict hierarchy invariant: Discipline ? Project ? Task ? Subtask. No nested subtasks."
        badge={<Badge variant="neutral">{taskList.length} TASKS</Badge>}
      />

      <EmptyState
        kicker="EXECUTION // PIPELINE READY"
        title="TASK SUBSYSTEM FOUNDATION"
        description="Tasks record estimated durations in integer seconds and track execution sessions. Parent depth validation and task history event logging are operational."
      />
    </div>
  );
}
