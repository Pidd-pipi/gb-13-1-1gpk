import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { StockNotification } from '../entities/StockNotification';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/** 我的到货提醒列表 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const { unreadOnly } = req.query;
  const userId = req.userId!;

  const notificationRepository = AppDataSource.getRepository(StockNotification);
  const notifications = await notificationRepository.find({
    where: {
      userId,
      ...(unreadOnly === 'true' ? { isRead: false } : {}),
    },
    relations: ['request', 'book'],
    order: { createdAt: 'DESC' },
  });

  res.json(notifications);
};

/** 未读到货提醒数量 */
export const getUnreadNotificationCount = async (req: AuthenticatedRequest, res: Response) => {
  const notificationRepository = AppDataSource.getRepository(StockNotification);
  const count = await notificationRepository.count({
    where: { userId: req.userId, isRead: false },
  });

  res.json({ count });
};

/** 标记单条到货提醒为已读 */
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const notificationRepository = AppDataSource.getRepository(StockNotification);
  const notification = await notificationRepository.findOne({ where: { id } });

  if (!notification) {
    return res.status(404).json({ message: '提醒不存在' });
  }

  if (notification.userId !== req.userId) {
    return res.status(403).json({ message: '无权限操作' });
  }

  notification.isRead = true;
  await notificationRepository.save(notification);

  res.json({ message: '已标记为已读' });
};

/** 全部标记为已读 */
export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  const notificationRepository = AppDataSource.getRepository(StockNotification);
  await notificationRepository.update({ userId: req.userId, isRead: false }, { isRead: true });

  res.json({ message: '全部已标记为已读' });
};
