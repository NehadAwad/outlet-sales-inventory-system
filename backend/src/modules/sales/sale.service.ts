import { In } from "typeorm";
import { AppDataSource } from "../../db/data-source";
import { Inventory } from "../../entities/Inventory";
import { Outlet } from "../../entities/Outlet";
import { OutletMenuItem } from "../../entities/OutletMenuItem";
import { ReceiptSequence } from "../../entities/ReceiptSequence";
import { Sale } from "../../entities/Sale";
import { SaleItem } from "../../entities/SaleItem";
import { ApiError } from "../../utils/ApiError";
import { formatReceiptNumber } from "../../utils/receipt";
import { outletRepository } from "../outlets/outlet.repository";
import type { CreateSaleBody } from "./sale.validation";
import { saleRepository } from "./sale.repository";

export async function createSale(
  outletId: string,
  input: CreateSaleBody
): Promise<Sale> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const outlet = await queryRunner.manager.findOne(Outlet, {
      where: { id: outletId, isActive: true },
    });
    if (!outlet) {
      throw ApiError.notFound("Outlet not found");
    }

    const receiptSequence = await queryRunner.manager.findOne(ReceiptSequence, {
      where: { outletId },
      lock: { mode: "pessimistic_write" },
    });
    if (!receiptSequence) {
      throw ApiError.internal("Receipt sequence not initialized");
    }

    const nextNumber = receiptSequence.lastNumber + 1;
    const receiptNumber = formatReceiptNumber(outlet.code, nextNumber);

    const menuItemIds = input.items.map((i) => i.menuItemId);
    const uniqueIds = [...new Set(menuItemIds)];
    if (uniqueIds.length !== menuItemIds.length) {
      throw ApiError.badRequest("Duplicate menu items not allowed");
    }

    const assignedItems = await queryRunner.manager.find(OutletMenuItem, {
      where: { outletId, menuItemId: In(menuItemIds), isActive: true },
      relations: { menuItem: true },
    });
    if (assignedItems.length !== menuItemIds.length) {
      throw ApiError.badRequest("One or more items not assigned to outlet");
    }

    const inventories = await queryRunner.manager
      .createQueryBuilder(Inventory, "inv")
      .where("inv.outletId = :outletId", { outletId })
      .andWhere("inv.menuItemId IN (:...menuItemIds)", { menuItemIds })
      .setLock("pessimistic_write")
      .getMany();
    if (inventories.length !== menuItemIds.length) {
      throw ApiError.badRequest("Inventory not found for one or more items");
    }

    const inventoryMap = new Map(inventories.map((i) => [i.menuItemId, i]));
    const assignedMap = new Map(assignedItems.map((a) => [a.menuItemId, a]));

    let totalAmount = 0;
    const saleItems: SaleItem[] = [];

    for (const item of input.items) {
      const inventory = inventoryMap.get(item.menuItemId)!;
      const assigned = assignedMap.get(item.menuItemId)!;

      if (inventory.stockQty < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${assigned.menuItem.name}`
        );
      }

      const unitPrice = Number(assigned.price);
      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      inventory.stockQty -= item.quantity;

      const saleItem = new SaleItem();
      saleItem.menuItemId = item.menuItemId;
      saleItem.quantity = item.quantity;
      saleItem.unitPrice = unitPrice.toFixed(2);
      saleItem.lineTotal = lineTotal.toFixed(2);
      saleItems.push(saleItem);
    }

    await queryRunner.manager.save(Inventory, inventories);

    const sale = new Sale();
    sale.outletId = outletId;
    sale.receiptNumber = receiptNumber;
    sale.totalAmount = totalAmount.toFixed(2);
    sale.items = saleItems;
    const savedSale = await queryRunner.manager.save(Sale, sale);

    receiptSequence.lastNumber = nextNumber;
    await queryRunner.manager.save(ReceiptSequence, receiptSequence);

    await queryRunner.commitTransaction();

    const withRelations = await saleRepository.findByIdAndOutlet(
      savedSale.id,
      outletId
    );
    return withRelations ?? savedSale;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

export async function getSalesByOutlet(outletId: string): Promise<Sale[]> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }
  return saleRepository.findByOutletId(outletId);
}

export async function getSaleById(
  outletId: string,
  saleId: string
): Promise<Sale> {
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) {
    throw ApiError.notFound("Outlet not found");
  }

  const sale = await saleRepository.findByIdAndOutlet(saleId, outletId);
  if (!sale) {
    throw ApiError.notFound("Sale not found");
  }
  return sale;
}
