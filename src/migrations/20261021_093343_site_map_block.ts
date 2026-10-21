import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_site_map_columns_icon" AS ENUM('info', 'support', 'visit');
  CREATE TYPE "public"."enum__pages_v_blocks_site_map_columns_icon" AS ENUM('info', 'support', 'visit');
  CREATE TABLE "pages_blocks_site_map_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"caption" varchar
  );
  
  CREATE TABLE "pages_blocks_site_map_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"icon" "enum_pages_blocks_site_map_columns_icon"
  );
  
  CREATE TABLE "pages_blocks_site_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_site_map_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_site_map_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"icon" "enum__pages_v_blocks_site_map_columns_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_site_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_site_map_columns_links" ADD CONSTRAINT "pages_blocks_site_map_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_site_map_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_site_map_columns" ADD CONSTRAINT "pages_blocks_site_map_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_site_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_site_map" ADD CONSTRAINT "pages_blocks_site_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_site_map_columns_links" ADD CONSTRAINT "_pages_v_blocks_site_map_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_site_map_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_site_map_columns" ADD CONSTRAINT "_pages_v_blocks_site_map_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_site_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_site_map" ADD CONSTRAINT "_pages_v_blocks_site_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_site_map_columns_links_order_idx" ON "pages_blocks_site_map_columns_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_site_map_columns_links_parent_id_idx" ON "pages_blocks_site_map_columns_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_site_map_columns_order_idx" ON "pages_blocks_site_map_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_site_map_columns_parent_id_idx" ON "pages_blocks_site_map_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_site_map_order_idx" ON "pages_blocks_site_map" USING btree ("_order");
  CREATE INDEX "pages_blocks_site_map_parent_id_idx" ON "pages_blocks_site_map" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_site_map_path_idx" ON "pages_blocks_site_map" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_site_map_columns_links_order_idx" ON "_pages_v_blocks_site_map_columns_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_site_map_columns_links_parent_id_idx" ON "_pages_v_blocks_site_map_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_site_map_columns_order_idx" ON "_pages_v_blocks_site_map_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_site_map_columns_parent_id_idx" ON "_pages_v_blocks_site_map_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_site_map_order_idx" ON "_pages_v_blocks_site_map" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_site_map_parent_id_idx" ON "_pages_v_blocks_site_map" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_site_map_path_idx" ON "_pages_v_blocks_site_map" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_site_map_columns_links" CASCADE;
  DROP TABLE "pages_blocks_site_map_columns" CASCADE;
  DROP TABLE "pages_blocks_site_map" CASCADE;
  DROP TABLE "_pages_v_blocks_site_map_columns_links" CASCADE;
  DROP TABLE "_pages_v_blocks_site_map_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_site_map" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_site_map_columns_icon";
  DROP TYPE "public"."enum__pages_v_blocks_site_map_columns_icon";`)
}
