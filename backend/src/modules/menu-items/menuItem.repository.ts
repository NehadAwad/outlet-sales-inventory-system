import { AppDataSource } from "../../db/data-source";
import { MenuItem } from "../../entities/MenuItem";

function repo() {
  return AppDataSource.getRepository(MenuItem);
}

export const menuItemRepository = {
  create(data: Partial<MenuItem>): MenuItem {
    return repo().create(data);
  },

  async save(entity: MenuItem): Promise<MenuItem> {
    return repo().save(entity);
  },

  async findAll(): Promise<MenuItem[]> {
    return repo().find({ order: { createdAt: "DESC" } });
  },

  async findById(id: string): Promise<MenuItem | null> {
    return repo().findOne({ where: { id } });
  },

  async findBySku(sku: string): Promise<MenuItem | null> {
    return repo().findOne({ where: { sku } });
  },
};
