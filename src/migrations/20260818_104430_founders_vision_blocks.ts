import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_media_band_width" AS ENUM('half', 'three-fifths', 'seven-tenths', 'full');
  CREATE TYPE "public"."enum_pages_blocks_media_band_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_pages_blocks_media_band_aspect_ratio" AS ENUM('natural', 'square', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_media_band_frame" AS ENUM('none', 'hairline');
  CREATE TYPE "public"."enum_pages_blocks_media_band_panel_background" AS ENUM('none', 'black');
  CREATE TYPE "public"."enum_pages_blocks_media_band_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_media_band_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_section_intro_heading_style" AS ENUM('display', 'section-caps');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_width" AS ENUM('half', 'three-fifths', 'seven-tenths', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_aspect_ratio" AS ENUM('natural', 'square', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_frame" AS ENUM('none', 'hairline');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_panel_background" AS ENUM('none', 'black');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_media_band_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_heading_style" AS ENUM('display', 'section-caps');
  CREATE TABLE "pages_blocks_media_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"width" "enum_pages_blocks_media_band_width" DEFAULT 'three-fifths',
  	"align" "enum_pages_blocks_media_band_align" DEFAULT 'center',
  	"aspect_ratio" "enum_pages_blocks_media_band_aspect_ratio" DEFAULT 'natural',
  	"frame" "enum_pages_blocks_media_band_frame" DEFAULT 'none',
  	"panel_background" "enum_pages_blocks_media_band_panel_background" DEFAULT 'none',
  	"top_spacing" "enum_pages_blocks_media_band_top_spacing" DEFAULT 'md',
  	"bottom_spacing" "enum_pages_blocks_media_band_bottom_spacing" DEFAULT 'md',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"width" "enum__pages_v_blocks_media_band_width" DEFAULT 'three-fifths',
  	"align" "enum__pages_v_blocks_media_band_align" DEFAULT 'center',
  	"aspect_ratio" "enum__pages_v_blocks_media_band_aspect_ratio" DEFAULT 'natural',
  	"frame" "enum__pages_v_blocks_media_band_frame" DEFAULT 'none',
  	"panel_background" "enum__pages_v_blocks_media_band_panel_background" DEFAULT 'none',
  	"top_spacing" "enum__pages_v_blocks_media_band_top_spacing" DEFAULT 'md',
  	"bottom_spacing" "enum__pages_v_blocks_media_band_bottom_spacing" DEFAULT 'md',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"source" varchar DEFAULT 'home-newsletter',
  	"subscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "heading_style" "enum_pages_blocks_section_intro_heading_style" DEFAULT 'display';
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "heading_style" "enum__pages_v_blocks_section_intro_heading_style" DEFAULT 'display';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "newsletter_subscribers_id" integer;
  ALTER TABLE "pages_blocks_media_band" ADD CONSTRAINT "pages_blocks_media_band_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_band" ADD CONSTRAINT "pages_blocks_media_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_band" ADD CONSTRAINT "_pages_v_blocks_media_band_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_band" ADD CONSTRAINT "_pages_v_blocks_media_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_media_band_order_idx" ON "pages_blocks_media_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_band_parent_id_idx" ON "pages_blocks_media_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_band_path_idx" ON "pages_blocks_media_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_band_media_idx" ON "pages_blocks_media_band" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_media_band_order_idx" ON "_pages_v_blocks_media_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_band_parent_id_idx" ON "_pages_v_blocks_media_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_band_path_idx" ON "_pages_v_blocks_media_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_band_media_idx" ON "_pages_v_blocks_media_band" USING btree ("media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "newsletter_subscribers_updated_at_idx" ON "newsletter_subscribers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'payload_locked_documents_rels_newsletter_subscribers_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk" FOREIGN KEY ("newsletter_subscribers_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END$$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_newsletter_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_subscribers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_media_band" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_band" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_media_band" CASCADE;
  DROP TABLE "_pages_v_blocks_media_band" CASCADE;
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "heading_style";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "heading_style";
  DROP TYPE "public"."enum_pages_blocks_media_band_width";
  DROP TYPE "public"."enum_pages_blocks_media_band_align";
  DROP TYPE "public"."enum_pages_blocks_media_band_aspect_ratio";
  DROP TYPE "public"."enum_pages_blocks_media_band_frame";
  DROP TYPE "public"."enum_pages_blocks_media_band_panel_background";
  DROP TYPE "public"."enum_pages_blocks_media_band_top_spacing";
  DROP TYPE "public"."enum_pages_blocks_media_band_bottom_spacing";
  DROP TYPE "public"."enum_pages_blocks_section_intro_heading_style";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_width";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_align";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_aspect_ratio";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_frame";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_panel_background";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_top_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_media_band_bottom_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_heading_style";`)
}
