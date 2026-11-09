import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/infrastructure/authentication/session";
import { NotifyService } from "@/modules/notifications/service";
import { NotFoundError } from "@/shared/errors/domain-error";

const actions = ["pause", "resume", "complete", "end"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = (await request.json()) as { action?: string };
    if (!actions.includes(body.action as (typeof actions)[number])) {
      return NextResponse.json({ error: "Unsupported notification action" }, { status: 400 });
    }
    if (body.action === "pause") await NotifyService.pause(session.user.id, id);
    if (body.action === "resume") await NotifyService.resume(session.user.id, id);
    if (body.action === "complete") await NotifyService.complete(session.user.id, id);
    if (body.action === "end") await NotifyService.endRecurrence(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
