import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { NotifyService } from "@/modules/notifications/service";
import { updateNotificationSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const input = updateNotificationSchema.parse(await request.json());
    const notification = await NotifyService.updateNotification(session.user.id, id, input);
    return NextResponse.json({ notification });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await NotifyService.delete(session.user.id, id);
    return NextResponse.json({ success: true });
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
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
