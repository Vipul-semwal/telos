import { getServerSession } from "@/infrastructure/authentication/session";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { ProjectsService } from "@/modules/projects/service";
import { DisciplinesService } from "@/modules/disciplines/service";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { BrainDumpView } from "@/modules/brain-dump/components/brain-dump-view";
import type { BrainDumpItem } from "@/modules/brain-dump/domain/types";
import { db } from "@/infrastructure/database";
import { projects } from "@/modules/projects/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { eq } from "drizzle-orm";

export default async function BrainDumpPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  const [items, disciplinesList, projectRows] = await Promise.all([
    BrainDumpService.list(userId),
    DisciplinesService.list(userId, "active"),
    db
      .select({
        id: projects.id,
        title: projects.title,
        disciplineTitle: disciplines.title,
      })
      .from(projects)
      .innerJoin(disciplines, eq(projects.disciplineId, disciplines.id))
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt),
  ]);

  const unresolvedCount = items.filter((item) => item.status === "inbox").length;

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Capture"
        title="Brain dump"
        description="Universal capture inbox. Get anything out of your head immediately, then classify it later — or leave it unclassified. Nothing is forced into the pursuit hierarchy."
        badge={<Badge variant="warning">{unresolvedCount} unresolved</Badge>}
      />

      <BrainDumpView
        initialItems={items as BrainDumpItem[]}
        projects={projectRows}
        disciplines={disciplinesList.map((d) => ({ id: d.id, title: d.title }))}
      />
    </div>
  );
}
