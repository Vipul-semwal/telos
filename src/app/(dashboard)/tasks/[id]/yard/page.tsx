import { notFound } from "next/navigation";
import { requireAuth } from "@/infrastructure/authentication/session";
import { TaskYardService } from "@/modules/task-yard/service";
import { TaskYardView } from "@/modules/task-yard/components/task-yard-view";
import { NotFoundError } from "@/shared/errors/domain-error";

export default async function TaskYardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  try {
    const workspace = await TaskYardService.getWorkspace(session.user.id, id);
    return <TaskYardView initialWorkspace={workspace as any} />;
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
