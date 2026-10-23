import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_review_carousel_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"author" varchar,
  	"details" varchar
  );
  
  CREATE TABLE "pages_blocks_review_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_review_carousel_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"author" varchar,
  	"details" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_review_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_review_carousel_reviews" ADD CONSTRAINT "pages_blocks_review_carousel_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_review_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_review_carousel" ADD CONSTRAINT "pages_blocks_review_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_review_carousel_reviews" ADD CONSTRAINT "_pages_v_blocks_review_carousel_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_review_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_review_carousel" ADD CONSTRAINT "_pages_v_blocks_review_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_review_carousel_reviews_order_idx" ON "pages_blocks_review_carousel_reviews" USING btree ("_order");
  CREATE INDEX "pages_blocks_review_carousel_reviews_parent_id_idx" ON "pages_blocks_review_carousel_reviews" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_review_carousel_order_idx" ON "pages_blocks_review_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_review_carousel_parent_id_idx" ON "pages_blocks_review_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_review_carousel_path_idx" ON "pages_blocks_review_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_review_carousel_reviews_order_idx" ON "_pages_v_blocks_review_carousel_reviews" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_review_carousel_reviews_parent_id_idx" ON "_pages_v_blocks_review_carousel_reviews" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_review_carousel_order_idx" ON "_pages_v_blocks_review_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_review_carousel_parent_id_idx" ON "_pages_v_blocks_review_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_review_carousel_path_idx" ON "_pages_v_blocks_review_carousel" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_review_carousel_reviews" CASCADE;
  DROP TABLE "pages_blocks_review_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_review_carousel_reviews" CASCADE;
  DROP TABLE "_pages_v_blocks_review_carousel" CASCADE;`)
}
