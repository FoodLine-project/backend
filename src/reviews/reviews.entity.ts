import { Stores } from 'src/stores/stores.entity';
import { Users } from 'src/users/users.entity';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Reviews extends BaseEntity {
  @PrimaryGeneratedColumn()
  reviewId: number;

  @Column()
  UserId: number;

  @Column()
  StoreId: number;

  @Column()
  review: string;

  @Column()
  rating: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;


  @ManyToOne(() => Stores, (store) => store.reviews)
  @JoinColumn({ name: 'StoreId' })
  store: Stores;

  @ManyToOne(() => Users, (user) => user.reviews)
  @JoinColumn({ name: 'UserId' })
  user: Users;
}
