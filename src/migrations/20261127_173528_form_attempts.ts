import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Form Attempts (src/collections/FormAttempts.ts): the hidden table behind
 * the per-connection cap on form sends (src/utilities/rateLimit.ts).
 *
 * Additive only: one new table with its indexes, plus the column, foreign
 * key and index Payload's document-lock table keeps for every collection.
 * Every statement is guarded, so running it on a database that already has
 * any of them changes nothing. Generated with migrate:create, then guarded
 * by hand. lock_timeout, as in 20261126_114800_upgrade_394: the ALTER on
 * payload_locked_documents_rels takes a brief exclusive lock, so if live
 * queries hold that table for more than 10 s the migration (and the build)
 * fails with nothing changed, instead of queueing requests behind it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  SET LOCAL lock_timeout = '10s';
  CREATE TABLE IF NOT EXISTS "form_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "form_attempts_id" integer;
  CREATE INDEX IF NOT EXISTS "form_attempts_key_idx" ON "form_attempts" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "form_attempts_updated_at_idx" ON "form_attempts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "form_attempts_created_at_idx" ON "form_attempts" USING btree ("created_at");
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_attempts_fk" FOREIGN KEY ("form_attempts_id") REFERENCES "public"."form_attempts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_form_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("form_attempts_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  SET LOCAL lock_timeout = '10s';
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_form_attempts_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_form_attempts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "form_attempts_id";
  DROP TABLE IF EXISTS "form_attempts" CASCADE;`)
}
