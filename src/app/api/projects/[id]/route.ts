import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { ProjectsService } from "@/modules/projects/service";
import { updateProjectSchema } from "@/modules/projects/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    const project = await ProjectsService.getByIdWithDetails(userId, id);
    return NextResponse.json({ data: project });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const updated = await ProjectsService.update(userId, id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
