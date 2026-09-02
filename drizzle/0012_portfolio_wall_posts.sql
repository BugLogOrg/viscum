CREATE TABLE IF NOT EXISTS "portfolio_wall_posts" (
  "id" text PRIMARY KEY NOT NULL,
  "portfolio_user_id" text NOT NULL,
  "author_id" text NOT NULL,
  "parent_id" text,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_wall_posts" ADD CONSTRAINT "portfolio_wall_posts_portfolio_user_id_users_id_fk" FOREIGN KEY ("portfolio_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_wall_posts" ADD CONSTRAINT "portfolio_wall_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_wall_portfolio_idx" ON "portfolio_wall_posts" USING btree ("portfolio_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_wall_parent_idx" ON "portfolio_wall_posts" USING btree ("parent_id");
