import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { TaskYardService } from "@/modules/task-yard/service";
import { taskYardNoteSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await requireAuth();
    const { id, noteId } = await params;
    const input = taskYardNoteSchema.parse(await request.json());
    const note = await TaskYardService.updateNote(session.user.id, id, noteId, input);
    return NextResponse.json({ note });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await requireAuth();
    const { id, noteId } = await params;
    await TaskYardService.deleteNote(session.user.id, id, noteId);
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
