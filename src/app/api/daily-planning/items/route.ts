import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { addTaskToPlanSchema } from "@/modules/daily-planning/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = addTaskToPlanSchema.parse(body);

    const created = await DailyPlanningService.addTaskToPlan(session.user.id, validated);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
