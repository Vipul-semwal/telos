import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { manualSessionSchema } from "@/modules/time-tracking/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = manualSessionSchema.parse(body);

    const created = await TimeTrackingService.logManualSession(session.user.id, validated);
    return NextResponse.json({ session: created }, { status: 201 });
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
