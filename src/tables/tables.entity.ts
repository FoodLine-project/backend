import { Stores } from '../stores/stores.entity';
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

  @Column({ default: 0 })
  availableTableForTwo: number;

  @Column({ default: 0 })
  availableTableForFour: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToOne(() => Stores, (stores) => stores.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'StoreId' })
  store: Stores;

  // @AfterInsert()
  // async setDefaultAvailableTableForTwo(): Promise<void> {
  //   const store = await Stores.findOne({
  //     where: { storeId: this.StoreId },
  //   });
  //   if (store) {
  //     this.availableTableForTwo = store.tableForTwo;
  //     this.availableTableForFour = store.tableForFour;
  //     await this.save();
  //   }
  // }
}
