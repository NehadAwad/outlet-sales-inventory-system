import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { MenuItem } from "./MenuItem";
import { Outlet } from "./Outlet";

@Entity("inventories")
@Unique("UQ_inventory_outlet_menu_item", ["outletId", "menuItemId"])
@Check("CHK_inventory_stock_non_negative", `"stockQty" >= 0`)
export class Inventory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  outletId!: string;

  @Index()
  @Column({ type: "uuid" })
  menuItemId!: string;

  @Column({ type: "int", default: 0 })
  stockQty!: number;

  @ManyToOne(() => Outlet, (outlet) => outlet.inventories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "outletId" })
  outlet!: Outlet;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.inventories, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "menuItemId" })
  menuItem!: MenuItem;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
