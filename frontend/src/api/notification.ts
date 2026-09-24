import request from './request';
import type { StockNotification } from '@/types';

export const getNotifications = (params?: { unreadOnly?: boolean }) => {
  return request.get<StockNotification[]>('/notifications', { params });
};

export const getUnreadNotificationCount = () => {
  return request.get<{ count: number }>('/notifications/unread-count');
};

export const markNotificationRead = (id: string) => {
  return request.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return request.put('/notifications/read-all');
};
