import {
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

@Entity("outlet_menu_items")
@Unique("UQ_outlet_menu_item", ["outletId", "menuItemId"])
export class OutletMenuItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  outletId!: string;

  @Index()
  @Column({ type: "uuid" })
  menuItemId!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @ManyToOne(() => Outlet, (outlet) => outlet.outletMenuItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "outletId" })
  outlet!: Outlet;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.outletMenuItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "menuItemId" })
  menuItem!: MenuItem;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
