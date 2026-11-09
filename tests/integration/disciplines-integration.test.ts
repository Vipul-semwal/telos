import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { DisciplinesService } from "@/modules/disciplines/service";
import { CapacityExceededError } from "@/shared/errors/domain-error";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_ID = `discipline-int-${SUFFIX}`;

describe("Disciplines lifecycle integration", () => {
  beforeAll(async () => {
    await db.insert(user).values({
      id: USER_ID,
      name: "Discipline Audit",
      email: `discipline-${SUFFIX}@telos.internal`,
      username: `discipline_${SUFFIX}`,
    });
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, USER_ID));
  });

  it("creates, edits, archives, and enforces active capacity on restore", async () => {
    const first = await DisciplinesService.create(USER_ID, {
      title: "First pursuit",
      description: "Initial description",
    });
    const second = await DisciplinesService.create(USER_ID, { title: "Second pursuit" });
    const third = await DisciplinesService.create(USER_ID, { title: "Third pursuit" });

    const edited = await DisciplinesService.update(USER_ID, first.id, {
      title: "First pursuit revised",
      description: "Revised description",
    });
    expect(edited.title).toBe("First pursuit revised");
    expect(edited.description).toBe("Revised description");

    const archived = await DisciplinesService.archive(USER_ID, third.id);
    expect(archived.status).toBe("archived");

    const fourth = await DisciplinesService.create(USER_ID, { title: "Fourth pursuit" });
    expect(fourth.status).toBe("active");

    await expect(
      DisciplinesService.update(USER_ID, third.id, { status: "active" }),
    ).rejects.toBeInstanceOf(CapacityExceededError);

    expect(second.status).toBe("active");
  });
});
