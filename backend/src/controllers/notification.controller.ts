import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { ArrivalNotification } from '../entities/ArrivalNotification';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 我的到货提醒列表（未读在前，新的在前）
export const getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationRepository = AppDataSource.getRepository(ArrivalNotification);
    const notifications = await notificationRepository.find({
      where: { userId: req.userId! },
      relations: ['book', 'request'],
      order: { isRead: 'ASC', createdAt: 'DESC' },
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取到货提醒失败' });
  }
};

// 未读数
export const getUnreadNotificationCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationRepository = AppDataSource.getRepository(ArrivalNotification);
    const count = await notificationRepository.count({
      where: { userId: req.userId!, isRead: false },
    });

    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取未读数失败' });
  }
};

// 标记一条已读
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notificationRepository = AppDataSource.getRepository(ArrivalNotification);
    const notification = await notificationRepository.findOne({ where: { id } });

    if (!notification) {
      return res.status(404).json({ message: '提醒不存在' });
    }
    if (notification.userId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notificationRepository.save(notification);
    }

    res.json({ message: '已标记为已读' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '操作失败' });
  }
};

// 全部标记已读
export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationRepository = AppDataSource.getRepository(ArrivalNotification);
    await notificationRepository.update(
      { userId: req.userId!, isRead: false },
      { isRead: true }
    );

    res.json({ message: '已全部标记为已读' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '操作失败' });
  }
};
