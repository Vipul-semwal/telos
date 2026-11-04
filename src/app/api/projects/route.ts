import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { ProjectsService } from "@/modules/projects/service";
import { createProjectSchema, type ProjectStatus } from "@/modules/projects/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const disciplineId = searchParams.get("disciplineId") || undefined;
    const status = (searchParams.get("status") as ProjectStatus) || undefined;

    const projectList = await ProjectsService.list(userId, disciplineId, status);
    return NextResponse.json({ data: projectList });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const created = await ProjectsService.create(userId, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
