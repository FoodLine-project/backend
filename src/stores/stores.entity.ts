import { Users } from '../auth/users.entity';
import { Reviews } from '../reviews/reviews.entity';
import { Tables } from '../tables/tables.entity';
import { Waitings } from '../waitings/waitings.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  Point,
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

  @Column('numeric')
  La: number;

  @Column('numeric')
  Ma: number;

  @Column()
  address: string;

  @Column({ nullable: true })
  distance: number;

  @Column({ nullable: true })
  oldAddress: string;

  @Column({ default: 60 })
  cycleTime: number;

  @Column()
  tableForTwo: number;

  @Column()
  tableForFour: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates: Point;

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

  @OneToOne(() => Users, (user) => user.store)
  user: Users;
}
