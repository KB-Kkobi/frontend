import { get, patch, remove } from "@/api/http";

const NOTIFICATIONS_PATH = "/api/notifications";

export function fetchNotifications() {
  return get(NOTIFICATIONS_PATH);
}

export function fetchUnreadCount() {
  return get(`${NOTIFICATIONS_PATH}/unread-count`);
}

export function markNotificationRead(notificationId) {
  return patch(`${NOTIFICATIONS_PATH}/${notificationId}/read`);
}

export function markAllNotificationsRead() {
  return patch(`${NOTIFICATIONS_PATH}/read-all`);
}

export function deleteAllNotifications() {
  return remove(NOTIFICATIONS_PATH);
}

export function fetchNotificationSettings() {
  return get(`${NOTIFICATIONS_PATH}/settings`);
}

export function updateNotificationSettings(partialSettings) {
  return patch(`${NOTIFICATIONS_PATH}/settings`, partialSettings);
}
