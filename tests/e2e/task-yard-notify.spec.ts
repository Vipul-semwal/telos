import { expect, test } from "@playwright/test";

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const username = `e2e_yard_${suffix}`;
const password = `E2eYard!${suffix}`;

function localSchedule() {
  const now = new Date();
  return {
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

async function showDue(page: import("@playwright/test").Page, title: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const heading = page.getByRole("heading", { name: title, exact: true });
    if (await heading.isVisible().catch(() => false)) return heading;
    const next = page.getByRole("button", { name: "Next", exact: true });
    if ((await next.count()) === 0 || (await next.isDisabled())) break;
    await next.click({ force: true, timeout: 5_000 }).catch(() => {});
  }
  throw new Error(`Due notification not found: ${title}`);
}

test.describe.serial("Task Yard, Notify, and Cockpit integration", () => {
  test.setTimeout(180_000);

  test.afterAll(async () => {
    const [{ db }, { user }, { eq }] = await Promise.all([
      import("@/infrastructure/database"),
      import("@/modules/auth/schema"),
      import("drizzle-orm"),
    ]);
    await db.delete(user).where(eq(user.username, username));
  });

  test("runs the complete shared notification journey", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create workspace" }).click();
    await page.waitForURL("/");

    await page.getByRole("link", { name: "Create discipline" }).click();
    await page.getByRole("button", { name: "New discipline" }).click();
    let dialog = page.getByRole("dialog", { name: "New discipline" });
    await dialog.getByLabel("Discipline name").fill("Task Yard E2E");
    await dialog.getByRole("button", { name: "Create discipline" }).click();
    await expect(page.getByRole("heading", { name: "Task Yard E2E" })).toBeVisible();

    await page.goto("/projects");
    await page.getByRole("button", { name: "New project" }).click();
    dialog = page.getByRole("dialog", { name: "New project" });
    await dialog.getByLabel("Project name").fill("Recall Project");
    await dialog.getByRole("button", { name: "Create project" }).click();
    await page.getByRole("link", { name: "Recall Project" }).click();
    await page.getByRole("button", { name: /^Tasks \(/ }).click();
    await page.getByPlaceholder("Quick add a task and press Enter").fill("Study TCP");
    await page.getByPlaceholder("Quick add a task and press Enter").press("Enter");
    await page.getByRole("link", { name: "Open Task Yard for Study TCP" }).click();

    await page.getByLabel("Task Yard TL;DR").fill("TCP establishes reliable streams.");
    await page.getByRole("button", { name: "Save TL;DR" }).click();
    await page.reload();
    await expect(page.getByLabel("Task Yard TL;DR")).toHaveValue(
      "TCP establishes reliable streams.",
    );
    await page.getByLabel("Task Yard TL;DR").fill(
      "TCP establishes reliable streams through sequencing and acknowledgements.",
    );
    await page.getByRole("button", { name: "Save TL;DR" }).click();

    await page.getByRole("button", { name: "New note" }).click();
    dialog = page.getByRole("dialog", { name: "New note" });
    await dialog.getByLabel("Title (optional)").fill("Handshake");
    const editor = dialog.getByRole("textbox", { name: "Rich text note" });
    await editor.evaluate((element) => {
      element.innerHTML = "<p><strong>SYN</strong>, SYN-ACK, ACK</p>";
      element.dispatchEvent(new InputEvent("input", { bubbles: true }));
    });
    await dialog.getByRole("button", { name: "Save note" }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Handshake" })).toBeVisible();
    await expect(page.getByText("SYN-ACK", { exact: false })).toBeVisible();
    const noteCard = page
      .getByRole("heading", { name: "Handshake" })
      .locator("xpath=ancestor::div[contains(@class,'surface-panel')][1]");
    await noteCard.getByRole("button", { name: "Edit" }).click();
    dialog = page.getByRole("dialog", { name: "Edit note" });
    const editEditor = dialog.getByRole("textbox", { name: "Rich text note" });
    await editEditor.evaluate((element) => {
      element.innerHTML = "<p><strong>SYN</strong>, SYN-ACK, ACK, then data.</p>";
      element.dispatchEvent(new InputEvent("input", { bubbles: true }));
    });
    await dialog.getByRole("button", { name: "Save note" }).click();
    await page.reload();
    await expect(page.getByText("then data", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "New card" }).click();
    dialog = page.getByRole("dialog", { name: "New recall card" });
    await dialog.getByLabel("Title").fill("TCP handshake");
    await dialog.getByLabel("Front / question").fill("What are the handshake steps?");
    await dialog.getByLabel("Back / answer").fill("SYN, SYN-ACK, ACK");
    await dialog.getByRole("button", { name: "Save card" }).click();
    await expect(page.getByRole("heading", { name: "TCP handshake" })).toBeVisible();

    const card = page
      .getByRole("heading", { name: "TCP handshake" })
      .locator("xpath=ancestor::div[contains(@class,'surface-panel')][1]");
    await card.getByRole("button", { name: "Study" }).click();
    dialog = page.getByRole("dialog", { name: "TCP handshake" });
    await dialog.getByRole("button", { name: "Reveal answer" }).click();
    await expect(dialog.getByText("SYN, SYN-ACK, ACK")).toBeVisible();
    await dialog.getByRole("button", { name: "Remembered" }).click();

    await card.getByRole("button", { name: "Schedule" }).click();
    dialog = page.getByRole("dialog", { name: "Schedule TCP handshake" });
    const schedule = localSchedule();
    await dialog.getByLabel("Date", { exact: true }).fill(schedule.date);
    await dialog.getByLabel("Time", { exact: true }).fill(schedule.time);
    await dialog.getByLabel("Timezone", { exact: true }).fill(schedule.timezone);
    await dialog.getByRole("button", { name: "Schedule for Cockpit" }).click();

    await page.getByRole("button", { name: "New card" }).click();
    dialog = page.getByRole("dialog", { name: "New recall card" });
    await dialog.getByLabel("Card type").selectOption("reminder");
    await dialog.getByLabel("Title").fill("Review retransmission");
    await dialog.getByLabel("Reminder message").fill("Check retransmission timeout behavior.");
    await dialog.getByRole("button", { name: "Save card" }).click();
    const reminderCard = page
      .getByRole("heading", { name: "Review retransmission" })
      .locator("xpath=ancestor::div[contains(@class,'surface-panel')][1]");
    await reminderCard.getByRole("button", { name: "Schedule" }).click();
    dialog = page.getByRole("dialog", { name: "Schedule Review retransmission" });
    await dialog.getByLabel("Date", { exact: true }).fill(schedule.date);
    await dialog.getByLabel("Time", { exact: true }).fill(schedule.time);
    await dialog.getByLabel("Timezone", { exact: true }).fill(schedule.timezone);
    await dialog.getByRole("button", { name: "Schedule for Cockpit" }).click();

    await page.goto("/notify");
    await page.getByRole("button", { name: "Create notification" }).first().click();
    dialog = page.getByRole("dialog", { name: "Create notification" });
    await dialog.getByLabel("Title").fill("Standalone stretch");
    await dialog.getByLabel("Date", { exact: true }).fill(schedule.date);
    await dialog.getByLabel("Time", { exact: true }).fill(schedule.time);
    await dialog.getByLabel("Timezone", { exact: true }).fill(schedule.timezone);
    await dialog.getByRole("button", { name: "Create notification" }).click();
    await expect(page.getByRole("heading", { name: "Standalone stretch" })).toBeVisible();
    const standaloneRow = page
      .getByRole("heading", { name: "Standalone stretch" })
      .locator("xpath=ancestor::div[contains(@class,'surface-panel')][1]");
    await standaloneRow.getByRole("button", { name: "Edit / reschedule" }).click();
    dialog = page.getByRole("dialog", { name: "Edit notification" });
    await dialog.getByLabel("Title").fill("Standalone stretch edited");
    await dialog.getByRole("button", { name: "Save and reschedule" }).click();
    await expect(page.getByRole("heading", { name: "Standalone stretch edited" })).toBeVisible();

    await page.getByRole("button", { name: "Create notification" }).first().click();
    dialog = page.getByRole("dialog", { name: "Create notification" });
    await dialog.getByLabel("Title").fill("Daily review");
    await dialog.getByLabel("Repeat").selectOption("daily");
    await dialog.getByRole("button", { name: "Create notification" }).click();
    await expect(page.getByRole("heading", { name: "Daily review" })).toBeVisible();
    const dailyRow = page
      .getByRole("heading", { name: "Daily review" })
      .locator("xpath=ancestor::div[contains(@class,'surface-panel')][1]");
    await dailyRow.getByRole("button", { name: "Pause" }).click();
    await expect(dailyRow.getByRole("button", { name: "Resume" })).toBeVisible();
    await dailyRow.getByRole("button", { name: "Resume" }).click();
    await expect(dailyRow.getByRole("button", { name: "Pause" })).toBeVisible();
    await dailyRow.getByRole("button", { name: "End recurrence" }).click();

    await page.goto("/");
    await expect(page.getByText("Due now", { exact: false })).toBeVisible();
    await showDue(page, "Standalone stretch edited");
    await page.getByRole("button", { name: "Mark read" }).click();
    await expect(page.getByText("Read", { exact: true })).toBeVisible();
    await page.goto("/notify");
    const standaloneCard = page
      .getByRole("heading", { name: "Standalone stretch edited" })
      .locator("xpath=ancestor::div[contains(@class,'surface-panel')][1]");
    await expect(standaloneCard.getByText("active", { exact: true })).toBeVisible();

    await page.goto("/");
    await showDue(page, "TCP handshake");
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("button", { name: "Remembered" }).click();

    await page.reload({ waitUntil: "networkidle" });
    await showDue(page, "Review retransmission");
    await page.getByRole("button", { name: "Resolve reminder" }).click();

    await page.reload({ waitUntil: "networkidle" });
    await showDue(page, "Standalone stretch edited");
    await page.getByRole("link", { name: "Open source" }).click();
    await expect(page).toHaveURL(/\/notify/);

    await page.goto("/");
    await showDue(page, "Standalone stretch edited");
    const snoozeResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/notification-occurrences/") &&
        response.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "Snooze 10m" }).click();
    expect((await snoozeResponse).ok()).toBe(true);
    await page.waitForTimeout(300);
    await expect(
      page.getByRole("heading", { name: "Standalone stretch edited", exact: true }),
    ).not.toBeVisible();

    await page.goto("/notify");
    await expect(page.getByRole("heading", { name: "Notification history" })).toBeVisible();
  });
});
