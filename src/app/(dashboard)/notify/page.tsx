import { getServerSession } from "@/infrastructure/authentication/session";
import { DisciplinesService } from "@/modules/disciplines/service";
import { NotifyService } from "@/modules/notifications/service";
import { ProjectsService } from "@/modules/projects/service";
import { TasksService } from "@/modules/tasks/service";
import { NotificationsView } from "@/modules/notifications/components/notifications-view";

export default async function NotifyPage() {
  const session = await getServerSession();
  const userId = session!.user.id;
  const [overview, disciplines, projects, tasks] = await Promise.all([
    NotifyService.list(userId),
    DisciplinesService.list(userId),
    ProjectsService.list(userId),
    TasksService.list(userId),
  ]);

  return (
    <NotificationsView
      initialData={overview as any}
      disciplines={disciplines.map((item) => ({ id: item.id, title: item.title }))}
      projects={projects.map((item) => ({ id: item.id, title: item.title }))}
      tasks={tasks.map((item) => ({ id: item.id, title: item.title }))}
    />
  );
}
