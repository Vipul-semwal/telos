import { NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stopped = await TimeTrackingService.stopTimer(session.user.id);
    return NextResponse.json({ session: stopped });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
