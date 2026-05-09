import { AppDataSource } from "../../db/data-source";
import { Outlet } from "../../entities/Outlet";

function repo() {
  return AppDataSource.getRepository(Outlet);
}

export const outletRepository = {
  create(data: Partial<Outlet>): Outlet {
    return repo().create(data);
  },

  async save(outlet: Outlet): Promise<Outlet> {
    return repo().save(outlet);
  },

  async findAll(): Promise<Outlet[]> {
    return repo().find({ order: { createdAt: "DESC" } });
  },

  async findById(id: string): Promise<Outlet | null> {
    return repo().findOne({ where: { id } });
  },

  async findByCode(code: string): Promise<Outlet | null> {
    return repo().findOne({ where: { code } });
  },
};
