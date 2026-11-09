import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { isValidDateString, getTodayDateString } from "@/shared/utils/date";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ?? getTodayDateString();

  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const planData = await DailyPlanningService.getPlanWithItems(session.user.id, date);
    return NextResponse.json(planData);
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
