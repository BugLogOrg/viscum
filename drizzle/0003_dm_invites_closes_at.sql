-- 招待着地：締切
ALTER TABLE "dm_invites" ADD COLUMN IF NOT EXISTS "closes_at" timestamp with time zone;
