import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, Unique } from 'typeorm';
import { User } from './User';
import { Book } from './Book';
import { PurchaseRequest } from './PurchaseRequest';
import { RequestSubscription } from './RequestSubscription';

@Entity('stock_notifications')
@Unique('uq_notification_subscription_book', ['subscriptionId', 'bookId'])
export class StockNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.stockNotifications)
  user: User;

  @Column()
  @Index('idx_notification_user')
  userId: string;

  // 退订后历史提醒仍保留，关联置空即可
  @ManyToOne(() => RequestSubscription, subscription => subscription.notifications, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  subscription: RequestSubscription | null;

  @Column({ nullable: true })
  @Index('idx_notification_subscription')
  subscriptionId: string | null;

  @ManyToOne(() => PurchaseRequest, { nullable: true, onDelete: 'SET NULL' })
  request: PurchaseRequest | null;

  @Column({ nullable: true })
  requestId: string | null;

  // 书籍被删除后提醒记录仍保留，只是无法再打开关联书籍
  @ManyToOne(() => Book, { nullable: true, onDelete: 'SET NULL' })
  book: Book | null;

  @Column({ nullable: true })
  @Index('idx_notification_book')
  bookId: string | null;

  @Column()
  content: string;

  @Column({ default: false })
  @Index('idx_notification_is_read')
  isRead: boolean;

  @CreateDateColumn()
  @Index('idx_notification_created')
  createdAt: Date;
}
