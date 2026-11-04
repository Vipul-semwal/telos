import { getServerSession } from "@/infrastructure/authentication/session";
import { TasksService } from "@/modules/tasks/service";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export default async function TasksPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const taskList = await TasksService.list(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 05 // EXECUTION
          </span>
          <H1>TASKS & SUBTASKS</H1>
          <Muted>Strict hierarchy: Discipline ? Project ? Task ? Subtask. No further nesting.</Muted>
        </div>
        <Badge variant="neutral">{taskList.length} TASKS</Badge>
      </div>

      <div className="border border-dashed border-border p-8 text-center rounded-sm">
        <p className="font-mono text-xs text-foreground-secondary mb-1">TASK SUBSYSTEM ACTIVE</p>
        <Muted>Task history event logging and depth constraints ready for feature implementation.</Muted>
      </div>
    </div>
  );
}
