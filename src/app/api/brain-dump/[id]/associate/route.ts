import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { associateBrainDumpSchema } from "@/modules/brain-dump/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function POST(
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
    const validated = associateBrainDumpSchema.parse(body);

    const updated = await BrainDumpService.associate(
      session.user.id,
      id,
      validated,
    );
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
