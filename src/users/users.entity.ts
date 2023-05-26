import { Reviews } from 'src/reviews/reviews.entity';
import { Waitings } from './../waitings/waitings.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  nickname: string;

  @Column()
  password: string;

  @Column()
  phoneNumber: string;

  @Column({ default: 0 })
  La: number;

  @Column({ default: 0 })
  Ma: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Waitings, (waiting) => waiting.user)
  waitings: Waitings[];

  @OneToMany(() => Reviews, (review) => review.user)
  reviews: Reviews[];
}
