import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { PurchaseRequest } from '../entities/PurchaseRequest';
import { RequestSubscription } from '../entities/RequestSubscription';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/** 订阅求购到货提醒，每人每条求购只保留一份 */
export const subscribeRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  const requestRepository = AppDataSource.getRepository(PurchaseRequest);
  const request = await requestRepository.findOne({ where: { id } });

  if (!request) {
    return res.status(404).json({ message: '求购信息不存在' });
  }

  if (request.status !== 'active') {
    return res.status(400).json({ message: '求购信息已关闭，无法订阅' });
  }

  if (request.requesterId === userId) {
    return res.status(400).json({ message: '不能订阅自己发布的求购' });
  }

  const subscriptionRepository = AppDataSource.getRepository(RequestSubscription);
  const existing = await subscriptionRepository.findOne({
    where: { userId, requestId: id },
  });

  if (existing) {
    return res.status(200).json({ message: '已订阅该求购', subscribed: true });
  }

  const subscription = subscriptionRepository.create({ userId, requestId: id });
  await subscriptionRepository.save(subscription);

  res.status(201).json({ message: '订阅成功，到货后会第一时间提醒你', subscribed: true });
};

/** 退订求购到货提醒 */
export const unsubscribeRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  const subscriptionRepository = AppDataSource.getRepository(RequestSubscription);
  await subscriptionRepository.delete({ userId, requestId: id });

  res.json({ message: '已取消订阅', subscribed: false });
};

/** 我的订阅列表 */
export const getMySubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  const subscriptionRepository = AppDataSource.getRepository(RequestSubscription);
  const subscriptions = await subscriptionRepository.find({
    where: { userId: req.userId },
    relations: ['request'],
    order: { createdAt: 'DESC' },
  });

  res.json(subscriptions);
};
