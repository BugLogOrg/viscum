-- 直依頼の希望締切（ソフト。超過＝即失効ではない）
ALTER TABLE "request_dms" ADD COLUMN IF NOT EXISTS "closes_at" timestamp with time zone;
