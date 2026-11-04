import { getServerSession } from "@/infrastructure/authentication/session";
import { ProjectsService, MAX_ACTIVE_PROJECTS_PER_DISCIPLINE } from "@/modules/projects/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/state-views";

export default async function ProjectsPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const projectList = await ProjectsService.list(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        moduleCode="MODULE 04 // INITIATIVES"
        title="PROJECTS"
        description={`Targeted initiatives nested inside disciplines. Strict domain invariant: maximum ${MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects per discipline.`}
        badge={<Badge variant="neutral">{projectList.length} TOTAL</Badge>}
      />

      <EmptyState
        kicker="PROJECTS // BOUNDARY READY"
        title="PROJECT INITIATIVE PIPELINE"
        description="Projects belong to disciplines and organize tasks. Cross-user isolation and maximum 3 active initiatives per discipline are strictly enforced."
      />
    </div>
  );
}
