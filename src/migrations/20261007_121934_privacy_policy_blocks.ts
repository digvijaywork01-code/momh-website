import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_text_section_list_width" AS ENUM('full', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_text_section_justify_last_line" AS ENUM('center', 'left');
  CREATE TYPE "public"."enum_pages_blocks_divider_show_on" AS ENUM('all', 'desktop', 'mobile');
  CREATE TYPE "public"."enum_pages_blocks_divider_desktop_spacing" AS ENUM('large', 'medium', 'small', 'none');
  CREATE TYPE "public"."enum_pages_blocks_divider_mobile_spacing" AS ENUM('large', 'medium', 'small', 'none');
  CREATE TYPE "public"."enum__pages_v_blocks_text_section_list_width" AS ENUM('full', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_text_section_justify_last_line" AS ENUM('center', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_divider_show_on" AS ENUM('all', 'desktop', 'mobile');
  CREATE TYPE "public"."enum__pages_v_blocks_divider_desktop_spacing" AS ENUM('large', 'medium', 'small', 'none');
  CREATE TYPE "public"."enum__pages_v_blocks_divider_mobile_spacing" AS ENUM('large', 'medium', 'small', 'none');
  CREATE TABLE "pages_blocks_text_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"list_width" "enum_pages_blocks_text_section_list_width" DEFAULT 'full',
  	"justify_last_line" "enum_pages_blocks_text_section_justify_last_line" DEFAULT 'center',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_divider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_on" "enum_pages_blocks_divider_show_on" DEFAULT 'all',
  	"desktop_spacing" "enum_pages_blocks_divider_desktop_spacing" DEFAULT 'large',
  	"mobile_spacing" "enum_pages_blocks_divider_mobile_spacing" DEFAULT 'large',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"list_width" "enum__pages_v_blocks_text_section_list_width" DEFAULT 'full',
  	"justify_last_line" "enum__pages_v_blocks_text_section_justify_last_line" DEFAULT 'center',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_divider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_on" "enum__pages_v_blocks_divider_show_on" DEFAULT 'all',
  	"desktop_spacing" "enum__pages_v_blocks_divider_desktop_spacing" DEFAULT 'large',
  	"mobile_spacing" "enum__pages_v_blocks_divider_mobile_spacing" DEFAULT 'large',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_text_section" ADD CONSTRAINT "pages_blocks_text_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_divider" ADD CONSTRAINT "pages_blocks_divider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_section" ADD CONSTRAINT "_pages_v_blocks_text_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_divider" ADD CONSTRAINT "_pages_v_blocks_divider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_text_section_order_idx" ON "pages_blocks_text_section" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_section_parent_id_idx" ON "pages_blocks_text_section" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_section_path_idx" ON "pages_blocks_text_section" USING btree ("_path");
  CREATE INDEX "pages_blocks_divider_order_idx" ON "pages_blocks_divider" USING btree ("_order");
  CREATE INDEX "pages_blocks_divider_parent_id_idx" ON "pages_blocks_divider" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_divider_path_idx" ON "pages_blocks_divider" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_text_section_order_idx" ON "_pages_v_blocks_text_section" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_section_parent_id_idx" ON "_pages_v_blocks_text_section" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_section_path_idx" ON "_pages_v_blocks_text_section" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_divider_order_idx" ON "_pages_v_blocks_divider" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_divider_parent_id_idx" ON "_pages_v_blocks_divider" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_divider_path_idx" ON "_pages_v_blocks_divider" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_text_section" CASCADE;
  DROP TABLE "pages_blocks_divider" CASCADE;
  DROP TABLE "_pages_v_blocks_text_section" CASCADE;
  DROP TABLE "_pages_v_blocks_divider" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_text_section_list_width";
  DROP TYPE "public"."enum_pages_blocks_text_section_justify_last_line";
  DROP TYPE "public"."enum_pages_blocks_divider_show_on";
  DROP TYPE "public"."enum_pages_blocks_divider_desktop_spacing";
  DROP TYPE "public"."enum_pages_blocks_divider_mobile_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_text_section_list_width";
  DROP TYPE "public"."enum__pages_v_blocks_text_section_justify_last_line";
  DROP TYPE "public"."enum__pages_v_blocks_divider_show_on";
  DROP TYPE "public"."enum__pages_v_blocks_divider_desktop_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_divider_mobile_spacing";`)
}
