# Entity-relationship diagram

This document describes the relational model for the outlet POS backend ([TypeORM entities](../backend/src/entities)). HQ maintains a **master menu**; each **outlet** gets **assigned items** with outlet-specific **price**, **inventory** per item, and **sales** with sequential **receipt numbers** per outlet.

## Static ERD image

The same schema is available as a **committed PNG** for reviewers, slides, or PDFs where Mermaid does not render: **[ERD Diagram.png](./ERD%20Diagram.png)**.

![Entity-relationship diagram (PNG)](./ERD%20Diagram.png)


## Integrity and constraints

- **Uniqueness**
  - `outlets.code` — one row per outlet code.
  - `menu_items.sku` — one row per SKU.
  - `outlet_menu_items (outletId, menuItemId)` — at most one assignment row per outlet and menu item.
  - `inventories (outletId, menuItemId)` — one stock row per pair.
  - `sales (outletId, receiptNumber)` — receipt numbers do not collide within an outlet.
  - `receipt_sequences.outletId` — exactly one sequence row per outlet (1:1 with outlet for numbering).

- **Referential actions (as modeled in TypeORM)**
  - Deleting an **outlet** cascades to `outlet_menu_items`, `inventories`, `receipt_sequences`; **sales** use `RESTRICT` on outlet delete so historical sales block outlet removal.
  - **Menu item** delete is generally **RESTRICT** where referenced (`outlet_menu_items`, `inventories`, `sale_items`) so catalog rows cannot disappear if still in use.

- **Business rules enforced in the database**
  - `inventories.stockQty >= 0` via check constraint `CHK_inventory_stock_non_negative`.

- **Reporting read path**
  - Revenue and top-selling-item reports aggregate **`sales`** and **`sale_items`** (joined to outlets and menu items), filtered by `outletId` and time windows as implemented in the report repositories.
