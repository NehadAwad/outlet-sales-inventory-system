import { AppDataSource } from "../../db/data-source";

export interface RevenueByOutletRow {
  outletId: string;
  outletName: string;
  totalRevenue: string;
}

export interface TopSellingItemRow {
  menuItemId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: string;
}

export const reportRepository = {
  async getRevenueByOutlet(): Promise<RevenueByOutletRow[]> {
    const rows = await AppDataSource.query<
      Array<{
        outletId: string;
        outletName: string;
        totalRevenue: string;
      }>
    >(
      `
      SELECT o.id AS "outletId",
             o.name AS "outletName",
             COALESCE(SUM(s."totalAmount"), 0)::numeric(14, 2)::text AS "totalRevenue"
      FROM outlets o
      LEFT JOIN sales s ON s."outletId" = o.id
      GROUP BY o.id, o.name
      ORDER BY o.name ASC
      `
    );
    return rows.map((r) => ({
      outletId: r.outletId,
      outletName: r.outletName,
      totalRevenue: r.totalRevenue,
    }));
  },

  async getTopSellingItemsByOutlet(
    outletId: string
  ): Promise<TopSellingItemRow[]> {
    const rows = await AppDataSource.query<
      Array<{
        menuItemId: string;
        name: string;
        totalQuantity: string;
        totalRevenue: string;
      }>
    >(
      `
      SELECT si."menuItemId" AS "menuItemId",
             m.name AS "name",
             SUM(si.quantity)::int AS "totalQuantity",
             SUM(si."lineTotal")::numeric(14, 2)::text AS "totalRevenue"
      FROM sale_items si
      INNER JOIN sales s ON s.id = si."saleId"
      INNER JOIN menu_items m ON m.id = si."menuItemId"
      WHERE s."outletId" = $1
      GROUP BY si."menuItemId", m.name
      ORDER BY SUM(si.quantity) DESC
      LIMIT 5
      `,
      [outletId]
    );
    return rows.map((r) => ({
      menuItemId: r.menuItemId,
      name: r.name,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: r.totalRevenue,
    }));
  },
};
