import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { NotifyService } from "@/modules/notifications/service";
import { createNotificationSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET() {
  try {
    const session = await requireAuth();
    return NextResponse.json(await NotifyService.list(session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const input = createNotificationSchema.parse(await request.json());
    const notification = await NotifyService.createNotification(session.user.id, input);
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Internal server error" },
    { status: 500 },
  );
}
