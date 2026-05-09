import type { SaleItem } from "./SaleItem";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Outlet } from "./Outlet";

@Entity("sales")
@Unique("UQ_sale_outlet_receipt", ["outletId", "receiptNumber"])
export class Sale {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  outletId!: string;

  @Column({ type: "varchar", length: 100 })
  receiptNumber!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  totalAmount!: string;

  @ManyToOne(() => Outlet, (outlet) => outlet.sales, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "outletId" })
  outlet!: Outlet;

  @OneToMany("SaleItem", "sale", { cascade: true })
  items!: SaleItem[];

  @Index()
  @CreateDateColumn()
  createdAt!: Date;
}
