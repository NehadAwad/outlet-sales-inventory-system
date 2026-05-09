import { AppDataSource } from "../../db/data-source";
import { Inventory } from "../../entities/Inventory";

function repo() {
  return AppDataSource.getRepository(Inventory);
}

export const inventoryRepository = {
  create(data: Partial<Inventory>): Inventory {
    return repo().create(data);
  },

  async save(entity: Inventory): Promise<Inventory> {
    return repo().save(entity);
  },

  async findByOutletAndMenuItem(
    outletId: string,
    menuItemId: string
  ): Promise<Inventory | null> {
    return repo().findOne({
      where: { outletId, menuItemId },
      relations: { menuItem: true },
    });
  },

  async findAllByOutletId(outletId: string): Promise<Inventory[]> {
    return repo().find({
      where: { outletId },
      relations: { menuItem: true },
      order: { updatedAt: "DESC" },
    });
  },
};
