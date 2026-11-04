import { notFound } from "next/navigation";
import { requireAuth } from "@/infrastructure/authentication/session";
import { ProjectsService } from "@/modules/projects/service";
import { ProjectDetailView } from "./project-detail-view";
import { NotFoundError } from "@/shared/errors/domain-error";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const userId = session.user.id;
  const { id } = await params;

  try {
    const project = await ProjectsService.getByIdWithDetails(userId, id);
    const disciplineActiveCount = await ProjectsService.countActive(
      userId,
      project.disciplineId,
    );

    return (
      <ProjectDetailView
        project={project as any}
        disciplineActiveCount={disciplineActiveCount}
      />
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}
