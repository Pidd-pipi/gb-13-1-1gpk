import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { PurchaseRequest } from '../entities/PurchaseRequest';
import { PurchaseSubscription } from '../entities/PurchaseSubscription';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 订阅到货提醒：每人每条求购只留一份（唯一索引兜底）
export const subscribeRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    const requestRepository = AppDataSource.getRepository(PurchaseRequest);
    const request = await requestRepository.findOne({ where: { id } });

    if (!request) {
      return res.status(404).json({ message: '求购信息不存在' });
    }
    if (request.status !== 'active') {
      return res.status(400).json({ message: '求购已关闭，无法订阅' });
    }

    const subscriptionRepository = AppDataSource.getRepository(PurchaseSubscription);
    const existing = await subscriptionRepository.findOne({
      where: { userId, requestId: id },
    });

    if (existing) {
      return res.status(200).json({ message: '已订阅到货提醒', subscribed: true, subscriptionId: existing.id });
    }

    const subscription = subscriptionRepository.create({ userId, requestId: id });
    await subscriptionRepository.save(subscription);

    res.status(201).json({ message: '订阅成功，到货后将提醒你', subscribed: true, subscriptionId: subscription.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '订阅失败' });
  }
};

// 退订
export const unsubscribeRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const subscriptionRepository = AppDataSource.getRepository(PurchaseSubscription);
    await subscriptionRepository.delete({ userId: req.userId!, requestId: id });

    res.json({ message: '已退订到货提醒', subscribed: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '退订失败' });
  }
};

// 我订阅了哪些求购（用于卡片展示订阅状态），返回订阅记录
export const getMySubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriptionRepository = AppDataSource.getRepository(PurchaseSubscription);
    const subscriptions = await subscriptionRepository.find({
      where: { userId: req.userId! },
      order: { createdAt: 'DESC' },
    });

    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取订阅信息失败' });
  }
};
