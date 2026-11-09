import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { TaskYardService } from "@/modules/task-yard/service";
import { reviewCardSchema } from "@/modules/notifications/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  try {
    const session = await requireAuth();
    const { id, cardId } = await params;
    const input = reviewCardSchema.parse(await request.json());
    const review = await TaskYardService.reviewCard(session.user.id, id, cardId, input);
    return NextResponse.json({ review }, { status: 201 });
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
