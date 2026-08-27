import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_editorial_split_image_style" AS ENUM('bleed', 'inset');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_item_aspect" AS ENUM('square', 'portrait');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_mobile_layout" AS ENUM('stack', 'carousel');
  CREATE TYPE "public"."enum_pages_blocks_section_intro_body_width" AS ENUM('normal', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_image_style" AS ENUM('bleed', 'inset');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_item_aspect" AS ENUM('square', 'portrait');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_mobile_layout" AS ENUM('stack', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_body_width" AS ENUM('normal', 'wide');
  ALTER TYPE "public"."enum_pages_blocks_numbered_grid_columns" ADD VALUE '4';
  ALTER TYPE "public"."enum_pages_blocks_numbered_grid_max_width" ADD VALUE 'bleed' BEFORE 'full';
  ALTER TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" ADD VALUE '4';
  ALTER TYPE "public"."enum__pages_v_blocks_numbered_grid_max_width" ADD VALUE 'bleed' BEFORE 'full';
  ALTER TABLE "pages_blocks_editorial_split" ADD COLUMN "image_style" "enum_pages_blocks_editorial_split_image_style" DEFAULT 'bleed';
  ALTER TABLE "pages_blocks_numbered_grid" ADD COLUMN "item_aspect" "enum_pages_blocks_numbered_grid_item_aspect" DEFAULT 'square';
  ALTER TABLE "pages_blocks_numbered_grid" ADD COLUMN "mobile_layout" "enum_pages_blocks_numbered_grid_mobile_layout" DEFAULT 'stack';
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "body_width" "enum_pages_blocks_section_intro_body_width" DEFAULT 'normal';
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "tight_top" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_editorial_split" ADD COLUMN "image_style" "enum__pages_v_blocks_editorial_split_image_style" DEFAULT 'bleed';
  ALTER TABLE "_pages_v_blocks_numbered_grid" ADD COLUMN "item_aspect" "enum__pages_v_blocks_numbered_grid_item_aspect" DEFAULT 'square';
  ALTER TABLE "_pages_v_blocks_numbered_grid" ADD COLUMN "mobile_layout" "enum__pages_v_blocks_numbered_grid_mobile_layout" DEFAULT 'stack';
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "body_width" "enum__pages_v_blocks_section_intro_body_width" DEFAULT 'normal';
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "tight_top" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::text;
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_columns";
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_columns" AS ENUM('2', '3');
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::"public"."enum_pages_blocks_numbered_grid_columns";
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE "public"."enum_pages_blocks_numbered_grid_columns" USING "columns"::"public"."enum_pages_blocks_numbered_grid_columns";
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "max_width" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "max_width" SET DEFAULT 'wide'::text;
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_max_width";
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_max_width" AS ENUM('full', 'wide', 'medium', 'narrow');
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "max_width" SET DEFAULT 'wide'::"public"."enum_pages_blocks_numbered_grid_max_width";
  ALTER TABLE "pages_blocks_numbered_grid" ALTER COLUMN "max_width" SET DATA TYPE "public"."enum_pages_blocks_numbered_grid_max_width" USING "max_width"::"public"."enum_pages_blocks_numbered_grid_max_width";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::text;
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_columns";
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" AS ENUM('2', '3');
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DEFAULT '3'::"public"."enum__pages_v_blocks_numbered_grid_columns";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "columns" SET DATA TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" USING "columns"::"public"."enum__pages_v_blocks_numbered_grid_columns";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "max_width" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "max_width" SET DEFAULT 'wide'::text;
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_max_width";
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_max_width" AS ENUM('full', 'wide', 'medium', 'narrow');
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "max_width" SET DEFAULT 'wide'::"public"."enum__pages_v_blocks_numbered_grid_max_width";
  ALTER TABLE "_pages_v_blocks_numbered_grid" ALTER COLUMN "max_width" SET DATA TYPE "public"."enum__pages_v_blocks_numbered_grid_max_width" USING "max_width"::"public"."enum__pages_v_blocks_numbered_grid_max_width";
  ALTER TABLE "pages_blocks_editorial_split" DROP COLUMN "image_style";
  ALTER TABLE "pages_blocks_numbered_grid" DROP COLUMN "item_aspect";
  ALTER TABLE "pages_blocks_numbered_grid" DROP COLUMN "mobile_layout";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "body_width";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "tight_top";
  ALTER TABLE "_pages_v_blocks_editorial_split" DROP COLUMN "image_style";
  ALTER TABLE "_pages_v_blocks_numbered_grid" DROP COLUMN "item_aspect";
  ALTER TABLE "_pages_v_blocks_numbered_grid" DROP COLUMN "mobile_layout";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "body_width";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "tight_top";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_image_style";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_item_aspect";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_mobile_layout";
  DROP TYPE "public"."enum_pages_blocks_section_intro_body_width";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_image_style";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_item_aspect";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_mobile_layout";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_body_width";`)
}
