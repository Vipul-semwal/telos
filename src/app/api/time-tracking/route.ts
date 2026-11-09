import { NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [activeTimer, sessions, totals] = await Promise.all([
      TimeTrackingService.getActiveTimer(session.user.id),
      TimeTrackingService.listRecentSessions(session.user.id),
      TimeTrackingService.getTotalRecorded(session.user.id),
    ]);

    return NextResponse.json({ activeTimer, sessions, totals });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
