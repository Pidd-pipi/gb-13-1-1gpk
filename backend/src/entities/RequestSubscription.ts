import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, Index, Unique } from 'typeorm';
import { User } from './User';
import { PurchaseRequest } from './PurchaseRequest';
import { StockNotification } from './StockNotification';

@Entity('request_subscriptions')
@Unique('uq_subscription_user_request', ['userId', 'requestId'])
export class RequestSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.requestSubscriptions)
  user: User;

  @Column()
  @Index('idx_subscription_user')
  userId: string;

  @ManyToOne(() => PurchaseRequest, request => request.subscriptions)
  request: PurchaseRequest;

  @Column()
  @Index('idx_subscription_request')
  requestId: string;

  @OneToMany(() => StockNotification, notification => notification.subscription)
  notifications: StockNotification[];

  @CreateDateColumn()
  createdAt: Date;
}
