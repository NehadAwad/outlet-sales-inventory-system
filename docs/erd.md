# Entity-relationship diagram

This document describes the relational model for the outlet POS backend ([TypeORM entities](../backend/src/entities)). HQ maintains a **master menu**; each **outlet** gets **assigned items** with outlet-specific **price**, **inventory** per item, and **sales** with sequential **receipt numbers** per outlet.

## Static ERD image

The same schema is available as a **committed PNG** for reviewers, slides, or PDFs where Mermaid does not render: **[ERD Diagram.png](./ERD%20Diagram.png)**.

![Entity-relationship diagram (PNG)](./ERD%20Diagram.png)

## Mermaid ERD

```mermaid
erDiagram
  outlets ||--o{ outlet_menu_items : assigns
  menu_items ||--o{ outlet_menu_items : assigned_to
  outlets ||--o{ inventories : stocks
  menu_items ||--o{ inventories : stocked_as
  outlets ||--o{ sales : records
  sales ||--|{ sale_items : contains
  menu_items ||--o{ sale_items : sold_as
  outlets ||--|| receipt_sequences : receipt_counter

  outlets {
    uuid id PK
    varchar name
    varchar code UK
    text address
    boolean isActive
    timestamptz createdAt
    timestamptz updatedAt
  }

  menu_items {
    uuid id PK
    varchar name
    varchar sku UK
    text description
    numeric basePrice
    boolean isActive
    timestamptz createdAt
    timestamptz updatedAt
  }

  outlet_menu_items {
    uuid id PK
    uuid outletId FK
    uuid menuItemId FK
    numeric price
    boolean isActive
    timestamptz createdAt
    timestamptz updatedAt
  }

  inventories {
    uuid id PK
    uuid outletId FK
    uuid menuItemId FK
    int stockQty
    timestamptz createdAt
    timestamptz updatedAt
  }

  sales {
    uuid id PK
    uuid outletId FK
    varchar receiptNumber
    numeric totalAmount
    timestamptz createdAt
  }

  sale_items {
    uuid id PK
    uuid saleId FK
    uuid menuItemId FK
    int quantity
    numeric unitPrice
    numeric lineTotal
  }

  receipt_sequences {
    uuid id PK
    uuid outletId FK_UK
    int lastNumber
    timestamptz createdAt
    timestamptz updatedAt
  }
```

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
