import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { updateBrainDumpSchema } from "@/modules/brain-dump/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const item = await BrainDumpService.getById(session.user.id, id);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = updateBrainDumpSchema.parse(body);

    const updated = await BrainDumpService.update(session.user.id, id, validated);
    return NextResponse.json({ item: updated });
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
