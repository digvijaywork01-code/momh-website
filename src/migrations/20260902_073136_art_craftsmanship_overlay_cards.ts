import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_numbered_grid_card_style" AS ENUM('plain', 'overlay');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_card_style" AS ENUM('plain', 'overlay');
  ALTER TABLE "pages_blocks_numbered_grid_items" ADD COLUMN "description" jsonb;
  ALTER TABLE "pages_blocks_numbered_grid" ADD COLUMN "card_style" "enum_pages_blocks_numbered_grid_card_style" DEFAULT 'plain';
  ALTER TABLE "_pages_v_blocks_numbered_grid_items" ADD COLUMN "description" jsonb;
  ALTER TABLE "_pages_v_blocks_numbered_grid" ADD COLUMN "card_style" "enum__pages_v_blocks_numbered_grid_card_style" DEFAULT 'plain';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_numbered_grid_items" DROP COLUMN "description";
  ALTER TABLE "pages_blocks_numbered_grid" DROP COLUMN "card_style";
  ALTER TABLE "_pages_v_blocks_numbered_grid_items" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_numbered_grid" DROP COLUMN "card_style";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_card_style";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_card_style";`)
}
