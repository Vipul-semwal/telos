import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { DisciplinesService } from "@/modules/disciplines/service";
import { createDisciplineSchema } from "@/modules/disciplines/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam === "active" || statusParam === "archived" ? statusParam : undefined;

    const disciplines = await DisciplinesService.list(session.user.id, status);
    return NextResponse.json({ disciplines });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const parsed = createDisciplineSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid discipline" },
        { status: 400 },
      );
    }

    const discipline = await DisciplinesService.create(session.user.id, parsed.data);
    return NextResponse.json({ discipline }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
