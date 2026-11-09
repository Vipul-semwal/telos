import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { BrainDumpService } from "@/modules/brain-dump/service";
import { createBrainDumpSchema, listBrainDumpQuerySchema } from "@/modules/brain-dump/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = listBrainDumpQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    kind: searchParams.get("kind") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid query" },
      { status: 400 },
    );
  }

  try {
    const items = await BrainDumpService.list(session.user.id, parsed.data);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createBrainDumpSchema.parse(body);

    const created = await BrainDumpService.create(session.user.id, validated);
    return NextResponse.json({ item: created }, { status: 201 });
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
