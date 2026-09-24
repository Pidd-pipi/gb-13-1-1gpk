import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Index, Unique, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { PurchaseRequest } from './PurchaseRequest';
import { Book } from './Book';

@Entity('arrival_notifications')
// 同一本书对同一次订阅只提醒一条
@Unique(['subscriptionId', 'bookId'])
export class ArrivalNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Index('idx_arrival_user')
  userId: string;

  // 退订后订阅可能被删除，这里只存 id，不建外键，历史通知仍可查看
  @Column()
  subscriptionId: string;

  @ManyToOne(() => PurchaseRequest, { onDelete: 'CASCADE' })
  request: PurchaseRequest;

  @Column()
  @Index('idx_arrival_request')
  requestId: string;

  @ManyToOne(() => Book, { nullable: true, onDelete: 'SET NULL' })
  book: Book | null;

  @Column({ nullable: true })
  bookId: string | null;

  @Column({ default: false })
  @Index('idx_arrival_read')
  isRead: boolean;

  @CreateDateColumn()
  @Index('idx_arrival_created')
  createdAt: Date;
}
