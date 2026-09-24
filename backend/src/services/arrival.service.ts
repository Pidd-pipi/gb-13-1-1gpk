import { In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';
import { PurchaseRequest } from '../entities/PurchaseRequest';
import { PurchaseSubscription } from '../entities/PurchaseSubscription';
import { ArrivalNotification } from '../entities/ArrivalNotification';

/**
 * ISBN 归一化：去掉连字符和空白后转大写，避免排版差异导致匹配失败。
 * 例：978-7-111-40701-0 → 9787111407010
 */
const normalizeIsbn = (isbn: string | null | undefined): string =>
  (isbn || '').replace(/[-\s]/g, '').toUpperCase();

/**
 * 书名/作者归一化：去首尾空白后转小写。
 * 与查询中使用的 LOWER(TRIM(...)) 口径保持一致。
 */
const normalizeText = (text: string | null | undefined): string =>
  (text || '').trim().toLowerCase();

/**
 * 卖家上架新书后，找出与该书匹配、且仍开放中的求购，给全部订阅者发一条到货提醒。
 *
 * 匹配条件（同时满足）：
 * 1. 求购处于开放（active）状态，关闭后不再通知；
 * 2. 校区一致；
 * 3. 求购填写了期望价时，售价不高于期望价；未填则不限制；
 * 4. 求购写了 ISBN：ISBN 相同即匹配；
 *    求购没写 ISBN：书名和作者都相同才匹配。
 *
 * 同一本书对同一次订阅只提醒一条（由 arrival_notifications 上的唯一索引保证，
 * 这里配合 INSERT IGNORE 处理并发）。
 *
 * 该过程失败不应影响卖家发布书籍的原流程，因此所有调用方都需 catch。
 */
export const notifyArrivalSubscribers = async (book: Book): Promise<void> => {
  const requestRepository = AppDataSource.getRepository(PurchaseRequest);
  const subscriptionRepository = AppDataSource.getRepository(PurchaseSubscription);
  const notificationRepository = AppDataSource.getRepository(ArrivalNotification);

  const price = Number(book.price);
  const bookIsbn = normalizeIsbn(book.isbn);
  const bookTitle = normalizeText(book.title);
  const bookAuthor = normalizeText(book.author);

  const qb = requestRepository
    .createQueryBuilder('request')
    .where('request.status = :status', { status: 'active' })
    .andWhere('request.campus = :campus', { campus: book.campus })
    // 期望价为空表示不限价；显式 CAST 避免 decimal 与字符串参数的隐式类型转换
    .andWhere('(request.expectedPrice IS NULL OR request.expectedPrice >= CAST(:price AS DECIMAL(10,2)))', {
      price,
    })
    // 订阅者无需收到自己上架的书的提醒
    .andWhere('request.requesterId != :sellerId', { sellerId: book.sellerId });

  if (bookIsbn) {
    // 双方都写了 ISBN 且一致，或求购没写 ISBN 时改看书名和作者
    qb.andWhere(
      '(REPLACE(REPLACE(UPPER(request.isbn), "-", ""), " ", "") = :bookIsbn OR ' +
        '( (request.isbn IS NULL OR request.isbn = "") AND ' +
        'LOWER(TRIM(request.bookTitle)) = :bookTitle AND LOWER(TRIM(request.author)) = :bookAuthor ))',
      { bookIsbn, bookTitle, bookAuthor }
    );
  } else {
    // 上架书籍没有 ISBN，只能走书名 + 作者
    qb.andWhere('(request.isbn IS NULL OR request.isbn = "")')
      .andWhere('LOWER(TRIM(request.bookTitle)) = :bookTitle', { bookTitle })
      .andWhere('LOWER(TRIM(request.author)) = :bookAuthor', { bookAuthor });
  }

  const matchedRequests = await qb.getMany();
  if (matchedRequests.length === 0) {
    return;
  }

  const requestIds = matchedRequests.map((r) => r.id);
  const subscriptions = await subscriptionRepository.find({
    where: { requestId: In(requestIds) },
  });
  if (subscriptions.length === 0) {
    return;
  }

  // 每个订阅者 × 其订阅的求购，一条提醒；重复行（并发/重复上架场景）由唯一索引忽略
  const rows = subscriptions.map((sub) => ({
    userId: sub.userId,
    subscriptionId: sub.id,
    requestId: sub.requestId,
    bookId: book.id,
    isRead: false,
  }));

  await notificationRepository
    .createQueryBuilder()
    .insert()
    .into(ArrivalNotification)
    .values(rows)
    .orIgnore()
    .execute();
};
