import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_section_intro_cta2_style" AS ENUM('filled-red', 'outlined');
  CREATE TYPE "public"."enum_pages_blocks_section_intro_cta2_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_cta2_style" AS ENUM('filled-red', 'outlined');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_cta2_link_type" AS ENUM('reference', 'custom');
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "cta2_label" varchar;
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "cta2_style" "enum_pages_blocks_section_intro_cta2_style" DEFAULT 'filled-red';
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "cta2_link_type" "enum_pages_blocks_section_intro_cta2_link_type" DEFAULT 'reference';
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "cta2_link_new_tab" boolean;
  ALTER TABLE "pages_blocks_section_intro" ADD COLUMN "cta2_link_url" varchar;
  ALTER TABLE "pages_blocks_visit_info" ADD COLUMN "intro_headline" jsonb;
  ALTER TABLE "pages_blocks_visit_info" ADD COLUMN "intro_body" jsonb;
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "cta2_label" varchar;
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "cta2_style" "enum__pages_v_blocks_section_intro_cta2_style" DEFAULT 'filled-red';
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "cta2_link_type" "enum__pages_v_blocks_section_intro_cta2_link_type" DEFAULT 'reference';
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "cta2_link_new_tab" boolean;
  ALTER TABLE "_pages_v_blocks_section_intro" ADD COLUMN "cta2_link_url" varchar;
  ALTER TABLE "_pages_v_blocks_visit_info" ADD COLUMN "intro_headline" jsonb;
  ALTER TABLE "_pages_v_blocks_visit_info" ADD COLUMN "intro_body" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "cta2_label";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "cta2_style";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "cta2_link_type";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "cta2_link_new_tab";
  ALTER TABLE "pages_blocks_section_intro" DROP COLUMN "cta2_link_url";
  ALTER TABLE "pages_blocks_visit_info" DROP COLUMN "intro_headline";
  ALTER TABLE "pages_blocks_visit_info" DROP COLUMN "intro_body";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "cta2_label";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "cta2_style";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "cta2_link_type";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "cta2_link_new_tab";
  ALTER TABLE "_pages_v_blocks_section_intro" DROP COLUMN "cta2_link_url";
  ALTER TABLE "_pages_v_blocks_visit_info" DROP COLUMN "intro_headline";
  ALTER TABLE "_pages_v_blocks_visit_info" DROP COLUMN "intro_body";
  DROP TYPE "public"."enum_pages_blocks_section_intro_cta2_style";
  DROP TYPE "public"."enum_pages_blocks_section_intro_cta2_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_cta2_style";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_cta2_link_type";`)
}
