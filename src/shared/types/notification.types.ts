import type { Notification } from "./common.types";

export type NotificationItem = Notification;

export interface BroadcastResult {
  ok: boolean;
  count: number;
}
