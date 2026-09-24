import request from './request';
import type { ArrivalNotification } from '@/types';

export const getMyNotifications = () => {
  return request.get<ArrivalNotification[]>('/my/notifications');
};

export const getUnreadNotificationCount = () => {
  return request.get<{ count: number }>('/my/notifications/unread-count');
};

export const markNotificationRead = (id: string) => {
  return request.put(`/my/notifications/${id}/read`);
};

export const markAllNotificationsRead = () => {
  return request.put('/my/notifications/read-all');
};
