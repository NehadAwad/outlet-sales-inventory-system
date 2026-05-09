import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Outlet } from "./Outlet";

@Entity("receipt_sequences")
export class ReceiptSequence {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  outletId!: string;

  @Column({ type: "int", default: 0 })
  lastNumber!: number;

  @OneToOne(() => Outlet, (outlet) => outlet.receiptSequence, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "outletId" })
  outlet!: Outlet;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
