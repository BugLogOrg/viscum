import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

/** Auth.js / アプリ共通のユーザー */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  name: text("name"),
  email: text("email").unique(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * シード（作品）。
 * soft KPI（閲覧・emo・気になる）はシーダーの広告実績用。公開信用スコアには使わない（ADR-013／014）。
 */
export const works = pgTable("works", {
  id: text("id").primaryKey(),
  seederId: text("seeder_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  focusNote: text("focus_note"),
  externalUrl: text("external_url").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  /** none | open | pay_soon | closed */
  status: text("status").notNull().default("none"),
  prizeYen: integer("prize_yen"),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  thumbUrl: text("thumb_url"),
  viewCount: integer("view_count").notNull().default(0),
  emoCount: integer("emo_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type WorkRow = typeof works.$inferSelect;
