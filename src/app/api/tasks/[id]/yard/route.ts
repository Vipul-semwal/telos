import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { TaskYardService } from "@/modules/task-yard/service";
import { taskYardTldrSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const workspace = await TaskYardService.getWorkspace(session.user.id, id);
    return NextResponse.json(workspace);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const input = taskYardTldrSchema.parse(await request.json());
    const yard = await TaskYardService.updateTldr(session.user.id, id, input.tldr);
    return NextResponse.json({ yard });
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
