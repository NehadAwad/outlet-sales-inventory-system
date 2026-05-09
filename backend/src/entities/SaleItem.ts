import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { MenuItem } from "./MenuItem";
import { Sale } from "./Sale";

@Entity("sale_items")
export class SaleItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  saleId!: string;

  @Index()
  @Column({ type: "uuid" })
  menuItemId!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  unitPrice!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  lineTotal!: string;

  @ManyToOne(() => Sale, (sale) => sale.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "saleId" })
  sale!: Sale;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.saleItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "menuItemId" })
  menuItem!: MenuItem;
}
