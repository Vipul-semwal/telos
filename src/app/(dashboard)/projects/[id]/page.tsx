import { notFound } from "next/navigation";
import { requireAuth } from "@/infrastructure/authentication/session";
import { ProjectsService } from "@/modules/projects/service";
import { ReportingService } from "@/modules/reporting/service";
import { ProjectDetailView } from "./project-detail-view";
import { NotFoundError } from "@/shared/errors/domain-error";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireAuth();
  const userId = session.user.id;
  const { id } = await params;
  const { tab } = await searchParams;
  const validTabs = [
    "overview",
    "tasks",
    "reports",
  ] as const;
  const initialTab = validTabs.includes(tab as (typeof validTabs)[number])
    ? (tab as (typeof validTabs)[number])
    : "overview";

  try {
    const project = await ProjectsService.getByIdWithDetails(userId, id);
    const [disciplineActiveCount, report] = await Promise.all([
      ProjectsService.countActive(userId, project.disciplineId),
      ReportingService.getProjectReport(userId, id),
    ]);

    return (
      <ProjectDetailView
        project={project as any}
        disciplineActiveCount={disciplineActiveCount}
        report={report}
        initialTab={initialTab}
      />
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}
