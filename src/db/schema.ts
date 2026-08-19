import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "@auth/core/adapters";

/** Auth.js / アプリ共通のユーザー */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** 英語ID。Magic Link 初回は未設定→オンボーディングで決める */
  handle: text("handle").unique(),
  /** アカウント名（表示名・メール「さん」） */
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  /** アイコンURLまたは data URL（デモ可） */
  image: text("image"),
  /** 公開一言 */
  bio: text("bio"),
  /** 加入時の専門タグ（推奨セット） */
  specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
  /** 初回ウェルカム完了時刻。null の間だけオンボーディングへ */
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Auth.js OAuth / Email リンク用 */
export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

/** Magic Link 検証トークン */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/**
 * シード（作品）。
 * soft KPI（閲覧・スキ・気になる）はシーダーの広告実績用。公開信用スコアには使わない（ADR-013／014／016）。
 * emo_count 列名は歴史的。UI表記はスキ。
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
