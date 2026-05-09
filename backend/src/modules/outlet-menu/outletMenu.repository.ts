import { AppDataSource } from "../../db/data-source";
import { OutletMenuItem } from "../../entities/OutletMenuItem";

function repo() {
  return AppDataSource.getRepository(OutletMenuItem);
}

export const outletMenuRepository = {
  create(data: Partial<OutletMenuItem>): OutletMenuItem {
    return repo().create(data);
  },

  async save(entity: OutletMenuItem): Promise<OutletMenuItem> {
    return repo().save(entity);
  },

  async findByOutletAndMenuItem(
    outletId: string,
    menuItemId: string
  ): Promise<OutletMenuItem | null> {
    return repo().findOne({
      where: { outletId, menuItemId },
      relations: { menuItem: true },
    });
  },

  async findAllByOutletId(outletId: string): Promise<OutletMenuItem[]> {
    return repo().find({
      where: { outletId },
      relations: { menuItem: true },
      order: { createdAt: "DESC" },
    });
  },
};
