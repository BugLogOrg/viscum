-- 外リンク直依頼: 招待発行時点でスレを先出し（to は返事で割当）
ALTER TABLE "request_dms" ALTER COLUMN "to_user_id" DROP NOT NULL;
ALTER TABLE "request_dms" ADD COLUMN IF NOT EXISTS "invite_id" text;
CREATE INDEX IF NOT EXISTS "request_dms_invite_idx" ON "request_dms" ("invite_id");
