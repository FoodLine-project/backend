import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WaitingStatus } from './waitingStatus.enum';

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
}
