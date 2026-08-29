-- シーダーのお礼ワンタップ（無料）。採用・褒賞とは別。
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "thanked_at" timestamp with time zone;
