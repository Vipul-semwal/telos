import { getServerSession } from "@/infrastructure/authentication/session";
import { ProjectsService } from "@/modules/projects/service";
import { DisciplinesService } from "@/modules/disciplines/service";
import { ProjectsView } from "./projects-view";
import { db } from "@/infrastructure/database";
import { projects } from "@/modules/projects/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { eq, and, count } from "drizzle-orm";

export default async function ProjectsPage() {
  const session = await getServerSession();
  const userId = session!.user.id;

  // 1. Fetch user disciplines with active projects count
  const userDisciplines = await DisciplinesService.list(userId);
  const disciplinesWithOptions = await Promise.all(
    userDisciplines.map(async (d) => {
      const activeCount = await ProjectsService.countActive(userId, d.id);
      return {
        id: d.id,
        title: d.title,
        activeCount,
      };
    }),
  );

  // 2. Fetch projects with parent discipline title
  const projectRows = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      disciplineId: projects.disciplineId,
      title: projects.title,
      description: projects.description,
      desiredOutcome: projects.desiredOutcome,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      disciplineTitle: disciplines.title,
    })
    .from(projects)
    .innerJoin(disciplines, eq(projects.disciplineId, disciplines.id))
    .where(eq(projects.userId, userId))
    .orderBy(projects.createdAt);

  return (
    <ProjectsView
      initialProjects={projectRows as any}
      disciplines={disciplinesWithOptions}
    />
  );
}
