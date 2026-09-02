ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "parent_id" text;
CREATE INDEX IF NOT EXISTS "comments_parent_id_idx" ON "comments" ("parent_id");
