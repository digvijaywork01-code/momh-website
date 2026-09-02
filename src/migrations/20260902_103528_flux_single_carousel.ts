import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_numbered_grid_columns" ADD VALUE '1' BEFORE '2';
  ALTER TYPE "public"."enum_pages_blocks_numbered_grid_item_aspect" ADD VALUE 'landscape';
  ALTER TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" ADD VALUE '1' BEFORE '2';
  ALTER TYPE "public"."enum__pages_v_blocks_numbered_grid_item_aspect" ADD VALUE 'landscape';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::text;
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_columns";
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_columns" AS ENUM('2', '3', '4');
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::"public"."enum_pages_blocks_numbered_grid_columns";
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE "public"."enum_pages_blocks_numbered_grid_columns" USING "columns"::"public"."enum_pages_blocks_numbered_grid_columns";
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DEFAULT 'square'::text;
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_item_aspect";
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_item_aspect" AS ENUM('square', 'portrait');
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DEFAULT 'square'::"public"."enum_pages_blocks_numbered_grid_item_aspect";
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DATA TYPE "public"."enum_pages_blocks_numbered_grid_item_aspect" USING "item_aspect"::"public"."enum_pages_blocks_numbered_grid_item_aspect";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::text;
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_columns";
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" AS ENUM('2', '3', '4');
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::"public"."enum__pages_v_blocks_numbered_grid_columns";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" USING "columns"::"public"."enum__pages_v_blocks_numbered_grid_columns";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DEFAULT 'square'::text;
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_item_aspect";
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_item_aspect" AS ENUM('square', 'portrait');
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DEFAULT 'square'::"public"."enum__pages_v_blocks_numbered_grid_item_aspect";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "item_aspect" SET DATA TYPE "public"."enum__pages_v_blocks_numbered_grid_item_aspect" USING "item_aspect"::"public"."enum__pages_v_blocks_numbered_grid_item_aspect";`)
}
