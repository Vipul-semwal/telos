import { DisciplinesService, MAX_ACTIVE_DISCIPLINES } from "../disciplines/service";
import { DailyPlanningService } from "../daily-planning/service";
import { TimeTrackingService } from "../time-tracking/service";
import { BrainDumpService } from "../brain-dump/service";
import { ProjectsService } from "../projects/service";
import { TasksService } from "../tasks/service";
import { NotificationService } from "../notifications/service";
import { NotifyService } from "../notifications/service";
import { TaskYardService } from "../task-yard/service";
import { getTodayDateString } from "@/shared/utils/date";

export class CockpitService {
  /**
   * Aggregate high-level operational telemetry for the user's daily cockpit.
   */
  static async getOverview(userId: string) {
    const today = getTodayDateString();

    const [
      userDisciplines,
      activeProjects,
      rootTasks,
      dailyPlanData,
      activeTimer,
      brainDumpInbox,
    ] =
      await Promise.all([
        DisciplinesService.list(userId),
        ProjectsService.list(userId, undefined, "active"),
        TasksService.list(userId, { parentTaskId: null }),
        DailyPlanningService.getPlanWithItems(userId, today),
        TimeTrackingService.getActiveTimer(userId),
        BrainDumpService.list(userId, { status: "inbox" }),
      ]);

    const activeDisciplinesCount = userDisciplines.filter(
      (discipline) => discipline.status === "active",
    ).length;
    const activeProjectIds = new Set(activeProjects.map((project) => project.id));
    const openTasks = rootTasks.filter(
      (task) =>
        activeProjectIds.has(task.projectId) &&
        task.status !== "completed" &&
        task.status !== "cancelled",
    );
    const overdueTasks = openTasks.filter(
      (task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now(),
    );
    const priorityRank = { high: 0, medium: 1, low: 2 } as const;
    const nextTask =
      overdueTasks[0] ??
      [...openTasks].sort(
        (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
      )[0] ??
      null;
    const nextPlanItem = dailyPlanData.items.find(
      (item) => item.status === "planned" || item.status === "in_progress",
    );
    const dueOccurrences = await NotificationService.getDueOccurrences(userId);
    const [standaloneDue, recallDue] = await Promise.all([
      NotifyService.getDueItems(userId, dueOccurrences),
      TaskYardService.getDueItems(userId, dueOccurrences),
    ]);
    const dueNotifications = [
      ...standaloneDue.items.map((item) => ({
        ...item,
        sourceType: "notify" as const,
      })),
      ...recallDue.items,
    ].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    await NotificationService.markDelivered(
      userId,
      dueNotifications.map((item) => item.occurrenceId),
    );

    let nextAction: {
      kind: "timer" | "plan" | "task" | "discipline" | "project" | "inbox" | "complete";
      title: string;
      description: string;
      href: string;
      label: string;
    };

    if (activeTimer) {
      nextAction = {
        kind: "timer",
        title: `Continue: ${activeTimer.taskTitle}`,
        description:
          "A tracked session is already running. Finish or stop it before changing focus.",
        href: "/time-tracking",
        label: "Open timer",
      };
    } else if (nextPlanItem) {
      nextAction = {
        kind: "plan",
        title: `Start today’s plan: ${nextPlanItem.taskTitle}`,
        description: `${Math.round(nextPlanItem.plannedDurationSeconds / 60)} minutes are allocated for this task today.`,
        href: "/time-tracking",
        label: "Start tracking",
      };
    } else if (nextTask) {
      const isOverdue = overdueTasks.includes(nextTask);
      nextAction = {
        kind: "task",
        title: `${isOverdue ? "Overdue: " : "Next task: "}${nextTask.title}`,
        description: isOverdue
          ? "This task is past its due date. Resolve or reschedule it before starting lower-priority work."
          : "This is the highest-priority open root task across your active projects.",
        href: `/projects/${nextTask.projectId}?tab=tasks`,
        label: "Open task",
      };
    } else if (activeDisciplinesCount === 0) {
      nextAction = {
        kind: "discipline",
        title: "Create your first discipline",
        description:
          "A discipline is the long-horizon pursuit that will contain your projects and tasks.",
        href: "/disciplines",
        label: "Create discipline",
      };
    } else if (activeProjects.length === 0) {
      nextAction = {
        kind: "project",
        title: "Create your first active project",
        description:
          "Turn a sustained discipline into a measurable initiative with a concrete desired outcome.",
        href: "/projects",
        label: "Create project",
      };
    } else if (brainDumpInbox.length > 0) {
      nextAction = {
        kind: "inbox",
        title: `Triage ${brainDumpInbox.length} captured ${brainDumpInbox.length === 1 ? "item" : "items"}`,
        description:
          "Clear the inbox by converting captures into work, links, notes, or dismissal.",
        href: "/brain-dump",
        label: "Open inbox",
      };
    } else {
      nextAction = {
        kind: "complete",
        title: "No immediate work is waiting",
        description:
          "The active projects have no open root tasks and the inbox is clear. Capture the next meaningful action.",
        href: "/brain-dump",
        label: "Capture a thought",
      };
    }

    return {
      date: today,
      disciplines: {
        activeCount: activeDisciplinesCount,
        maxCapacity: MAX_ACTIVE_DISCIPLINES,
      },
      dailyPlan: dailyPlanData,
      activeTimer,
      inboxCount: brainDumpInbox.length,
      openTaskCount: openTasks.length,
      overdueTaskCount: overdueTasks.length,
      nextAction,
      dueNotifications,
    };
  }
}
