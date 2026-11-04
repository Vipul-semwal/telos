import { DisciplinesService, MAX_ACTIVE_DISCIPLINES } from "../disciplines/service";
import { DailyPlanningService } from "../daily-planning/service";
import { TimeTrackingService } from "../time-tracking/service";
import { BrainDumpService } from "../brain-dump/service";
import { getTodayDateString } from "@/shared/utils/date";

export class CockpitService {
  /**
   * Aggregate high-level operational telemetry for the user's daily cockpit.
   */
  static async getOverview(userId: string) {
    const today = getTodayDateString();

    const [activeDisciplinesCount, dailyPlanData, activeTimer, brainDumpInbox] =
      await Promise.all([
        DisciplinesService.countActive(userId),
        DailyPlanningService.getPlanWithItems(userId, today),
        TimeTrackingService.getActiveTimer(userId),
        BrainDumpService.list(userId, "inbox"),
      ]);

    return {
      date: today,
      disciplines: {
        activeCount: activeDisciplinesCount,
        maxCapacity: MAX_ACTIVE_DISCIPLINES,
      },
      dailyPlan: dailyPlanData,
      activeTimer,
      inboxCount: brainDumpInbox.length,
    };
  }
}
