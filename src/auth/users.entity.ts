import { Reviews } from '../reviews/reviews.entity';
import { Waitings } from '../waitings/waitings.entity';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Stores } from '../stores/stores.entity';
import { UnauthorizedException } from '@nestjs/common';

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

  @Column({ nullable: true, default: null })
  refreshToken: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true, name: 'StoreId', unique: true })
  StoreId: number;

  @BeforeInsert()
  checkStoreId() {
    if (this.isAdmin && !this.StoreId) {
      throw new UnauthorizedException(`StoreId가 존재하지 않습니다.`);
    }
  }

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Waitings, (waiting) => waiting.user)
  waitings: Waitings[];

  @OneToMany(() => Reviews, (review) => review.user)
  reviews: Reviews[];

  @OneToOne(() => Stores, (store) => store.user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'StoreId' })
  store: Stores;
}
