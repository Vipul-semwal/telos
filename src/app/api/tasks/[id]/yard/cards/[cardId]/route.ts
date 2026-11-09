import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { TaskYardService } from "@/modules/task-yard/service";
import { updateRecallCardSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    const session = await requireAuth();
    const { id, cardId } = await params;
    const input = updateRecallCardSchema.parse(await request.json());
    const card = await TaskYardService.updateCard(session.user.id, id, cardId, input);
    return NextResponse.json({ card });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    const session = await requireAuth();
    const { id, cardId } = await params;
    await TaskYardService.deleteCard(session.user.id, id, cardId);
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
