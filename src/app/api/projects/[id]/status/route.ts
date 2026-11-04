import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { ProjectsService } from "@/modules/projects/service";
import { projectStatusTransitionSchema } from "@/modules/projects/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    const body = await req.json();
    const parsed = projectStatusTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    const { status } = parsed.data;
    let result;
    if (status === "paused") {
      result = await ProjectsService.pause(userId, id);
    } else if (status === "completed") {
      result = await ProjectsService.complete(userId, id);
    } else if (status === "archived") {
      result = await ProjectsService.archive(userId, id);
    } else if (status === "active") {
      result = await ProjectsService.restore(userId, id, "active");
    } else {
      result = await ProjectsService.update(userId, id, { status });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
