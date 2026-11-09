import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { TaskYardService } from "@/modules/task-yard/service";
import { taskYardNoteSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const input = taskYardNoteSchema.parse(await request.json());
    const note = await TaskYardService.createNote(session.user.id, id, input);
    return NextResponse.json({ note }, { status: 201 });
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
