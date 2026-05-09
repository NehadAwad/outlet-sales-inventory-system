import type { Inventory } from "./Inventory";
import type { OutletMenuItem } from "./OutletMenuItem";
import type { SaleItem } from "./SaleItem";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("menu_items")
export class MenuItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 80 })
  sku!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  basePrice!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany("OutletMenuItem", "menuItem")
  outletMenuItems!: OutletMenuItem[];

  @OneToMany("Inventory", "menuItem")
  inventories!: Inventory[];

  @OneToMany("SaleItem", "menuItem")
  saleItems!: SaleItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
