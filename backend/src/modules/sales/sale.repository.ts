import { AppDataSource } from "../../db/data-source";
import { Sale } from "../../entities/Sale";

function repo() {
  return AppDataSource.getRepository(Sale);
}

const saleRelations = {
  items: { menuItem: true },
} as const;

export const saleRepository = {
  async findByOutletId(outletId: string): Promise<Sale[]> {
    return repo().find({
      where: { outletId },
      order: { createdAt: "DESC" },
      relations: saleRelations,
    });
  },

  async findByIdAndOutlet(
    saleId: string,
    outletId: string
  ): Promise<Sale | null> {
    return repo().findOne({
      where: { id: saleId, outletId },
      relations: saleRelations,
    });
  },
};
