import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1778334704854 implements MigrationInterface {
    name = 'InitialSchema1778334704854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "menu_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "sku" character varying(80) NOT NULL, "description" text, "basePrice" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_57e6188f929e5dc6919168620c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1bc11bdd03f1032383398bcfc6" ON "menu_items" ("sku") `);
        await queryRunner.query(`CREATE TABLE "outlets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "code" character varying(50) NOT NULL, "address" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f218ad1778c5c01d7bf77bab02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_690e0a878f58ecfb7c73a361ec" ON "outlets" ("code") `);
        await queryRunner.query(`CREATE TABLE "inventories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outletId" uuid NOT NULL, "menuItemId" uuid NOT NULL, "stockQty" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_inventory_outlet_menu_item" UNIQUE ("outletId", "menuItemId"), CONSTRAINT "CHK_inventory_stock_non_negative" CHECK ("stockQty" >= 0), CONSTRAINT "PK_7b1946392ffdcb50cfc6ac78c0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a94645da7e9f3541cc88d616e9" ON "inventories" ("outletId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6bc2cc739d85ed1ca261ffe9a" ON "inventories" ("menuItemId") `);
        await queryRunner.query(`CREATE TABLE "outlet_menu_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outletId" uuid NOT NULL, "menuItemId" uuid NOT NULL, "price" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_outlet_menu_item" UNIQUE ("outletId", "menuItemId"), CONSTRAINT "PK_6bb8039232a394fd3d40a86044c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f2ec6da63bf6a2a3b5bcfb8229" ON "outlet_menu_items" ("outletId") `);
        await queryRunner.query(`CREATE INDEX "IDX_48467d98ca6babe3969f75a1b8" ON "outlet_menu_items" ("menuItemId") `);
        await queryRunner.query(`CREATE TABLE "receipt_sequences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outletId" uuid NOT NULL, "lastNumber" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_8157c5e56b5e7bcc548b215ed1" UNIQUE ("outletId"), CONSTRAINT "PK_cced0c6b4479721f75c051ff175" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8157c5e56b5e7bcc548b215ed1" ON "receipt_sequences" ("outletId") `);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outletId" uuid NOT NULL, "receiptNumber" character varying(100) NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_sale_outlet_receipt" UNIQUE ("outletId", "receiptNumber"), CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_df74a9d7dd3e5cd38f0a3b2476" ON "sales" ("outletId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f83303ecd8a5d50818506216da" ON "sales" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "sale_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "saleId" uuid NOT NULL, "menuItemId" uuid NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "lineTotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c642be08de5235317d4cf3deb4" ON "sale_items" ("saleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_35c5401fcff0ff28ef33bca7fc" ON "sale_items" ("menuItemId") `);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_a94645da7e9f3541cc88d616e91" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_a6bc2cc739d85ed1ca261ffe9af" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outlet_menu_items" ADD CONSTRAINT "FK_f2ec6da63bf6a2a3b5bcfb82293" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outlet_menu_items" ADD CONSTRAINT "FK_48467d98ca6babe3969f75a1b8b" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "receipt_sequences" ADD CONSTRAINT "FK_8157c5e56b5e7bcc548b215ed19" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_df74a9d7dd3e5cd38f0a3b24769" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c642be08de5235317d4cf3deb40" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_35c5401fcff0ff28ef33bca7fc1" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_35c5401fcff0ff28ef33bca7fc1"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c642be08de5235317d4cf3deb40"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_df74a9d7dd3e5cd38f0a3b24769"`);
        await queryRunner.query(`ALTER TABLE "receipt_sequences" DROP CONSTRAINT "FK_8157c5e56b5e7bcc548b215ed19"`);
        await queryRunner.query(`ALTER TABLE "outlet_menu_items" DROP CONSTRAINT "FK_48467d98ca6babe3969f75a1b8b"`);
        await queryRunner.query(`ALTER TABLE "outlet_menu_items" DROP CONSTRAINT "FK_f2ec6da63bf6a2a3b5bcfb82293"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT "FK_a6bc2cc739d85ed1ca261ffe9af"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT "FK_a94645da7e9f3541cc88d616e91"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_35c5401fcff0ff28ef33bca7fc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c642be08de5235317d4cf3deb4"`);
        await queryRunner.query(`DROP TABLE "sale_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f83303ecd8a5d50818506216da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df74a9d7dd3e5cd38f0a3b2476"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8157c5e56b5e7bcc548b215ed1"`);
        await queryRunner.query(`DROP TABLE "receipt_sequences"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48467d98ca6babe3969f75a1b8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2ec6da63bf6a2a3b5bcfb8229"`);
        await queryRunner.query(`DROP TABLE "outlet_menu_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6bc2cc739d85ed1ca261ffe9a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a94645da7e9f3541cc88d616e9"`);
        await queryRunner.query(`DROP TABLE "inventories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_690e0a878f58ecfb7c73a361ec"`);
        await queryRunner.query(`DROP TABLE "outlets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1bc11bdd03f1032383398bcfc6"`);
        await queryRunner.query(`DROP TABLE "menu_items"`);
    }

}
