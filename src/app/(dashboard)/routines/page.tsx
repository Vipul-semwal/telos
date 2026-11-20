import { getServerSession } from "@/infrastructure/authentication/session";
import { RoutineService } from "@/modules/routines/service";
import { ProjectsService } from "@/modules/projects/service";
import { PageHeader } from "@/components/ui/page-header";
import { getTodayDateString } from "@/shared/utils/date";
import { RoutineView } from "@/modules/routines/components/routine-view";

export default async function RoutinesPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const [routines, projects] = await Promise.all([
    RoutineService.list(userId),
    ProjectsService.list(userId, undefined, "active"),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        moduleCode="Planning"
        title="Routines"
        description="Recurring commitments with a different task for each weekday. Selected days are added automatically to Today's Plan."
      />
      <RoutineView
        initialRoutines={routines}
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
        }))}
        today={getTodayDateString()}
      />
    </div>
  );
}
