import { table } from 'console';
import { Reviews } from 'src/reviews/reviews.entity';
import { Tables } from 'src/tables/tables.entity';
import { Waitings } from 'src/waitings/waitings.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
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

  @OneToMany(() => Waitings, (waiting) => waiting.store)
  waitings: Waitings[];

  @OneToMany(() => Reviews, (review) => review.store)
  reviews: Reviews[];

  @OneToOne(() => Tables, (table) => table.store)
  tables: Tables;
}
