import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Stores extends BaseEntity {
  @PrimaryGeneratedColumn()
  storeId: number;

  @Column()
  storeName: string;

  @Column()
  description: string;

  @Column()
  category: string;

  @Column()
  maxWaitingCnt: number;

  @Column()
  currentWaitingCnt: number;

  @Column()
  La: number;

  @Column()
  Ma: number;

  @Column({ default: 60 })
  cycleTime: number;

  @Column()
  tableForTwo: number;

  @Column()
  tableForFour: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
