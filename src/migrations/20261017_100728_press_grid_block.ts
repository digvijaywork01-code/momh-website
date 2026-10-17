import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_press_grid_order" AS ENUM('newest', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_press_grid_order" AS ENUM('newest', 'manual');
  CREATE TABLE "pages_blocks_press_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"date" timestamp(3) with time zone,
  	"publication" varchar,
  	"summary" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_press_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"order" "enum_pages_blocks_press_grid_order" DEFAULT 'newest',
  	"link_label" varchar DEFAULT 'Read the full story',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_press_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"date" timestamp(3) with time zone,
  	"publication" varchar,
  	"summary" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_press_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" "enum__pages_v_blocks_press_grid_order" DEFAULT 'newest',
  	"link_label" varchar DEFAULT 'Read the full story',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_press_grid_items" ADD CONSTRAINT "pages_blocks_press_grid_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_press_grid_items" ADD CONSTRAINT "pages_blocks_press_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_press_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_press_grid" ADD CONSTRAINT "pages_blocks_press_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_press_grid_items" ADD CONSTRAINT "_pages_v_blocks_press_grid_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_press_grid_items" ADD CONSTRAINT "_pages_v_blocks_press_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_press_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_press_grid" ADD CONSTRAINT "_pages_v_blocks_press_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_press_grid_items_order_idx" ON "pages_blocks_press_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_press_grid_items_parent_id_idx" ON "pages_blocks_press_grid_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_press_grid_items_image_idx" ON "pages_blocks_press_grid_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_press_grid_order_idx" ON "pages_blocks_press_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_press_grid_parent_id_idx" ON "pages_blocks_press_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_press_grid_path_idx" ON "pages_blocks_press_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_press_grid_items_order_idx" ON "_pages_v_blocks_press_grid_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_press_grid_items_parent_id_idx" ON "_pages_v_blocks_press_grid_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_press_grid_items_image_idx" ON "_pages_v_blocks_press_grid_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_press_grid_order_idx" ON "_pages_v_blocks_press_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_press_grid_parent_id_idx" ON "_pages_v_blocks_press_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_press_grid_path_idx" ON "_pages_v_blocks_press_grid" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_press_grid_items" CASCADE;
  DROP TABLE "pages_blocks_press_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_press_grid_items" CASCADE;
  DROP TABLE "_pages_v_blocks_press_grid" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_press_grid_order";
  DROP TYPE "public"."enum__pages_v_blocks_press_grid_order";`)
}
