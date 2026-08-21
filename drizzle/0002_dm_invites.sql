-- 未登録者向け共有着地（local_* でも別端末で開ける）
CREATE TABLE IF NOT EXISTS "dm_invites" (
  "id" text PRIMARY KEY NOT NULL,
  "from_user_id" text NOT NULL REFERENCES "users"("id"),
  "work_id" text NOT NULL,
  "work_title" text NOT NULL,
  "work_external_url" text,
  "work_summary" text,
  "amount_yen" integer DEFAULT 5000 NOT NULL,
  "pitch" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "dm_invites_from_idx" ON "dm_invites" ("from_user_id");
