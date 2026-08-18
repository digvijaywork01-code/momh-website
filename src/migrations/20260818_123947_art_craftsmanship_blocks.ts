import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_editorial_split_heading_position" AS ENUM('with-text', 'with-image');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_columns" AS ENUM('2', '3');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_max_width" AS ENUM('full', 'wide', 'medium', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_text_position" AS ENUM('none', 'left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_numbered_grid_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_heading_position" AS ENUM('with-text', 'with-image');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_columns" AS ENUM('2', '3');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_max_width" AS ENUM('full', 'wide', 'medium', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_text_position" AS ENUM('none', 'left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_numbered_grid_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TABLE "pages_blocks_numbered_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"number" varchar,
  	"caption" varchar
  );
  
  CREATE TABLE "pages_blocks_numbered_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_pages_blocks_numbered_grid_layout" DEFAULT 'grid',
  	"columns" "enum_pages_blocks_numbered_grid_columns" DEFAULT '3',
  	"max_width" "enum_pages_blocks_numbered_grid_max_width" DEFAULT 'wide',
  	"text_position" "enum_pages_blocks_numbered_grid_text_position" DEFAULT 'none',
  	"headline" jsonb,
  	"body" jsonb,
  	"autoplay" boolean DEFAULT false,
  	"autoplay_interval" numeric DEFAULT 5000,
  	"top_spacing" "enum_pages_blocks_numbered_grid_top_spacing" DEFAULT 'md',
  	"bottom_spacing" "enum_pages_blocks_numbered_grid_bottom_spacing" DEFAULT 'md',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_numbered_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"number" varchar,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_numbered_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__pages_v_blocks_numbered_grid_layout" DEFAULT 'grid',
  	"columns" "enum__pages_v_blocks_numbered_grid_columns" DEFAULT '3',
  	"max_width" "enum__pages_v_blocks_numbered_grid_max_width" DEFAULT 'wide',
  	"text_position" "enum__pages_v_blocks_numbered_grid_text_position" DEFAULT 'none',
  	"headline" jsonb,
  	"body" jsonb,
  	"autoplay" boolean DEFAULT false,
  	"autoplay_interval" numeric DEFAULT 5000,
  	"top_spacing" "enum__pages_v_blocks_numbered_grid_top_spacing" DEFAULT 'md',
  	"bottom_spacing" "enum__pages_v_blocks_numbered_grid_bottom_spacing" DEFAULT 'md',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_editorial_split" ADD COLUMN "heading_position" "enum_pages_blocks_editorial_split_heading_position" DEFAULT 'with-text';
  ALTER TABLE "_pages_v_blocks_editorial_split" ADD COLUMN "heading_position" "enum__pages_v_blocks_editorial_split_heading_position" DEFAULT 'with-text';
  ALTER TABLE "pages_blocks_numbered_grid_items" ADD CONSTRAINT "pages_blocks_numbered_grid_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_numbered_grid_items" ADD CONSTRAINT "pages_blocks_numbered_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_numbered_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_numbered_grid" ADD CONSTRAINT "pages_blocks_numbered_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_numbered_grid_items" ADD CONSTRAINT "_pages_v_blocks_numbered_grid_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_numbered_grid_items" ADD CONSTRAINT "_pages_v_blocks_numbered_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_numbered_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_numbered_grid" ADD CONSTRAINT "_pages_v_blocks_numbered_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_numbered_grid_items_order_idx" ON "pages_blocks_numbered_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_numbered_grid_items_parent_id_idx" ON "pages_blocks_numbered_grid_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_numbered_grid_items_image_idx" ON "pages_blocks_numbered_grid_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_numbered_grid_order_idx" ON "pages_blocks_numbered_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_numbered_grid_parent_id_idx" ON "pages_blocks_numbered_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_numbered_grid_path_idx" ON "pages_blocks_numbered_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_numbered_grid_items_order_idx" ON "_pages_v_blocks_numbered_grid_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_numbered_grid_items_parent_id_idx" ON "_pages_v_blocks_numbered_grid_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_numbered_grid_items_image_idx" ON "_pages_v_blocks_numbered_grid_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_numbered_grid_order_idx" ON "_pages_v_blocks_numbered_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_numbered_grid_parent_id_idx" ON "_pages_v_blocks_numbered_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_numbered_grid_path_idx" ON "_pages_v_blocks_numbered_grid" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_numbered_grid_items" CASCADE;
  DROP TABLE "pages_blocks_numbered_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_numbered_grid_items" CASCADE;
  DROP TABLE "_pages_v_blocks_numbered_grid" CASCADE;
  ALTER TABLE "pages_blocks_editorial_split" DROP COLUMN "heading_position";
  ALTER TABLE "_pages_v_blocks_editorial_split" DROP COLUMN "heading_position";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_heading_position";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_layout";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_max_width";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_text_position";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_top_spacing";
  DROP TYPE "public"."enum_pages_blocks_numbered_grid_bottom_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_heading_position";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_layout";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_max_width";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_text_position";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_top_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_numbered_grid_bottom_spacing";`)
}
