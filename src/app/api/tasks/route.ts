import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/infrastructure/authentication/session";
import { TasksService } from "@/modules/tasks/service";
import { createTaskSchema, taskStatusEnum, taskPriorityEnum } from "@/modules/tasks/validation";
import { DomainError } from "@/shared/errors/domain-error";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;
  const parentTaskIdParam = searchParams.get("parentTaskId");
  const parentTaskId =
    parentTaskIdParam === "null" ? null : parentTaskIdParam || undefined;
  const statusParam = searchParams.get("status");
  const statusParsed = taskStatusEnum.safeParse(statusParam);
  const status = statusParsed.success ? statusParsed.data : undefined;

  const priorityParam = searchParams.get("priority");
  const priorityParsed = taskPriorityEnum.safeParse(priorityParam);
  const priority = priorityParsed.success ? priorityParsed.data : undefined;

  const search = searchParams.get("search") || undefined;
  const withSubtasks = searchParams.get("withSubtasks") === "true";

  try {
    if (withSubtasks && projectId) {
      const tasksWithChildren = await TasksService.listWithSubtasks(
        session.user.id,
        projectId,
        { status, priority, search },
      );
      return NextResponse.json({ tasks: tasksWithChildren });
    }

    const tasksList = await TasksService.list(session.user.id, {
      projectId,
      parentTaskId,
      status,
      priority,
      search,
    });
    return NextResponse.json({ tasks: tasksList });
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
    const validated = createTaskSchema.parse(body);

    const created = await TasksService.create(session.user.id, validated);
    return NextResponse.json({ task: created }, { status: 201 });
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
