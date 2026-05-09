import type { Inventory } from "./Inventory";
import type { OutletMenuItem } from "./OutletMenuItem";
import type { ReceiptSequence } from "./ReceiptSequence";
import type { Sale } from "./Sale";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("outlets")
export class Outlet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 50 })
  code!: string;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany("OutletMenuItem", "outlet")
  outletMenuItems!: OutletMenuItem[];

  @OneToMany("Inventory", "outlet")
  inventories!: Inventory[];

  @OneToMany("Sale", "outlet")
  sales!: Sale[];

  @OneToOne("ReceiptSequence", "outlet")
  receiptSequence!: ReceiptSequence;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
