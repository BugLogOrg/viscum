import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  primaryKey,
  index,
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
 * シード（作品）＝募集の器。
 * soft KPI はシーダーの広告実績用。公開信用スコアには使わない（ADR-013／014／016）。
 * 締切は closes_at／status。支払いは payments 表（混ぜない）。
 */
export const works = pgTable("works", {
  id: text("id").primaryKey(),
  seederId: text("seeder_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  /** @deprecated 足場は scaffold_lines へ。互換のため残す */
  focusNote: text("focus_note"),
  /** 聞くこと／募集の目安（足場） */
  scaffoldLines: jsonb("scaffold_lines").$type<string[]>(),
  externalUrl: text("external_url").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  /**
   * free_comment | first_impression | brush_up | public_boost
   */
  plan: text("plan"),
  /** none | open | pay_soon | closed — 募集の器のみ */
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

/**
 * コメント／公開ブースト報告。
 * 採用マークは adopted_at。支払いは payments へ。
 * work_id はデモ作品IDも許すため FK なし（works 全面 Neon 化までアプリ整合）。
 */
export const comments = pgTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workId: text("work_id").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    /** Blob 等の公開URL配列（本体バイナリはDBに置かない） */
    imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
    /** シーダーが採用した時刻。null＝未採用 */
    adoptedAt: timestamp("adopted_at", { withTimezone: true }),
    /** 締切後投稿（賞金対象外・ADR-015） */
    afterClose: boolean("after_close").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("comments_work_id_idx").on(t.workId)],
);

/**
 * 1払い＝1行。Stripe の正本（段階C）。
 * checkout＝シーダー義務完了／payout＝メンター受取（分ける）。
 */
export const payments = pgTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** field_adopt | public_boost_reward | direct_request */
  kind: text("kind").notNull(),
  workId: text("work_id").references(() => works.id, {
    onDelete: "set null",
  }),
  commentId: text("comment_id").references(() => comments.id, {
    onDelete: "set null",
  }),
  /** 直依頼案件ID（別表接続は後段） */
  requestId: text("request_id"),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: text("to_user_id")
    .notNull()
    .references(() => users.id),
  amountYen: integer("amount_yen").notNull(),
  /** none | pending | paid | failed | refunded */
  checkoutStatus: text("checkout_status").notNull().default("none"),
  /** none | eligible | pending | paid | failed */
  payoutStatus: text("payout_status").notNull().default("none"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"),
  /** Checkout 成功＝シーダー義務完了・層B加算 */
  paidAt: timestamp("paid_at", { withTimezone: true }),
  /** Connect 出金完了＝メンター受取 */
  payoutAt: timestamp("payout_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type WorkRow = typeof works.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;

export type WorkPlan =
  | "free_comment"
  | "first_impression"
  | "brush_up"
  | "public_boost";

export type WorkStatus = "none" | "open" | "pay_soon" | "closed";

export type PaymentKind =
  | "field_adopt"
  | "public_boost_reward"
  | "direct_request";

export type CheckoutStatus =
  | "none"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PayoutStatus =
  | "none"
  | "eligible"
  | "pending"
  | "paid"
  | "failed";
