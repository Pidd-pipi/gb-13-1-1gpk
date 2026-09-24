import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Index, Unique, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { PurchaseRequest } from './PurchaseRequest';

@Entity('purchase_subscriptions')
@Unique(['userId', 'requestId'])
export class PurchaseSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Index('idx_subscription_user')
  userId: string;

  @ManyToOne(() => PurchaseRequest, { onDelete: 'CASCADE' })
  request: PurchaseRequest;

  @Column()
  @Index('idx_subscription_request')
  requestId: string;

  @CreateDateColumn()
  createdAt: Date;
}
