import { expect, test } from "@playwright/test";

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const username = `e2e_plan_${suffix}`;
const password = `E2ePlan!${suffix}`;
const projectTitle = `Planning Project ${suffix}`;

test.describe("Daily planning project picker", () => {
  test.setTimeout(120_000);

  test.afterAll(async () => {
    const [{ db }, { user }, { eq }] = await Promise.all([
      import("@/infrastructure/database"),
      import("@/modules/auth/schema"),
      import("drizzle-orm"),
    ]);
    await db.delete(user).where(eq(user.username, username));
  });

  test("groups eligible tasks by project and filters completed work", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create workspace" }).click();
    await page.waitForURL("/");

    const [
      { db },
      { user },
      { disciplines },
      { projects },
      { tasks },
      { eq },
    ] = await Promise.all([
      import("@/infrastructure/database"),
      import("@/modules/auth/schema"),
      import("@/modules/disciplines/schema"),
      import("@/modules/projects/schema"),
      import("@/modules/tasks/schema"),
      import("drizzle-orm"),
    ]);

    const [account] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username));
    const [discipline] = await db
      .insert(disciplines)
      .values({ userId: account.id, title: `Planning Discipline ${suffix}` })
      .returning();
    const [project] = await db
      .insert(projects)
      .values({
        userId: account.id,
        disciplineId: discipline.id,
        title: projectTitle,
      })
      .returning();
    await db.insert(tasks).values([
      {
        userId: account.id,
        projectId: project.id,
        title: "Open planning task",
        priority: "high",
        estimatedDurationSeconds: 1800,
      },
      {
        userId: account.id,
        projectId: project.id,
        title: "Completed planning task",
        status: "completed",
      },
      {
        userId: account.id,
        projectId: project.id,
        title: "Cancelled planning task",
        status: "cancelled",
      },
    ]);

    await page.goto("/daily-planning");
    await expect(page.getByRole("heading", { name: "Choose a project" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(projectTitle) }),
    ).toContainText("1 available");
    await expect(page.getByText("Open planning task", { exact: true })).not.toBeVisible();

    await page.getByRole("button", { name: new RegExp(projectTitle) }).click();
    await expect(page.getByText("Open planning task", { exact: true })).toBeVisible();
    await expect(page.getByText("Completed planning task", { exact: true })).not.toBeVisible();
    await expect(page.getByText("Cancelled planning task", { exact: true })).not.toBeVisible();

    const search = page.getByRole("searchbox", { name: `Search tasks in ${projectTitle}` });
    await search.fill("missing");
    await expect(page.getByRole("heading", { name: "No tasks match these filters" })).toBeVisible();
    await search.fill("Open");
    await expect(page.getByText("Open planning task", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(page.getByText("Task added to today's plan.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's queue" })).toBeVisible();
    await expect(page.getByText("Open planning task", { exact: true })).toBeVisible();
  });
});
