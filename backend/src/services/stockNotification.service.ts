import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';
import { PurchaseRequest } from '../entities/PurchaseRequest';
import { RequestSubscription } from '../entities/RequestSubscription';
import { StockNotification } from '../entities/StockNotification';

/** 归一化文本：去除首尾及多余空白、转小写，用于书名/作者比较 */
const normalizeText = (value?: string | null): string =>
  (value || '').replace(/\s+/g, '').trim().toLowerCase();

/** 归一化 ISBN：去除连字符与空白后转小写 */
const normalizeIsbn = (value?: string | null): string =>
  (value || '').replace(/[-\s]+/g, '').trim().toLowerCase();

const isBookMatchRequest = (book: Book, request: PurchaseRequest): boolean => {
  // 校区必须一致
  if (normalizeText(book.campus) !== normalizeText(request.campus)) {
    return false;
  }

  // 售价不得高于期望价；未填写期望价时不限制价格
  if (request.expectedPrice != null && Number(book.price) > Number(request.expectedPrice)) {
    return false;
  }

  // 求购写了 ISBN：以 ISBN 为准；没写 ISBN：改看书名和作者
  if (request.isbn) {
    return !!book.isbn && normalizeIsbn(book.isbn) === normalizeIsbn(request.isbn);
  }

  if (normalizeText(book.title) !== normalizeText(request.bookTitle)) {
    return false;
  }

  // 求购未填作者时只按书名匹配；填了作者则作者也要一致
  if (request.author) {
    return !!book.author && normalizeText(book.author) === normalizeText(request.author);
  }

  return true;
};

const buildContent = (book: Book, request: PurchaseRequest): string => {
  const priceText = `售价 ¥${Number(book.price)}`;
  return `你订阅的求购《${request.bookTitle}》有新货上架：${priceText}（${book.campus}校区），快去看看吧`;
};

/**
 * 卖家上架新书后，找出匹配的进行中求购订阅并生成到货提醒。
 * 匹配条件：校区一致、售价不高于期望价、ISBN 相同（未写 ISBN 时看书名和作者）。
 * 同一本书对同一次订阅只提醒一条。
 */
export const notifySubscribersForNewBook = async (book: Book): Promise<number> => {
  const subscriptionRepository = AppDataSource.getRepository(RequestSubscription);
  const notificationRepository = AppDataSource.getRepository(StockNotification);

  // 仅进行中的求购需要通知；卖家本人不收到自己上架书的提醒
  const subscriptions = await subscriptionRepository.find({
    relations: ['request'],
    where: { request: { status: 'active' } },
  });

  const matched = subscriptions.filter(
    (subscription) =>
      subscription.userId !== book.sellerId &&
      subscription.request &&
      isBookMatchRequest(book, subscription.request)
  );

  if (matched.length === 0) {
    return 0;
  }

  // 同一本书对同一次订阅只保留一条提醒，跳过已提醒过的订阅
  const existing = await notificationRepository.find({
    where: matched.map((subscription) => ({
      subscriptionId: subscription.id,
      bookId: book.id,
    })),
  });
  const existingKeys = new Set(existing.map((item) => `${item.subscriptionId}:${item.bookId}`));

  const notifications = matched
    .filter((subscription) => !existingKeys.has(`${subscription.id}:${book.id}`))
    .map((subscription) =>
      notificationRepository.create({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        requestId: subscription.requestId,
        bookId: book.id,
        content: buildContent(book, subscription.request),
      })
    );

  if (notifications.length > 0) {
    await notificationRepository.save(notifications);
  }

  return notifications.length;
};
