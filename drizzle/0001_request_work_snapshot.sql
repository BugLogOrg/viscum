-- 直依頼：作品サムネ／要約のスナップショット（受け手が local_* を開けなくても分かる）
ALTER TABLE "request_dms" ADD COLUMN IF NOT EXISTS "work_thumb_url" text;
ALTER TABLE "request_dms" ADD COLUMN IF NOT EXISTS "work_summary" text;
