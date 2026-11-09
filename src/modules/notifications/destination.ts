import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { notificationDeliveries } from "./schema";

type DeliveryWriter = Pick<typeof db, "insert">;

export interface NotificationDestination {
  readonly id: string;
  deliver(userId: string, occurrenceId: string, writer?: DeliveryWriter): Promise<void>;
  markRead(userId: string, occurrenceId: string): Promise<void>;
}

class CockpitDestination implements NotificationDestination {
  readonly id = "cockpit";

  async deliver(userId: string, occurrenceId: string, writer: DeliveryWriter = db) {
    await writer
      .insert(notificationDeliveries)
      .values({
        userId,
        occurrenceId,
        destination: this.id,
        status: "pending",
      })
      .onConflictDoNothing();
  }

  async markRead(userId: string, occurrenceId: string) {
    const now = new Date();
    await db
      .update(notificationDeliveries)
      .set({ status: "read", readAt: now, updatedAt: now })
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          eq(notificationDeliveries.occurrenceId, occurrenceId),
          eq(notificationDeliveries.destination, this.id),
        ),
      );
  }
}

export const cockpitDestination = new CockpitDestination();

export const notificationDestinations: Record<string, NotificationDestination> = {
  cockpit: cockpitDestination,
};
