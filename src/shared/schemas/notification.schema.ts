import { z } from "zod";

export const listNotificationsSchema = z
  .object({
    limit: z.number().int().positive().default(50),
  })
  .default({});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
