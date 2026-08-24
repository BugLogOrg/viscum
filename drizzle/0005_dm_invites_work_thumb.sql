-- 直依頼招待着地用サムネ（別端末でも見えるようスナップショット）
ALTER TABLE "dm_invites" ADD COLUMN IF NOT EXISTS "work_thumb_url" text;
