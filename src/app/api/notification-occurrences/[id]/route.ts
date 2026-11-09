import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { NotificationService } from "@/modules/notifications/service";
import { snoozeOccurrenceSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = (await request.json()) as {
      action?: "read" | "snooze" | "complete" | "dismiss";
      minutes?: number;
    };
    if (body.action === "read") {
      await NotificationService.markRead(session.user.id, id);
    } else if (body.action === "snooze") {
      const { minutes } = snoozeOccurrenceSchema.parse({ minutes: body.minutes });
      await NotificationService.snoozeOccurrence(session.user.id, id, minutes);
    } else if (body.action === "complete") {
      await NotificationService.completeOccurrence(session.user.id, id);
    } else if (body.action === "dismiss") {
      await NotificationService.dismissOccurrence(session.user.id, id);
    } else {
      return NextResponse.json({ error: "Unsupported occurrence action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
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
