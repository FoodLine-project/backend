import { Stores } from 'src/stores/stores.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Tables extends BaseEntity {
  @PrimaryGeneratedColumn()
  tableId: number;

  @Column()
  StoreId: number;

  @Column()
  availableTableForTwo: number;

  @Column()
  availableTableForFour: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToOne(() => Stores, (stores) => stores.tables)
  @JoinColumn({ name: 'StoreId' })
  store: Stores;
}
