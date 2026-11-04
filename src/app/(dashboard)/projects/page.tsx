import { getServerSession } from "@/infrastructure/authentication/session";
import { ProjectsService, MAX_ACTIVE_PROJECTS_PER_DISCIPLINE } from "@/modules/projects/service";
import { H1, Muted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const projectList = await ProjectsService.list(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-foreground-secondary">
            MODULE 04 // INITIATIVES
          </span>
          <H1>PROJECTS</H1>
          <Muted>Projects nested inside disciplines. Maximum {MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects per discipline.</Muted>
        </div>
        <Badge variant="neutral">{projectList.length} TOTAL</Badge>
      </div>

      <div className="border border-dashed border-border p-8 text-center rounded-sm">
        <p className="font-mono text-xs text-foreground-secondary mb-1">PROJECT MODULE ACTIVE</p>
        <Muted>Schema, ownership isolation, and maximum 3 active projects constraints are operational.</Muted>
      </div>
    </div>
  );
}
