import {
  router,
  protectedProcedure,
  adminProcedure,
} from "../trpc";
import { NotificationService } from "../services/notification.service";
import {
  listNotificationsSchema,
  broadcastNotificationSchema,
} from "@/shared/schemas/notification.schema";

export const notificationsRouter = router({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return NotificationService.getUnreadCount(ctx.db, ctx.user.id);
  }),

  list: protectedProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      return NotificationService.listNotifications(
        ctx.db,
        ctx.user.id,
        input.limit,
      );
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return NotificationService.markAllAsRead(ctx.db, ctx.user.id);
  }),

  broadcast: adminProcedure
    .input(broadcastNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      return NotificationService.broadcastAnnouncement(
        ctx.db,
        input.title,
        input.message,
      );
    }),
});
