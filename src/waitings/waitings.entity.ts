import { Users } from './../users/users.entity';
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
import { WaitingStatus } from './waitingStatus.enum';
import { Stores } from 'src/stores/stores.entity';

@Entity()
export class Waitings extends BaseEntity {
  @PrimaryGeneratedColumn()
  waitingId: number;

  @Column()
  StoreId: number;

  @Column()
  UserId: number;

  @Column({ default: WaitingStatus.WAITING })
  status: WaitingStatus;

  @Column()
  peopleCnt: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.waitings)
  @JoinColumn({ name: 'UserId' })
  user: Users;

  @ManyToOne(() => Stores, (store) => store.waitings)
  @JoinColumn({ name: 'StoreId' })
  store: Stores;
}
