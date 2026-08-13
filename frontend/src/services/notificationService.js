import apiClient from './apiClient';

export async function listNotifications(params = {}) {
  const { data } = await apiClient.get('/notifications', { params });
  return { items: data.data, meta: data.meta };
}

export async function getUnreadCount() {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationAsRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data.data;
}
