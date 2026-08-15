import { and, desc, eq, not, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { notifications, users, type Notification } from "@/db/schema";
import type { BroadcastResult } from "@/shared/types/notification.types";

export class NotificationService {
  static async getUnreadCount(
    db: Database,
    userId: number,
  ): Promise<number> {
    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          not(notifications.read),
        ),
      );

    return Number(count) || 0;
  }

  static async listNotifications(
    db: Database,
    userId: number,
    limit = 50,
  ): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  static async markAllAsRead(
    db: Database,
    userId: number,
  ): Promise<{ ok: boolean }> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          not(notifications.read),
        ),
      );

    return { ok: true };
  }

  static async broadcastAnnouncement(
    db: Database,
    title: string,
    message: string,
  ): Promise<BroadcastResult> {
    const activeMembers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "member"));

    if (activeMembers.length === 0) {
      return { ok: true, count: 0 };
    }

    await db.insert(notifications).values(
      activeMembers.map((member) => ({
        userId: member.id,
        type: "announcement" as const,
        title,
        message,
      })),
    );

    return { ok: true, count: activeMembers.length };
  }
}
